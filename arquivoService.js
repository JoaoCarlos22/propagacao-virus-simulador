import Grafo from './Grafo.js';

function converterLinhaAresta(linha) {
    // Remover comentários
    const semComentario = linha.split('#', 1)[0].trim();
    if (!semComentario) return null;

    // Dividir por espaços em branco
    const strings = semComentario.split(/\s+/);
    if (strings.length < 2) return null;

    // Extrair u, v e peso (nível de segurança entre 0 e 10)
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
        // Valor padrão de peso é 1
        peso = 1;
    }
    return { u, v, peso };
}

// Construir grafo a partir de texto
export function buildGrafoFromText(text) {
    const grafo = new Grafo();
    const linhas = text.split(/\r?\n/); // Suporta quebras de linha Unix e Windows
    for (const linha of linhas) {
        const aresta = converterLinhaAresta(linha);
        if (!aresta) continue;
        grafo.addAresta(aresta.u, aresta.v, aresta.peso);
    }
    return grafo;
}