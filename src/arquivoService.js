import { readFileSync } from 'fs';
import { resolve } from 'path';
import Grafo from './models/Grafo.js';

// Coletar topologia e número de dispositivos do texto
function extrairInfo(linhas) {
    let topologia = 'indefinida';
    let numDispositivos = 0;
    let dispositivoInfectado = null;

    for (const linha of linhas) {
        const l = linha.trim();
        if (l.startsWith('# Topologia de Rede:')) {
            topologia = l.split(':')[1].trim();
        }
        if (l.startsWith('# Número de vértices:')) {
            numDispositivos = parseInt(l.split(':')[1].trim(), 10);
        }
        if (l.startsWith('# Dispositivo infectado:')) {
            dispositivoInfectado = l.split(':')[1].trim();
        }
    }

    return { topologia, numDispositivos, dispositivoInfectado };
}

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
function buildGrafoFromText(text) {
    const linhas = text.split(/\r?\n/); // Suporta quebras de linha Unix e Windows
    const { topologia, numDispositivos, dispositivoInfectado } = extrairInfo(linhas);
    const grafo = new Grafo(topologia, numDispositivos, dispositivoInfectado);
    for (const linha of linhas) {
        const aresta = converterLinhaAresta(linha);
        if (!aresta) continue;
        grafo.addAresta(aresta.u, aresta.v, aresta.peso);
    }
    return grafo;
}

export function carregarGrafo(pathArquivo) {
    const full = resolve(pathArquivo);
    const content = readFileSync(full, 'utf8');
    const grafo = buildGrafoFromText(content);

    console.log('\nGrafo carregado:\n');
    console.log(grafo.toString());
}