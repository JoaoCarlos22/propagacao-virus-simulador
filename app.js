import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildGrafoFromText } from './arquivoService.js';
require('dotenv').config();

const arquivo = process.env.PATH_ARQUIVO;
if (!arquivo) {
    console.error('Erro: Nenhum arquivo especificado.');
    process.exit(1);
}
const full = resolve(arquivo);
try {
    const content = readFileSync(full, 'utf8');
    const grafo = buildGrafoFromText(content);
    console.log(grafo.toString());
} catch (err) {
    console.error('Erro ao ler arquivo:', err.message);
    process.exit(2);
}
