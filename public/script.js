import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configuração da cena
let scene, camera, renderer, controls;
let nodeMeshes = [];
let linkMeshes = [];
let labelSprites = [];
let simulationData = null;
let isPlaying = false;
let currentSimTime = 0;
let animationSpeed = 1;
let animationFrameId = null;
let selectedNode = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Cores
const COLORS = {
    notInfected: 0x00ff00,
    seed: 0xffff00,
    infected: 0xff0000,
    unreachable: 0x666666,
    link: 0x444444
};

// Elementos DOM
const categorySelect = document.getElementById('categorySelect');
const fileSelect = document.getElementById('fileSelect');
const loadBtn = document.getElementById('loadBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const loading = document.getElementById('loading');
const controlsPanel = document.getElementById('controls-panel');

// Inicializar Three.js
function initThree() {
    const container = document.getElementById('canvas3d');
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 200, 1000);
    
    // Câmera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(100, 100, 100);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Controles de órbita
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 500;
    
    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x00ff88, 0.5);
    pointLight.position.set(0, 50, 0);
    scene.add(pointLight);
    
    // Resize handler
    window.addEventListener('resize', onWindowResize);
    
    // Click handler para seleção de nós
    renderer.domElement.addEventListener('click', onNodeClick);
    
    // Iniciar loop de renderização
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isPlaying && simulationData) {
        updateSimulation();
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Carregar lista de arquivos
async function loadFileList() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        populateFileSelect(data.files);
    } catch (error) {
        console.error('Erro ao carregar lista de arquivos:', error);
        alert('Erro ao carregar lista de arquivos. Verifique se o servidor está rodando.');
    }
}

function populateFileSelect(files) {
    const currentCategory = categorySelect.value;
    
    fileSelect.innerHTML = '<option value="">Selecione um arquivo...</option>';
    
    const filteredFiles = currentCategory === 'all' 
        ? files 
        : files.filter(f => f.category === currentCategory);
    
    filteredFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file.path;
        option.textContent = `${file.name} (${file.category})`;
        fileSelect.appendChild(option);
    });
}

// Carregar e simular
async function loadAndSimulate() {
    const selectedFile = fileSelect.value;
    
    if (!selectedFile) {
        alert('Por favor, selecione um arquivo.');
        return;
    }
    
    loading.style.display = 'block';
    loadBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/simulate?file=${encodeURIComponent(selectedFile)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao carregar simulação');
        }
        
        const payload = await response.json();
        applySimulationPayload(payload);
        
    } catch (error) {
        console.error('Erro ao carregar simulação:', error);
        alert(`Erro: ${error.message}`);
    } finally {
        loading.style.display = 'none';
        loadBtn.disabled = false;
    }
}

function clearScene() {
    // Remover meshes de nós
    nodeMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
        scene.remove(mesh);
    });
    nodeMeshes = [];
    
    // Remover meshes de links
    linkMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
        scene.remove(mesh);
    });
    linkMeshes = [];
    
    // Remover labels
    labelSprites.forEach(sprite => {
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.dispose();
        scene.remove(sprite);
    });
    labelSprites = [];
    
    // Limpar seleção
    selectedNode = null;
    hideNodeInfo();
}

function createVisualization(data) {
    const { nodes, links } = data;
    
    // Criar links (arestas)
    links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return;
        
        const points = [
            new THREE.Vector3(sourceNode.x, sourceNode.y, sourceNode.z),
            new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: COLORS.link,
            opacity: 0.3,
            transparent: true
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        linkMeshes.push(line);
    });
    
    // Criar nós (esferas)
    nodes.forEach(node => {
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: getNodeColor(node, 0),
            emissive: getNodeColor(node, 0),
            emissiveIntensity: 0.3,
            metalness: 0.5,
            roughness: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(node.x, node.y, node.z);
        mesh.userData = node; // Armazenar dados do nó
        
        scene.add(mesh);
        nodeMeshes.push(mesh);
        
        // Criar label para o nó
        const label = createTextLabel(node.id);
        label.position.set(node.x, node.y + 4, node.z);
        scene.add(label);
        labelSprites.push(label);
    });
    
    // Ajustar câmera para enquadrar a cena
    adjustCamera(nodes);
}

function createTextLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    
    // Fundo semi-transparente
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texto
    context.font = 'Bold 32px Arial';
    context.fillStyle = '#00ff88';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(8, 4, 1);
    
    return sprite;
}

function getNodeColor(node, simTime) {
    if (!node.isReachable) {
        return COLORS.unreachable;
    }
    
    if (node.isInfectedStart) {
        return COLORS.seed;
    }
    
    if (simTime >= node.infectedTime) {
        return COLORS.infected;
    }
    
    return COLORS.notInfected;
}

function adjustCamera(nodes) {
    if (nodes.length === 0) return;
    
    // Calcular bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        minZ = Math.min(minZ, node.z);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
        maxZ = Math.max(maxZ, node.z);
    });
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    const sizeX = maxX - minX;
    const sizeZ = maxZ - minZ;
    const maxSize = Math.max(sizeX, sizeZ, 50);
    
    const distance = maxSize * 1.5;
    
    camera.position.set(
        centerX + distance * 0.7,
        centerY + distance * 0.7,
        centerZ + distance * 0.7
    );
    
    controls.target.set(centerX, centerY, centerZ);
    controls.update();
}

function updateSimulation() {
    if (!simulationData) return;
    
    // Incrementar tempo de simulação
    currentSimTime += 0.016 * animationSpeed; // ~60 FPS
    
    // Atualizar cores dos nós
    nodeMeshes.forEach(mesh => {
        const node = mesh.userData;
        const newColor = getNodeColor(node, currentSimTime);
        
        mesh.material.color.setHex(newColor);
        mesh.material.emissive.setHex(newColor);
    });
    
    // Atualizar painel de status
    updateStatusPanel();
    
    // Atualizar barra de progresso
    updateProgressBar();
    
    // Atualizar info do nó selecionado
    if (selectedNode) {
        updateNodeInfoPanel(selectedNode);
    }
    
    // Parar quando atingir o tempo máximo
    if (simulationData.meta.maxTime && currentSimTime >= simulationData.meta.maxTime + 2) {
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';
    }
}

function initProgressBar() {
    if (!simulationData) return;
    
    const progressPanel = document.getElementById('progress-panel');
    progressPanel.style.display = 'block';
    
    const maxTime = simulationData.meta.maxTime || 0;
    document.getElementById('progress-max-time').textContent = `${maxTime.toFixed(0)}h`;
    
    // Criar timeline visual com orbes
    createInfectionTimeline();
    
    updateProgressBar();
}

function createInfectionTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    // Filtrar e ordenar nós por tempo de infecção
    const infectionSequence = simulationData.nodes
        .filter(n => n.isReachable && n.infectedTime !== null && n.infectedTime !== Infinity)
        .sort((a, b) => a.infectedTime - b.infectedTime);
    
    if (infectionSequence.length === 0) return;
    
    const maxTime = simulationData.meta.maxTime || 1;
    const containerWidth = container.offsetWidth || 750;
    const containerHeight = 80;
    
    // Criar SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', containerHeight);
    svg.style.overflow = 'visible';
    
    // Criar linha de conexão
    const lineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lineGroup.setAttribute('id', 'timeline-line-group');
    
    // Desenhar linha de base
    const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = '';
    
    infectionSequence.forEach((node, idx) => {
        const x = (node.infectedTime / maxTime) * containerWidth;
        const y = containerHeight / 2;
        
        if (idx === 0) {
            pathData += `M ${x} ${y}`;
        } else {
            pathData += ` L ${x} ${y}`;
        }
    });
    
    baseLine.setAttribute('d', pathData);
    baseLine.setAttribute('stroke', '#444');
    baseLine.setAttribute('stroke-width', '2');
    baseLine.setAttribute('fill', 'none');
    baseLine.setAttribute('id', 'base-timeline-line');
    lineGroup.appendChild(baseLine);
    
    // Criar linha de progresso (será atualizada dinamicamente)
    const progressLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    progressLine.setAttribute('d', pathData);
    progressLine.setAttribute('stroke', '#00ff88');
    progressLine.setAttribute('stroke-width', '3');
    progressLine.setAttribute('fill', 'none');
    progressLine.setAttribute('stroke-dasharray', '0 10000');
    progressLine.setAttribute('id', 'progress-timeline-line');
    lineGroup.appendChild(progressLine);
    
    svg.appendChild(lineGroup);
    
    // Criar orbes para cada nó
    const orbesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    orbesGroup.setAttribute('id', 'timeline-orbes-group');
    
    infectionSequence.forEach((node, idx) => {
        const x = (node.infectedTime / maxTime) * containerWidth;
        const y = containerHeight / 2;
        
        // Grupo para cada orbe
        const orbeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        orbeGroup.setAttribute('class', 'timeline-orbe');
        orbeGroup.setAttribute('data-node-id', node.id);
        orbeGroup.setAttribute('data-time', node.infectedTime);
        
        // Círculo externo (glow)
        const outerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerCircle.setAttribute('cx', x);
        outerCircle.setAttribute('cy', y);
        outerCircle.setAttribute('r', '10');
        outerCircle.setAttribute('fill', node.isInfectedStart ? '#ffff00' : '#666');
        outerCircle.setAttribute('opacity', '0.3');
        outerCircle.setAttribute('class', 'orbe-glow');
        
        // Círculo interno (núcleo)
        const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerCircle.setAttribute('cx', x);
        innerCircle.setAttribute('cy', y);
        innerCircle.setAttribute('r', '6');
        innerCircle.setAttribute('fill', node.isInfectedStart ? '#ffff00' : '#666');
        innerCircle.setAttribute('stroke', '#222');
        innerCircle.setAttribute('stroke-width', '2');
        innerCircle.setAttribute('class', 'orbe-core');
        
        // Label do nó (ID)
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y - 18);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#00ff88');
        text.textContent = node.id;
        text.setAttribute('class', 'orbe-label');
        
        // Tempo de infecção
        const timeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timeText.setAttribute('x', x);
        timeText.setAttribute('y', y + 25);
        timeText.setAttribute('text-anchor', 'middle');
        timeText.setAttribute('font-size', '9');
        timeText.setAttribute('fill', '#aaa');
        timeText.textContent = `${node.infectedTime.toFixed(1)}h`;
        timeText.setAttribute('class', 'orbe-time');
        
        orbeGroup.appendChild(outerCircle);
        orbeGroup.appendChild(innerCircle);
        orbeGroup.appendChild(text);
        orbeGroup.appendChild(timeText);
        
        orbesGroup.appendChild(orbeGroup);
    });
    
    svg.appendChild(orbesGroup);
    container.appendChild(svg);
}

function updateProgressBar() {
    if (!simulationData) return;
    
    const maxTime = simulationData.meta.maxTime || 1;
    const progress = Math.min((currentSimTime / maxTime) * 100, 100);
    
    const progressFill = document.getElementById('progress-bar-fill');
    progressFill.style.width = `${progress}%`;
    
    // Contar quantos nós foram infectados até agora
    const infectedNow = simulationData.nodes.filter(n => 
        n.isReachable && n.infectedTime <= currentSimTime
    ).length;
    
    const totalInfectable = simulationData.nodes.filter(n => n.isReachable).length;
    
    const progressInfo = document.getElementById('progress-info');
    progressInfo.textContent = `${infectedNow} / ${totalInfectable} dispositivos infectados (${progress.toFixed(1)}%)`;
    
    // Atualizar orbes na timeline
    updateTimelineOrbes();
}

function updateTimelineOrbes() {
    const orbes = document.querySelectorAll('.timeline-orbe');
    const progressLine = document.getElementById('progress-timeline-line');
    
    if (!orbes.length || !progressLine) return;
    
    const maxTime = simulationData.meta.maxTime || 1;
    const containerWidth = document.getElementById('timeline-container').offsetWidth || 750;
    
    let pathLength = 0;
    let lastInfectedX = 0;
    
    orbes.forEach((orbe, idx) => {
        const nodeTime = parseFloat(orbe.getAttribute('data-time'));
        const isInfected = currentSimTime >= nodeTime;
        
        const outerCircle = orbe.querySelector('.orbe-glow');
        const innerCircle = orbe.querySelector('.orbe-core');
        const label = orbe.querySelector('.orbe-label');
        
        if (isInfected) {
            // Nó infectado - vermelho brilhante
            outerCircle.setAttribute('fill', '#ff0000');
            outerCircle.setAttribute('opacity', '0.6');
            innerCircle.setAttribute('fill', '#ff0000');
            label.setAttribute('fill', '#ff0000');
            
            // Calcular comprimento da linha até este ponto
            const x = (nodeTime / maxTime) * containerWidth;
            lastInfectedX = x;
            
            if (idx > 0) {
                const prevOrbe = orbes[idx - 1];
                const prevTime = parseFloat(prevOrbe.getAttribute('data-time'));
                const prevX = (prevTime / maxTime) * containerWidth;
                const prevY = 40; // containerHeight / 2
                const currY = 40;
                
                pathLength += Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(currY - prevY, 2));
            }
        } else {
            // Nó ainda não infectado
            const nodeId = orbe.getAttribute('data-node-id');
            const node = simulationData.nodes.find(n => n.id === nodeId);
            
            if (node && node.isInfectedStart) {
                // Seeds iniciais permanecem amarelos
                outerCircle.setAttribute('fill', '#ffff00');
                outerCircle.setAttribute('opacity', '0.3');
                innerCircle.setAttribute('fill', '#ffff00');
                label.setAttribute('fill', '#00ff88');
            } else {
                // Não infectado - cinza
                outerCircle.setAttribute('fill', '#666');
                outerCircle.setAttribute('opacity', '0.3');
                innerCircle.setAttribute('fill', '#666');
                label.setAttribute('fill', '#00ff88');
            }
        }
    });
    
    // Atualizar stroke-dasharray para animar a linha de progresso
    progressLine.setAttribute('stroke-dasharray', `${pathLength} 10000`);
}

function onNodeClick(event) {
    if (!simulationData) return;
    
    // Calcular posição do mouse em coordenadas normalizadas (-1 a +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Atualizar raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Verificar interseções
    const intersects = raycaster.intersectObjects(nodeMeshes);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        selectNode(clickedMesh);
    } else {
        deselectNode();
    }
}

function selectNode(mesh) {
    // Desselecionar nó anterior
    if (selectedNode && selectedNode.mesh) {
        selectedNode.mesh.scale.set(1, 1, 1);
    }
    
    // Selecionar novo nó
    mesh.scale.set(1.3, 1.3, 1.3);
    selectedNode = {
        mesh: mesh,
        data: mesh.userData
    };
    
    // Mostrar painel de informações
    showNodeInfo(mesh.userData);
}

function deselectNode() {
    if (selectedNode && selectedNode.mesh) {
        selectedNode.mesh.scale.set(1, 1, 1);
    }
    selectedNode = null;
    hideNodeInfo();
}

function showNodeInfo(node) {
    const panel = document.getElementById('node-info-panel');
    panel.style.display = 'block';
    updateNodeInfoPanel(node);
}

function updateNodeInfoPanel(node) {
    document.getElementById('nodeInfoId').textContent = node.id;
    
    const infectionTime = node.infectedTime === null || node.infectedTime === Infinity 
        ? 'Nunca' 
        : `${node.infectedTime}h`;
    document.getElementById('nodeInfoTime').textContent = infectionTime;
    
    // Contar conexões
    const connections = simulationData.links.filter(l => 
        l.source === node.id || l.target === node.id
    ).length;
    document.getElementById('nodeInfoConnections').textContent = connections;
    
    const status = node.isInfectedStart 
        ? 'Seed Inicial' 
        : (currentSimTime >= node.infectedTime ? 'Infectado' : 'Não Infectado');
    document.getElementById('nodeInfoStatus').textContent = status;
}

function hideNodeInfo() {
    const panel = document.getElementById('node-info-panel');
    panel.style.display = 'none';
}

function updateStatusPanel() {
    if (!simulationData) return;
    
    document.getElementById('currentTime').textContent = `${currentSimTime.toFixed(1)}h`;
    
    const infectedCount = nodeMeshes.filter(mesh => {
        const node = mesh.userData;
        return node.isReachable && currentSimTime >= node.infectedTime;
    }).length;
    
    document.getElementById('infectedCount').textContent = infectedCount;
    document.getElementById('totalNodes').textContent = simulationData.meta.totalNodes;
    document.getElementById('topology').textContent = simulationData.meta.topology;
    document.getElementById('maxTime').textContent = 
        simulationData.meta.maxTime !== null ? `${simulationData.meta.maxTime}h` : '-';
    document.getElementById('avgTime').textContent = 
        simulationData.meta.averageTime !== null ? `${simulationData.meta.averageTime}h` : '-';
}

// Event listeners
categorySelect.addEventListener('change', async () => {
    const response = await fetch('/api/files');
    const data = await response.json();
    populateFileSelect(data.files);
});

loadBtn.addEventListener('click', loadAndSimulate);

playPauseBtn.addEventListener('click', () => {
    if (!simulationData) return;
    
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
    } else {
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';
    }
});

resetBtn.addEventListener('click', () => {
    currentSimTime = 0;
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';
    updateSimulation();
    updateProgressBar();
});

speedSlider.addEventListener('input', (e) => {
    animationSpeed = parseFloat(e.target.value);
    speedValue.textContent = `${animationSpeed.toFixed(1)}x`;
});

// ========== FUNCIONALIDADES DE ABAS ==========
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Atualizar botões ativos
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mostrar conteúdo da aba
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tab-${targetTab}`).style.display = 'block';
    });
});

// ========== GERAR INSTÂNCIA COM IA ==========
const generateBtn = document.getElementById('generateBtn');
const genTopology = document.getElementById('genTopology');
const genVertices = document.getElementById('genVertices');
const genInfected = document.getElementById('genInfected');

// Validar input de infectados
genVertices.addEventListener('input', () => {
    const maxInfected = parseInt(genVertices.value) - 1;
    genInfected.max = maxInfected;
    if (parseInt(genInfected.value) >= parseInt(genVertices.value)) {
        genInfected.value = maxInfected;
    }
});

generateBtn.addEventListener('click', async () => {
    const topology = genTopology.value;
    const numVertices = parseInt(genVertices.value);
    const numInfected = parseInt(genInfected.value);
    
    if (numVertices < 5 || numVertices > 30) {
        alert('Número de vértices deve estar entre 5 e 30');
        return;
    }
    
    if (numInfected < 1 || numInfected >= numVertices) {
        alert(`Número de infectados deve estar entre 1 e ${numVertices - 1}`);
        return;
    }
    
    loading.style.display = 'block';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topology, numVertices, numInfected })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao gerar instância');
        }
        
        const result = await response.json();
        alert(`Instância gerada com sucesso: ${result.filename}`);
        
        // Recarregar lista de arquivos e selecionar o novo
        await loadFileList();
        fileSelect.value = result.path;
        
        // Voltar para aba de carregar
        document.querySelector('[data-tab="load"]').click();
        
    } catch (error) {
        console.error('Erro ao gerar instância:', error);
        alert(`Erro: ${error.message}`);
    } finally {
        loading.style.display = 'none';
        generateBtn.disabled = false;
    }
});

// ========== GERAR MULTI-REDE ==========
const multiNumRedes = document.getElementById('multiNumRedes');
const multiRedesConfig = document.getElementById('multiRedesConfig');
const generateMultiBtn = document.getElementById('generateMultiBtn');

function updateMultiRedesConfig() {
    const numRedes = parseInt(multiNumRedes.value);
    multiRedesConfig.innerHTML = '';
    
    for (let i = 0; i < numRedes; i++) {
        const config = document.createElement('div');
        config.className = 'network-config';
        config.innerHTML = `
            <h5><i class="bi bi-wifi"></i> Rede ${i + 1}</h5>
            <label>Topologia:</label>
            <select class="multi-topology">
                <option value="estrela">Estrela</option>
                <option value="anel">Anel</option>
                <option value="malha">Malha</option>
            </select>
            <label>Vértices (5-30):</label>
            <input type="number" class="multi-vertices" min="5" max="30" value="10">
            <label>Infectados:</label>
            <input type="number" class="multi-infected" min="1" max="29" value="1">
        `;
        multiRedesConfig.appendChild(config);
    }
}

multiNumRedes.addEventListener('input', updateMultiRedesConfig);
updateMultiRedesConfig(); // Inicializar

generateMultiBtn.addEventListener('click', async () => {
    const numRedes = parseInt(multiNumRedes.value);
    const configs = document.querySelectorAll('.network-config');
    const redes = [];
    
    configs.forEach((config, idx) => {
        const topology = config.querySelector('.multi-topology').value;
        const numVertices = parseInt(config.querySelector('.multi-vertices').value);
        const numInfected = parseInt(config.querySelector('.multi-infected').value);
        
        if (numVertices < 5 || numVertices > 30) {
            alert(`Rede ${idx + 1}: Vértices devem estar entre 5 e 30`);
            return;
        }
        
        if (numInfected < 1 || numInfected >= numVertices) {
            alert(`Rede ${idx + 1}: Infectados devem estar entre 1 e ${numVertices - 1}`);
            return;
        }
        
        redes.push({ topologia: topology, numVertices, numInfectados: numInfected });
    });
    
    if (redes.length !== numRedes) return;
    
    loading.style.display = 'block';
    generateMultiBtn.disabled = true;
    
    try {
        const response = await fetch('/api/generate-multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ redes })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao gerar multi-rede');
        }
        
        const result = await response.json();
        alert(`Multi-rede gerada com sucesso: ${result.filename}`);
        
        // Recarregar lista e selecionar
        await loadFileList();
        categorySelect.value = 'multiredes';
        await loadFileList(); // Recarregar com filtro
        fileSelect.value = result.path;
        
        // Voltar para aba de carregar
        document.querySelector('[data-tab="load"]').click();
        
    } catch (error) {
        console.error('Erro ao gerar multi-rede:', error);
        alert(`Erro: ${error.message}`);
    } finally {
        loading.style.display = 'none';
        generateMultiBtn.disabled = false;
    }
});

// ========== EDIÇÃO DE GRAFO ==========
let currentGraphData = null;
const editTab = document.querySelector('[data-tab="edit"]');
const updateWeightBtn = document.getElementById('updateWeightBtn');
const deleteNodeBtn = document.getElementById('deleteNodeBtn');
// Guardar label original do botão de atualizar peso (PATCH 2)
const updateWeightBtnDefaultLabel = updateWeightBtn.innerHTML;

// Mostrar aba de edição quando um grafo for carregado
function enableEditMode() {
    editTab.style.display = 'block';
    currentGraphData = simulationData;
}

// Centraliza a aplicação de payload de simulação (evita duplicação)
function applySimulationPayload(payload) {
    // Atualiza estado global
    simulationData = payload;
    currentGraphData = payload;

    // Limpar cena anterior
    clearScene();

    // Criar visualização
    createVisualization(payload);

    // Resetar simulação
    currentSimTime = 0;
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> Play';

    // Atualizar status/painéis
    updateStatusPanel();

    // Mostrar e reinicializar barra de progresso
    initProgressBar();

    // Mostrar controles
    controlsPanel.style.display = 'block';

    // Garantir que a aba de edição esteja ligada
    enableEditMode();
}

// Helper para remover um nó via API e aplicar o novo snapshot (PATCH 3)
async function deleteNodeById(nodeId, source = 'edit') {
    if (!simulationData) {
        alert('Carregue um grafo primeiro!');
        return;
    }

    nodeId = (nodeId || '').trim().toUpperCase();

    if (!nodeId) {
        alert('Digite o ID do dispositivo');
        return;
    }

    if (!confirm(`Deseja realmente remover o dispositivo ${nodeId}?`)) {
        return;
    }

    // Validação rápida no front
    const nodes = simulationData.nodes || [];
    const exists = nodes.some(n => n.id === nodeId);
    if (!exists) {
        alert('Dispositivo não encontrado no grafo atual');
        return;
    }

    // Estado de loading
    loading.style.display = 'block';
    if (source === 'edit') {
        deleteNodeBtn.disabled = true;
    }

    try {
        const response = await fetch('/api/edit/node/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: nodeId })
        });

        if (!response.ok) {
            let errMsg = 'Erro ao remover dispositivo no servidor';
            try {
                const errBody = await response.json();
                if (errBody && errBody.message) errMsg = errBody.message;
            } catch (_) {}
            throw new Error(errMsg);
        }

        const payload = await response.json();
        applySimulationPayload(payload);

        alert(`Dispositivo ${nodeId} removido com sucesso.`);

        if (source === 'edit') {
            const deleteInput = document.getElementById('deleteNode');
            if (deleteInput) deleteInput.value = '';
        } else if (source === 'panel') {
            const panel = document.getElementById('node-info-panel');
            if (panel) panel.style.display = 'none';
            selectedNode = null;
        }
    } catch (error) {
        console.error('Erro ao remover dispositivo:', error);
        alert(`Erro: ${error.message}`);
    } finally {
        loading.style.display = 'none';
        if (source === 'edit') {
            deleteNodeBtn.disabled = false;
        }
    }
}

updateWeightBtn.addEventListener('click', async () => {
    if (!simulationData) {
        alert('Carregue um grafo primeiro!');
        return;
    }

    const originInput = document.getElementById('editOrigin');
    const targetInput = document.getElementById('editTarget');
    const weightInput = document.getElementById('editWeight');

    const origin = originInput.value.trim().toUpperCase();
    const target = targetInput.value.trim().toUpperCase();
    const weight = parseInt(weightInput.value, 10);

    if (!origin || !target) {
        alert('Digite origem e destino');
        return;
    }

    if (isNaN(weight) || weight < 0 || weight > 10) {
        alert('Peso deve estar entre 0 e 10');
        return;
    }

    // Validação rápida dos dispositivos
    const nodes = simulationData.nodes || [];
    const originNode = nodes.find(n => n.id === origin);
    const targetNode = nodes.find(n => n.id === target);

    if (!originNode || !targetNode) {
        alert('Dispositivo não encontrado no grafo atual');
        return;
    }

    try {
        updateWeightBtn.disabled = true;
        updateWeightBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Atualizando...';

        const response = await fetch('/api/edit/edge/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: origin, to: target, peso: weight })
        });

        if (!response.ok) {
            let errMsg = 'Erro ao atualizar aresta no servidor';
            try {
                const errBody = await response.json();
                if (errBody && errBody.message) errMsg = errBody.message;
            } catch (_) {}
            throw new Error(errMsg);
        }

        const payload = await response.json();
        applySimulationPayload(payload);

        alert(`Peso atualizado entre ${origin} e ${target} para ${weight}`);

        originInput.value = '';
        targetInput.value = '';
        weightInput.value = '';
    } catch (error) {
        console.error('Erro ao atualizar peso da aresta:', error);
        alert(`Erro: ${error.message}`);
    } finally {
        updateWeightBtn.disabled = false;
        updateWeightBtn.innerHTML = updateWeightBtnDefaultLabel || '<i class="bi bi-arrow-repeat"></i> Atualizar Peso';
    }
});

deleteNodeBtn.addEventListener('click', () => {
    const nodeId = document.getElementById('deleteNode').value;
    deleteNodeById(nodeId, 'edit');
});

// Botão de remover nó do painel de informações
document.getElementById('removeNodeBtn').addEventListener('click', () => {
    if (!selectedNode) return;
    const nodeId = selectedNode.data.id;
    deleteNodeById(nodeId, 'panel');
});

// Inicialização
initThree();
loadFileList();
