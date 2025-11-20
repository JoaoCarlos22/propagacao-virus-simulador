import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// função para gerar um dispositivo infectado aleatório
function gerarDispoInfectado(numVertices) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const index = Math.floor(Math.random() * Math.min(numVertices, letters.length));
    return letters[index];
}

// função para gerar o grafo usando Gemini
export async function gerarGrafoGemini({ topologia, numVertices }) {
    try {
        const infectado = gerarDispoInfectado(numVertices);
        const prompt = `
            Gere um grafo no seguinte formato:
            # Topologia de Rede: ${topologia}
            # Número de vértices: ${numVertices}
            # Dispositivo infectado: ${infectado}
            # origem | destino | nivel de segurança
            (Use letras para os dispositivos, níveis de segurança de 1 a 10, e siga o padrão dos exemplos abaixo.)

            Exemplo de formato:
            A	B	3
            A	C	8
            ...

            Apenas o grafo e o cabeçalho com #, sem explicações.
            `;

        if (!genAI) {
            throw new Error('Google Generative AI não está inicializado. Verifique sua chave de API.');
        }

        // chama o modelo Gemini e espera o resultado
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Erro ao gerar o grafo com Gemini:', error);
        throw error;
    }
}