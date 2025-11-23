import { gerarDispoInfectado } from "./gerarDispoInfectados.js";
import { genAI, promptRede1, gerarResposta } from "./generatorConfig.js";

// função para gerar o grafo usando Gemini
export async function gerarRede1({ topologia, numVertices, numInfectados }) {
    try {
        const infectados = gerarDispoInfectado(numVertices, numInfectados);
        const prompt = promptRede1({ topologia, numVertices, infectados });

        if (!genAI) {
            throw new Error('Google Generative AI não está inicializado. Verifique sua chave de API.');
        }

        return await gerarResposta(prompt);
    } catch (error) {
        console.error('Erro ao gerar o grafo com Gemini:', error);
        throw error;
    }
}