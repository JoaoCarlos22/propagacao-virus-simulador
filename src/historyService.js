import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULT_DIR = path.join(__dirname, './data/resultados');

function garantirPastaResultados() {
    if (!fs.existsSync(RESULT_DIR)) {
        fs.mkdirSync(RESULT_DIR, { recursive: true });
    }
}

export function salvarSimulacaoJSON(grafo, options = {}) {
    garantirPastaResultados();

    const agora = new Date();
    const timestamp = agora.toISOString().replace(/[:.]/g, '-');

    const tipo = options.tipoSimulacao || 'mono';
    const nomeArquivo = `${timestamp}_${tipo}.json`;
    const caminhoCompleto = path.join(RESULT_DIR, nomeArquivo);

    const payload = grafo.toSimulationResult({
        tipoSimulacao: tipo,
        arquivoOrigem: options.arquivoOrigem || null,
        dataExecucao: agora.toISOString(),
        extra: options.extra || {},
    });

    fs.writeFileSync(caminhoCompleto, JSON.stringify(payload, null, 2), 'utf-8');

    return caminhoCompleto;
}
