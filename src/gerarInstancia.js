import { gerarGrafoGemini } from './generatorGemini.js';
import { writeFileSync } from 'fs';

// Gera e salva uma instância de grafo usando a API Gemini
export async function gerarInstancia(topologia, numVertices) {
    try {
        const txt = await gerarGrafoGemini({
            topologia,
            numVertices,
        });
        writeFileSync(`src/data/${topologia.toLowerCase()}/${topologia.toLowerCase()}${numVertices}.txt`, txt);
        console.log(`Instância gerada e salva em src/data/${topologia.toLowerCase()}/${topologia.toLowerCase()}${numVertices}.txt`);
    } catch (error) {
        console.error('Erro ao gerar a instância:', error);
    }
}