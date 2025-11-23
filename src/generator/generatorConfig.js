import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;

export const genAI = new GoogleGenerativeAI(API_KEY);

// prompt para gerar uma rede sozinha
export const promptRede1 = ({ topologia, numVertices, infectados }) => 
     `Gere um grafo no seguinte formato:
        # Topologia de Rede: ${topologia}
        # Número de vértices: ${numVertices}
        # Dispositivos infectados: ${infectados}
        # origem | destino | nivel de segurança
        (Use letras para os dispositivos, níveis de segurança de 1 a 10, e siga o padrão dos exemplos abaixo.)

        Exemplo de formato:
        A	B	3
        A	C	8
        ...

        Apenas o grafo e o cabeçalho com #, sem explicações.
`;

// prompt para gerar mais de uma rede conectada
export const promptRede2 = ({ redes }) => {
    const fmt = (val) => Array.isArray(val) ? val.join(', ') : val;

    return `Gere um grafo no seguinte formato:
        # Quantidade de redes: ${redes.length}
        # Topologias das Redes: ${redes.map((r, i) => `rede${i+1}: ${fmt(r.topologia)}`).join(', ')}
        # Número de vértices: ${redes.map((r, i) => `rede${i+1}: ${fmt(r.numVertices)}`).join(', ')}
        # Dispositivos infectados: ${redes.map((r, i) => `rede${i+1}: ${fmt(r.infectados)}`).join(', ')}
        #
        # rede 1
        # origem | destino | nivel de segurança
        (Use letras para os dispositivos, níveis de segurança de 1 a 10, e siga o padrão dos exemplos abaixo.)

        Exemplo de formato:
        A	B	3
        A	C	8

        # aresta que conecta as redes
        (Adicione uma aresta entre um dispositivo de rede 1 e um dispositivo de rede 2, com nível de segurança entre 1 e 10.)

        Exemplo de formato:
        C	D	6
        
        # rede 2
        # origem | destino | nivel de segurança

        Exemplo de formato:
        D	E	5
        D	F	7
        ...

        Apenas o grafo e o cabeçalho com #, sem explicações.
`;
};

export const gerarResposta = async (prompt) => {
    // chama o modelo Gemini e espera o resultado
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}