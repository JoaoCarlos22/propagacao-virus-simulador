import Grafo from './Grafo.js';

function converterLinhaAresta(linha) {
    // Remover comentários
    const semComentario = linha.split('#', 1)[0].trim();
    if (!semComentario) return null;

    // Dividir por espaços em branco
    const strings = semComentario.split(/\s+/);
    if (strings.length < 2) return null;

    // Extrair u, v e peso
    const u = strings[0];
    const v = strings[1];
    const peso = strings.length >= 3 ? parseFloat(strings[2]) : 1;
    return { u, v, peso };
}

// Construir grafo a partir de texto
export function buildGrafoFromText(text) {
    const grafo = new Grafo();
    const linhas = text.split(/\r?\n/);
    for (const linha of linhas) {
        const aresta = converterLinhaAresta(linha);
        if (!aresta) continue;
        grafo.addAresta(aresta.u, aresta.v, aresta.peso);
    }
    return grafo;
}