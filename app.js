import { carregarGrafo, carregarMultiRede } from './src/arquivoService.js';
import { menu1, menu2, menu3, menuMultiRedes } from './src/menu.js';
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
        while (acao !== '1' && acao !== '2' && acao !== '3') {
            acao = (await prompt(rl, '1 - Usar uma instância existente\n2 - Criar uma nova com IA\n3 - Gerar múltiplas redes\nDigite sua opção: ')).trim();
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
                const grafo = carregarGrafo(opcao.path);
                await menu3(grafo, rl);
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
                const grafo = carregarGrafo(opcao.path);
                await menu3(grafo, rl);
            } catch (err) {
                console.log(`Erro ao ler/parsear o arquivo: ${err.message}`);
            }
        } else if (acao === '3') {
            const caminho = await menuMultiRedes(rl);
            try {
                const multiRede = carregarMultiRede(caminho);
                await menu3(multiRede, rl);
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