import { readFileSync } from 'fs';
import { resolve } from 'path';
import Grafo from './models/Grafo.js';

// Coletar topologia e número de dispositivos do texto
function extrairInfo(linhas) {
    let topologia = 'indefinida';
    let numDispositivos = 0;
    const dispositivosInfectados = [];

    for (const linha of linhas) {
        const l = linha.trim();
        if (l.startsWith('# Topologia de Rede:')) {
            topologia = l.split(':')[1].trim();
            continue;
        }
        if (l.startsWith('# Número de vértices:')) {
            numDispositivos = parseInt(l.split(':')[1].trim(), 10) || 0;
            continue;
        }
        if (l.startsWith('# Dispositivo infectado:') || l.startsWith('# Dispositivos infectados:')) {
            let rhs = (l.split(':')[1] || '').trim();
            // Remover comentários inline, se houver
            rhs = rhs.split('#', 1)[0].trim();
            if (!rhs) continue;
            // Aceita separadores vírgula, ponto-e-vírgula ou espaços
            const parts = rhs.split(/[,;]\s*|\s+/).filter(Boolean);
            dispositivosInfectados.push(...parts);
        }
    }

    const únicos = Array.from(new Set(dispositivosInfectados));
    return { topologia, numDispositivos, dispositivosInfectados: únicos };
}

// Função para ler múltiplas redes conectadas
function parseMultiRede(text) {
    const linhas = text.split(/\r?\n/);

    let quantidadeRedes = 0;
    // procurar quantidade de redes (pode estar na primeira linha ou em qualquer lugar)
    for (const linha of linhas) {
        const l = linha.trim();
        if (l.startsWith('# Quantidade de redes:')) {
            quantidadeRedes = parseInt(l.split(':')[1].trim(), 10) || 0;
            break;
        }
    }

    // inicializar redes conforme quantidade, caso exista
    const redes = [];
    if (quantidadeRedes > 0) {
        for (let i = 0; i < quantidadeRedes; i++) {
            redes.push({
                topologia: 'indefinida',
                numDispositivos: 0,
                dispositivosInfectados: [],
                arestas: []
            });
        }
    }

    let arestasConexao = [];
    let modo = null; // 'rede' | 'conexao' | null
    let redeIndex = -1;

    // primeiro, varrer linhas para capturar resumos do tipo "Topologias das Redes:", "Número de vértices:" e "Dispositivos infectados:"
    for (const linha of linhas) {
        const l = linha.trim();

        if (l.startsWith('# Topologias das Redes:')) {
            // buscar ocorrências "redeX: valor" na mesma linha
            const re = /rede\s*(\d+)\s*:\s*([^,#]+)/gi;
            let m;
            while ((m = re.exec(l)) !== null) {
                const idx = parseInt(m[1], 10) - 1;
                const val = m[2].trim();
                if (!isNaN(idx) && redes[idx]) redes[idx].topologia = val;
            }
            continue;
        }

        if (l.startsWith('# Número de vértices:')) {
            const re = /rede\s*(\d+)\s*:\s*(\d+)/gi;
            let m;
            while ((m = re.exec(l)) !== null) {
                const idx = parseInt(m[1], 10) - 1;
                const val = parseInt(m[2], 10) || 0;
                if (!isNaN(idx) && redes[idx]) redes[idx].numDispositivos = val;
            }
            continue;
        }

        if (l.startsWith('# Dispositivos infectados:')) {
            const re = /rede\s*(\d+)\s*:\s*([^,#]+)/gi;
            let m;
            while ((m = re.exec(l)) !== null) {
                const idx = parseInt(m[1], 10) - 1;
                let rhs = (m[2] || '').trim();
                rhs = rhs.split('#', 1)[0].trim();
                if (!rhs) continue;
                const parts = rhs.split(/[,;]\s*|\s+/).filter(Boolean);
                if (!isNaN(idx) && redes[idx]) {
                    redes[idx].dispositivosInfectados = Array.from(new Set([...(redes[idx].dispositivosInfectados || []), ...parts]));
                }
            }
            continue;
        }
    }

    // agora percorrer linhas para capturar seções por rede e arestas de conexão
    for (let i = 0; i < linhas.length; i++) {
        const raw = linhas[i];
        const l = raw.trim();

        // início de seção de rede: "# rede X"
        if (l.match(/^#\s*rede\s*\d+/i)) {
            modo = 'rede';
            // determinar índice da rede a partir do header, se possível
            const m = l.match(/rede\s*(\d+)/i);
            if (m) {
                redeIndex = parseInt(m[1], 10) - 1;
                // garantir que existe um objeto para essa rede
                if (redeIndex >= 0 && redes[redeIndex] === undefined) {
                    // criar redes até esse índice
                    for (let k = redes.length; k <= redeIndex; k++) {
                        redes[k] = {
                            topologia: 'indefinida',
                            numDispositivos: 0,
                            dispositivosInfectados: [],
                            arestas: []
                        };
                    }
                }
            } else {
                // fallback: sequencial
                redeIndex = Math.max(0, redeIndex + 1);
                if (redes[redeIndex] === undefined) {
                    redes[redeIndex] = {
                        topologia: 'indefinida',
                        numDispositivos: 0,
                        dispositivosInfectados: [],
                        arestas: []
                    };
                }
            }
            continue;
        }

        if (l.toLowerCase().startsWith('# aresta que conecta as redes')) {
            modo = 'conexao';
            continue;
        }

        // ignorar comentários soltos ou linhas em branco
        if (l.startsWith('#') || l === '') {
            continue;
        }

        // linhas não comentadas dependem do modo atual
        if (modo === 'rede') {
            // se não tivermos índice definido, tentar inferir pela contagem
            if (redeIndex < 0) {
                redeIndex = 0;
                if (!redes[redeIndex]) {
                    redes[redeIndex] = {
                        topologia: 'indefinida',
                        numDispositivos: 0,
                        dispositivosInfectados: [],
                        arestas: []
                    };
                }
            }
            redes[redeIndex].arestas.push(l);
        } else if (modo === 'conexao') {
            arestasConexao.push(l);
        } else {
            // linhas fora de seção: podem ser arestas de uma única rede quando só há uma rede
            if (quantidadeRedes === 1) {
                if (!redes[0]) {
                    redes[0] = {
                        topologia: 'indefinida',
                        numDispositivos: 0,
                        dispositivosInfectados: [],
                        arestas: []
                    };
                }
                redes[0].arestas.push(l);
            }
        }
    }

    // garantir valores padrão e consistência nos nomes dos campos esperados por outras funções
    for (const rede of redes) {
        if (!('topologia' in rede)) rede.topologia = 'indefinida';
        if (!('numDispositivos' in rede)) {
            // aceitar numVertices também caso tenha sido preenchido por outra lógica
            rede.numDispositivos = rede.numVertices || 0;
            delete rede.numVertices;
        }
        if (!Array.isArray(rede.dispositivosInfectados)) rede.dispositivosInfectados = [];
        rede.dispositivosInfectados = Array.from(new Set(rede.dispositivosInfectados));
        if (!Array.isArray(rede.arestas)) rede.arestas = [];
    }

    return { redesInfo: redes, arestasConexao };
}

// Cria um grafo para cada rede individual
function buildGrafosIndividuais(redesInfo) {
    return redesInfo.map(rede => {
        const grafo = new Grafo(rede.topologia, rede.numDispositivos, rede.dispositivosInfectados);
        for (const a of rede.arestas) {
            const [u, v, peso] = a.split(/\s+/);
            grafo.addAresta(u, v, Number(peso));
        }
        return grafo;
    });
}

// Cria o grafo completo com todas as redes e conexões
function buildMultiGrafo({ redesInfo, arestasConexao }) {
    let todosVertices = new Set();
    let todosInfectados = [];
    let todasArestas = [];

    for (const rede of redesInfo) {
        for (const a of rede.arestas) {
            todasArestas.push(a);
            const [u, v] = a.split(/\s+/);
            todosVertices.add(u);
            todosVertices.add(v);
        }
        todosInfectados.push(...rede.dispositivosInfectados);
    }
    for (const a of arestasConexao) {
        todasArestas.push(a);
        const [u, v] = a.split(/\s+/);
        todosVertices.add(u);
        todosVertices.add(v);
    }
    todosInfectados = Array.from(new Set(todosInfectados));
    const grafo = new Grafo('multirede', todosVertices.size, todosInfectados);

    for (const a of todasArestas) {
        const [u, v, peso] = a.split(/\s+/);
        grafo.addAresta(u, v, Number(peso));
    }
    return grafo;
}

function converterLinhaAresta(linha) {
    const semComentario = linha.split('#', 1)[0].trim();
    if (!semComentario) return null;
    const strings = semComentario.split(/\s+/);
    if (strings.length < 2) return null;
    const u = strings[0];
    const v = strings[1];
    let peso;
    if (strings.length >= 3) {
        const pesoRaw = parseFloat(strings[2]);
        if (Number.isNaN(pesoRaw) || pesoRaw < 0 || pesoRaw > 10) {
            throw new Error(`Valor de peso inválido na linha: "${semComentario}". Deve ser um número entre 0 e 10.`);
        }
        peso = pesoRaw;
    } else {
        peso = 1;
    }
    return { u, v, peso };
}

function buildGrafoFromText(text) {
    const linhas = text.split(/\r?\n/);
    const { topologia, numDispositivos, dispositivosInfectados } = extrairInfo(linhas);
    const grafo = new Grafo(topologia, numDispositivos, dispositivosInfectados);
    for (const linha of linhas) {
        const aresta = converterLinhaAresta(linha);
        if (!aresta) continue;
        grafo.addAresta(aresta.u, aresta.v, aresta.peso);
    }
    return grafo;
}

function exibirGrafo(grafo)  {
    console.log('\nGrafo carregado:\n');
    console.log(grafo.toString());
    console.log(grafo.exibirTempoContagio());
    console.log(grafo.exibirSequenciaInfeccao());
    console.log(grafo.exibirDispositivosVulneraveis());
}

// Exibe cada rede separadamente e o resultado global
export function carregarMultiRede(pathArquivo) {
    const full = resolve(pathArquivo);
    const content = readFileSync(full, 'utf8');
    const { redesInfo, arestasConexao } = parseMultiRede(content);

    // Criar e exibir cada grafo individual
    const grafosIndividuais = buildGrafosIndividuais(redesInfo);
    grafosIndividuais.forEach((grafo, idx) => {
        console.log(`\n=== Rede ${idx + 1} ===`);
        exibirGrafo(grafo);
    });

    // Exibir conexões entre redes
    if (arestasConexao.length > 0) {
        console.log('\n=== Conexões entre redes ===');
        arestasConexao.forEach(a => console.log('  ' + a));
    }

    // Construir e exibir o grafo completo
    const grafoCompleto = buildMultiGrafo({ redesInfo, arestasConexao });
    console.log('\n=== Resultados do Grafo Completo ===');
    exibirGrafo(grafoCompleto);
}

export function carregarGrafo(pathArquivo) {
    const full = resolve(pathArquivo);
    const content = readFileSync(full, 'utf8');
    const grafo = buildGrafoFromText(content);

    exibirGrafo(grafo);
}