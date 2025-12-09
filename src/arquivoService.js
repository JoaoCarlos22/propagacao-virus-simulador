import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildGrafoFromText, exibirGrafo } from './services/buildMonoGrafo.js';
import { salvarSimulacaoJSON } from './historyService.js';
import {
    parseMultiRede,
    buildGrafosIndividuais,
    buildMultiGrafo
} from './services/buildMultiGrafo.js';

// Exibe cada rede separadamente e o resultado global
export function carregarMultiRede(pathArquivo) {
    const full = resolve(pathArquivo);
    const content = readFileSync(full, 'utf8');
    const { redesInfo, arestasConexao } = parseMultiRede(content);

    // Criar e exibir cada grafo individual
    const grafosIndividuais = buildGrafosIndividuais(redesInfo);
    grafosIndividuais.forEach((grafo, idx) => {
        console.log(`\n=== Rede ${idx + 1} ===`);
        exibirGrafo(grafo);

        salvarSimulacaoJSON(grafo, {
            tipoSimulacao: 'multi-rede-individual',
            arquivoOrigem: pathArquivo,
            extra: { redeIndex: idx + 1 }
        });
    });

    // Exibir conexões entre redes
    if (arestasConexao.length > 0) {
        console.log('\n=== Conexões entre redes ===');
        arestasConexao.forEach(a => console.log('  ' + a));
    }

    // Construir e exibir o grafo completo
    const grafoCompleto = buildMultiGrafo({ redesInfo, arestasConexao });
    console.log('\n=== Resultados do Grafo Completo ===');
    exibirGrafo(grafoCompleto);

    salvarSimulacaoJSON(grafoCompleto, {
        tipoSimulacao: 'multi-rede-completa',
        arquivoOrigem: pathArquivo
    });
}

export function carregarGrafo(pathArquivo) {
    const full = resolve(pathArquivo);
    const content = readFileSync(full, 'utf8');
    const grafo = buildGrafoFromText(content);

    exibirGrafo(grafo);

    salvarSimulacaoJSON(grafo, {
        tipoSimulacao: 'mono',
        arquivoOrigem: pathArquivo
    });

    // retorna o grafo para que menus possam editar/exibir novamente
    return grafo;
}