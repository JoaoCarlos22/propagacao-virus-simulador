import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildGrafoFromText } from './src/arquivoService.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

function carregarOpcoes() {
    return [
        { key: '1', label: 'Estrela', path: process.env.PATH_STAR },
        { key: '2', label: 'Anel',   path: process.env.PATH_RING },
        { key: '3', label: 'Malha',  path: process.env.PATH_MESH },
        { key: '4', label: 'Sair',   path: null }
    ];
}

function criarReadline() {
    return readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    });
}

function prompt(rl, pergunta) {
    return new Promise(res => rl.question(pergunta, ans => res(ans)));
}

async function escolherOpcao(rl, options) {
    // Exibir opções
    console.clear();
    console.log('Selecione uma das opções abaixo:');
    options.forEach(opt => console.log(`${opt.key} - ${opt.label}`));

    // Esperar pela escolha do usuário
    const resposta = (await prompt(rl, 'Digite o número da opção: ')).trim();
    return options.find(opt => opt.key === resposta);
}

function carregarGrafo(pathArquivo) {
    const full = resolve(pathArquivo);
    const content = readFileSync(full, 'utf8');
    const grafo = buildGrafoFromText(content);

    console.log('\nGrafo carregado:\n');
    console.log(grafo.toString());
}

async function main() {
    const opcoes = carregarOpcoes();
    const rl = criarReadline();
    try {
        const opcao = await escolherOpcao(rl, opcoes);
        if (!opcao) {
            console.log('Opção inválida. Encerrando o programa.');
            return;
        }
        if (opcao.key === '4') {
            console.log('Saindo do programa.');
            return;
        }
        if (!opcao.path) {
            console.log('Erro: Nenhum arquivo especificado.');
            return;
        }
        try {
            carregarGrafo(opcao.path);
        } catch (err) {
            console.log(`Erro ao ler/parsear o arquivo: ${err.message}`);
        }
    } finally {
        rl.close();
    }
}

main().catch(err => {
    console.error('Erro inesperado:', err);
    process.exit(3);
});