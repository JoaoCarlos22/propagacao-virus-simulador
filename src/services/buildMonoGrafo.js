import Grafo from '../models/Grafo.js';

// Coletar topologia e número de dispositivos do texto
export function extrairInfo(linhas) {
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
            rhs = rhs.split('#', 1)[0].trim();
            if (!rhs) continue;
            const parts = rhs.split(/[,;]\s*|\s+/).filter(Boolean);
            dispositivosInfectados.push(...parts);
        }
    }

    const únicos = Array.from(new Set(dispositivosInfectados));
    return { topologia, numDispositivos, dispositivosInfectados: únicos };
}

export function converterLinhaAresta(linha) {
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

export function buildGrafoFromText(text) {
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

export function exibirGrafo(grafo)  {
    console.log('\nGrafo carregado:\n');
    console.log(grafo.toString());
    console.log(grafo.exibirTempoContagio());
    console.log(grafo.exibirSequenciaInfeccao());
    console.log(grafo.exibirDispositivosVulneraveis());
}