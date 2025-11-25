import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildGrafoFromText } from './src/services/buildMonoGrafo.js';
import { parseMultiRede, buildMultiGrafo } from './src/services/buildMultiGrafo.js';
import { salvarSimulacaoJSON } from './src/historyService.js';
import { gerarRede1 } from './src/generator/gerarRede1.js';
import { gerarRede2 } from './src/generator/gerarRede2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'src/data');

const CATEGORIES = ['estrela', 'anel', 'malha', 'multiredes'];

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(process.cwd(), 'public')));

// rota para servir index.html na raiz (arquivo movido para /)
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

let currentGrafo = null;
let currentSourceFile = null;

async function listarArquivos() {
    const files = [];

    for (const category of CATEGORIES) {
        const dirPath = path.join(DATA_DIR, category);
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isFile()) continue;
                if (!entry.name.toLowerCase().endsWith('.txt')) continue;

                files.push({
                    name: entry.name,
                
                    path: `${category}/${entry.name}`,
                    category
                });
            }
        } catch (err) {
        
            if (err.code !== 'ENOENT') {
                console.error(`Erro ao ler pasta ${dirPath}:`, err.message);
            }
        }
    }

    return files;
}

app.get('/api/files', async (req, res) => {
    try {
        const files = await listarArquivos();
        res.json({ files });
    } catch (err) {
        console.error('Erro em /api/files:', err);
        res.status(500).json({ message: 'Erro ao listar arquivos de instância.' });
    }
});

async function carregarEConstruirGrafo(relativePath) {
    const fullPath = path.join(DATA_DIR, relativePath);

    const content = await fs.readFile(fullPath, 'utf-8');

    let grafo;
    let tipoSimulacao;

    if (relativePath.startsWith('multiredes/')) {
    
        const { redesInfo, arestasConexao } = parseMultiRede(content);
        grafo = buildMultiGrafo({ redesInfo, arestasConexao });
        tipoSimulacao = 'multi-rede-web';
    } else {
    
        grafo = buildGrafoFromText(content);
        tipoSimulacao = 'mono-web';
    }


    currentGrafo = grafo;
    currentSourceFile = relativePath;


    salvarSimulacaoJSON(grafo, {
        tipoSimulacao,
        arquivoOrigem: relativePath,
        extra: {
            fonte: 'api-simulate',
            acao: 'simulacao-inicial'
        }
    });

    return grafo;
}

app.get('/api/simulate', async (req, res) => {
    const relativePath = req.query.file;

    if (!relativePath) {
        return res.status(400).json({ message: 'Parâmetro "file" é obrigatório.' });
    }

    try {
        const grafo = await carregarEConstruirGrafo(relativePath);

        const payload = grafo.toFrontendSimulation({
            sourceFile: relativePath,
            edited: false,
            origem: 'api-simulate'
        });

        res.json(payload);
    } catch (err) {
        console.error('Erro em /api/simulate:', err);
        res.status(500).json({ message: `Erro ao simular arquivo: ${err.message}` });
    }
});

app.post('/api/edit/node/delete', (req, res) => {
    const { id } = req.body || {};

    if (!currentGrafo || !currentSourceFile) {
        return res.status(400).json({ message: 'Nenhuma simulação carregada. Chame /api/simulate antes.' });
    }

    if (!id) {
        return res.status(400).json({ message: 'Campo "id" é obrigatório.' });
    }

    const removido = currentGrafo.deletarDispositivo(id);

    if (!removido) {
        return res.status(404).json({ message: `Dispositivo "${id}" não encontrado no grafo atual.` });
    }


    salvarSimulacaoJSON(currentGrafo, {
        tipoSimulacao: 'edicao-web',
        arquivoOrigem: currentSourceFile,
        extra: {
            fonte: 'api-edit',
            acao: 'remover-dispositivo',
            dispositivo: id
        }
    });

    const payload = currentGrafo.toFrontendSimulation({
        sourceFile: currentSourceFile,
        edited: true,
        origem: 'api-edit',
        ultimaAcao: 'remover-dispositivo',
        dispositivoRemovido: id
    });

    res.json(payload);
});

app.post('/api/edit/edge/update', (req, res) => {
    const { from, to, peso } = req.body || {};

    if (!currentGrafo || !currentSourceFile) {
        return res.status(400).json({ message: 'Nenhuma simulação carregada. Chame /api/simulate antes.' });
    }

    if (!from || !to || typeof peso !== 'number') {
        return res.status(400).json({ message: 'Campos "from", "to" e "peso" são obrigatórios.' });
    }

    const ok = currentGrafo.atualizarAresta(from, to, peso);

    if (!ok) {
        return res.status(404).json({ message: `Aresta ${from} -> ${to} não encontrada no grafo atual.` });
    }

    salvarSimulacaoJSON(currentGrafo, {
        tipoSimulacao: 'edicao-web',
        arquivoOrigem: currentSourceFile,
        extra: {
            fonte: 'api-edit',
            acao: 'atualizar-aresta',
            from,
            to,
            novoPeso: peso
        }
    });

    const payload = currentGrafo.toFrontendSimulation({
        sourceFile: currentSourceFile,
        edited: true,
        origem: 'api-edit',
        ultimaAcao: 'atualizar-aresta',
        edge: { from, to, peso }
    });

    res.json(payload);
});

app.post('/api/edit/edge/delete', (req, res) => {
    const { from, to } = req.body || {};

    if (!currentGrafo || !currentSourceFile) {
        return res.status(400).json({ message: 'Nenhuma simulação carregada. Chame /api/simulate antes.' });
    }

    if (!from || !to) {
        return res.status(400).json({ message: 'Campos "from" e "to" são obrigatórios.' });
    }


    const ok = currentGrafo.removerAresta(from, to);

    if (!ok) {
        return res.status(404).json({ message: `Aresta ${from} -> ${to} não encontrada no grafo atual.` });
    }

    salvarSimulacaoJSON(currentGrafo, {
        tipoSimulacao: 'edicao-web',
        arquivoOrigem: currentSourceFile,
        extra: {
            fonte: 'api-edit',
            acao: 'remover-aresta',
            from,
            to
        }
    });

    const payload = currentGrafo.toFrontendSimulation({
        sourceFile: currentSourceFile,
        edited: true,
        origem: 'api-edit',
        ultimaAcao: 'remover-aresta',
        edgeRemovida: { from, to }
    });

    res.json(payload);
});

// POST /api/generate - Gera uma nova instância mono usando IA
app.post('/api/generate', async (req, res) => {
    const { topology, numVertices, numInfected } = req.body || {};

    // Validações
    if (!topology || !['estrela', 'anel', 'malha'].includes(topology)) {
        return res.status(400).json({ message: 'Topologia inválida. Use: estrela, anel ou malha.' });
    }

    if (!numVertices || numVertices < 5 || numVertices > 30) {
        return res.status(400).json({ message: 'Número de vértices deve estar entre 5 e 30.' });
    }

    if (!numInfected || numInfected < 1 || numInfected >= numVertices) {
        return res.status(400).json({ message: `Número de infectados deve estar entre 1 e ${numVertices - 1}.` });
    }

    try {
        // Gerar conteúdo do grafo usando IA
        const conteudoGrafo = await gerarRede1({
            topologia: topology,
            numVertices,
            numInfectados: numInfected
        });

        // Criar nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${topology}_${numVertices}v_${numInfected}i_${timestamp}.txt`;
        const dirPath = path.join(DATA_DIR, topology);
        const filePath = path.join(dirPath, filename);

        // Garantir que o diretório existe
        await fs.mkdir(dirPath, { recursive: true });

        // Salvar arquivo
        await fs.writeFile(filePath, conteudoGrafo, 'utf-8');

        console.log(`✅ Instância gerada: ${topology}/${filename}`);

        // Retornar caminho relativo para o frontend
        res.json({
            filename,
            path: `${topology}/${filename}`,
            message: 'Instância gerada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao gerar instância:', error);
        res.status(500).json({ message: `Erro ao gerar instância: ${error.message}` });
    }
});

// POST /api/generate-multi - Gera uma nova multi-rede usando IA
app.post('/api/generate-multi', async (req, res) => {
    const { redes } = req.body || {};

    // Validações
    if (!Array.isArray(redes) || redes.length < 2 || redes.length > 5) {
        return res.status(400).json({ message: 'Número de redes deve estar entre 2 e 5.' });
    }

    // Validar cada rede
    for (let i = 0; i < redes.length; i++) {
        const rede = redes[i];
        
        if (!rede.topologia || !['estrela', 'anel', 'malha'].includes(rede.topologia)) {
            return res.status(400).json({ message: `Rede ${i + 1}: topologia inválida.` });
        }

        if (!rede.numVertices || rede.numVertices < 5 || rede.numVertices > 30) {
            return res.status(400).json({ message: `Rede ${i + 1}: número de vértices deve estar entre 5 e 30.` });
        }

        if (!rede.numInfectados || rede.numInfectados < 1 || rede.numInfectados >= rede.numVertices) {
            return res.status(400).json({ message: `Rede ${i + 1}: número de infectados inválido.` });
        }
    }

    try {
        // Gerar conteúdo da multi-rede usando IA
        const conteudoGrafo = await gerarRede2({ redes });

        // Criar nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resumo = redes.map(r => `${r.topologia[0]}${r.numVertices}`).join('-');
        const filename = `multirede_${resumo}_${timestamp}.txt`;
        const dirPath = path.join(DATA_DIR, 'multiredes');
        const filePath = path.join(dirPath, filename);

        // Garantir que o diretório existe
        await fs.mkdir(dirPath, { recursive: true });

        // Salvar arquivo
        await fs.writeFile(filePath, conteudoGrafo, 'utf-8');

        console.log(`✅ Multi-rede gerada: multiredes/${filename}`);

        // Retornar caminho relativo para o frontend
        res.json({
            filename,
            path: `multiredes/${filename}`,
            message: 'Multi-rede gerada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao gerar multi-rede:', error);
        res.status(500).json({ message: `Erro ao gerar multi-rede: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
