import { gerarRede1 } from './generator/gerarRede1.js';
import { gerarRede2 } from './generator/gerarRede2.js';
import { writeFileSync } from 'fs';

// Gera e salva uma instância de grafo usando a API Gemini
export async function gerarInstancia1(topologia, numVertices, numInfectados) {
    try {
        const txt = await gerarRede1({
            topologia,
            numVertices,
            numInfectados
        });
        writeFileSync(`src/data/${topologia.toLowerCase()}/${topologia.toLowerCase()}${numVertices}.txt`, txt);
        console.log(`Instância gerada e salva em src/data/${topologia.toLowerCase()}/${topologia.toLowerCase()}${numVertices}.txt`);
    } catch (error) {
        console.error('Erro ao gerar a instância:', error);
    }
}

// Gera e salva múltiplas redes usando Gemini
export async function gerarInstancia2(redes) {
    try {
        const txt = await gerarRede2({ redes });
        writeFileSync(`src/data/multiredes/multirede${redes.length}.txt`, txt);
        console.log(`Instância gerada e salva em src/data/multiredes/multirede${redes.length}.txt`);
    } catch (error) {
        console.error('Erro ao gerar a instância:', error);
    }
}