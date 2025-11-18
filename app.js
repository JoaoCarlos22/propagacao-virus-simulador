import { carregarGrafo } from './src/arquivoService.js';
import { escolherOpcao } from './src/menu.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

function criarReadline() {
    return readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    });
}

async function main() {
    const rl = criarReadline();
    try {
        const opcao = await escolherOpcao(rl);
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