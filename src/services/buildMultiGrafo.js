import Grafo from '../models/Grafo.js';

// Função para ler múltiplas redes conectadas
export function parseMultiRede(text) {
    const linhas = text.split(/\r?\n/);

    let quantidadeRedes = 0;
    for (const linha of linhas) {
        const l = linha.trim();
        if (l.startsWith('# Quantidade de redes:')) {
            quantidadeRedes = parseInt(l.split(':')[1].trim(), 10) || 0;
            break;
        }
    }

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

    for (const linha of linhas) {
        const l = linha.trim();

        if (l.startsWith('# Topologias das Redes:')) {
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

        // leitura dos dispositivos infectados por rede (# Dispositivos infectados: rede1: H, J, rede2: E, A)
        if (l.startsWith('# Dispositivos infectados:')) {
            // Remove o início do comentário
            let partes = l.replace('# Dispositivos infectados:', '').trim();
            // Regex para pegar cada "redeN: ..." bloco até a próxima "redeN:" ou fim da linha
            const re = /rede\s*(\d+)\s*:\s*([^#]+?)(?=,\s*rede\d+:|$)/gi;
            let m;
            while ((m = re.exec(partes)) !== null) {
                const idx = parseInt(m[1], 10) - 1;
                let rhs = (m[2] || '').trim();
                rhs = rhs.split('#', 1)[0].trim();
                if (!rhs) continue;
                // Separa por vírgula, ponto e vírgula ou espaço
                const parts = rhs.split(/[,;]\s*|\s+/).filter(Boolean);
                if (!isNaN(idx) && redes[idx]) {
                    redes[idx].dispositivosInfectados = Array.from(new Set([...(redes[idx].dispositivosInfectados || []), ...parts]));
                }
            }
            continue;
        }
    }

    for (let i = 0; i < linhas.length; i++) {
        const raw = linhas[i];
        const l = raw.trim();

        if (l.match(/^#\s*rede\s*\d+/i)) {
            modo = 'rede';
            const m = l.match(/rede\s*(\d+)/i);
            if (m) {
                redeIndex = parseInt(m[1], 10) - 1;
                if (redeIndex >= 0 && redes[redeIndex] === undefined) {
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

        if (l.startsWith('#') || l === '') {
            continue;
        }

        if (modo === 'rede') {
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

    for (const rede of redes) {
        if (!('topologia' in rede)) rede.topologia = 'indefinida';
        if (!('numDispositivos' in rede)) {
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
export function buildGrafosIndividuais(redesInfo) {
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
export function buildMultiGrafo({ redesInfo, arestasConexao }) {
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