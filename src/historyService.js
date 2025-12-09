import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta base de resultados: src/data/resultados
const BASE_RESULT_DIR = path.join(__dirname, 'data', 'resultados');


function getSubfolderByTipo(tipo) {
    if (!tipo) return 'outros';
    const t = String(tipo).toLowerCase();
    if (t.startsWith('mono')) return 'mono';
    if (t.startsWith('multi')) return 'multi';
    if (t.startsWith('edicao') || t.startsWith('edição')) return 'edicoes';
    return 'outros';
}

function garantirPastaResultadosPorTipo(tipo) {
    const subfolder = getSubfolderByTipo(tipo);
    const dir = path.join(BASE_RESULT_DIR, subfolder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

export function salvarSimulacaoJSON(grafo, options = {}) {
    const agora = new Date();
    const timestamp = agora.toISOString().replace(/[:.]/g, '-');
    const tipo = options.tipoSimulacao || options.tipo || 'mono';

    // garante a pasta correta com base no tipoSimulacao
    const dirPorTipo = garantirPastaResultadosPorTipo(tipo);

    const nomeArquivo = `${timestamp}_${tipo}.json`;
    const caminhoCompleto = path.join(dirPorTipo, nomeArquivo);

    const payload = grafo.toSimulationResult({
        tipoSimulacao: tipo,
        arquivoOrigem: options.arquivoOrigem || null,
        dataExecucao: agora.toISOString(),
        extra: options.extra || {},
    });

    fs.writeFileSync(caminhoCompleto, JSON.stringify(payload, null, 2), 'utf-8');

    return caminhoCompleto;
}
