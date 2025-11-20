import { carregarGrafo } from './src/arquivoService.js';
import { menu1, menu2 } from './src/menu.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

function criarReadline() {
    return readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    });
}

function prompt(rl, pergunta) {
    return new Promise(res => rl.question(pergunta, ans => res(ans)));
}

async function main() {
    const rl = criarReadline();
    try {
        console.clear();
        console.log('Bem-vindo ao simulador de propagação de vírus!\n');
        let acao = '';
        while (acao !== '1' && acao !== '2') {
            acao = (await prompt(rl, 'Digite 1 para usar uma instância existente ou 2 para criar uma nova com IA: ')).trim();
        }

        // Carregar grafo existente
        if (acao === '1') {
            const opcao = await menu1(rl);
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

        // Nova funcionalidade para criar grafo com IA    
        } else if (acao === '2') {
            const opcao = await menu2(rl);
            if (!opcao) {
                console.log('Opção inválida. Encerrando o programa.');
                return;
            }
            if (opcao.key === '4') {
                console.log('Saindo do programa.');
                return;
            }
            try {
                carregarGrafo(opcao.path);
            } catch (err) {
                console.log(`Erro ao ler/parsear o arquivo: ${err.message}`);
            }
        }
    } finally {
        rl.close();
    }
}

main().catch(err => {
    console.error('Erro inesperado:', err);
    process.exit(3);
});