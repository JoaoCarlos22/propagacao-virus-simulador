import { gerarDispoInfectado } from "./gerarDispoInfectados.js";
import { genAI, promptRede2, gerarResposta } from "./generatorConfig.js";

// função para gerar o grafo usando Gemini
export async function gerarRede2({ redes }) {
    try {
        // gera todos os dispositivos infectados de cada rede
        redes = redes.map(rede => {
            const infectadosGerados = gerarDispoInfectado(rede.numVertices, rede.numInfectados);
            // retorna adicionando um campo 'infectados' no objeto 'redes'
            return  { ...rede, infectados: infectadosGerados };
        });

        const prompt = promptRede2({ redes });

        if (!genAI) {
            throw new Error('Google Generative AI não está inicializado. Verifique sua chave de API.');
        }

        return await gerarResposta(prompt);
    } catch (error) {
        console.error('Erro ao gerar o grafo com Gemini:', error);
        throw error;
    }
}