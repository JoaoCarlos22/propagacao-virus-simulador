import { readdirSync, existsSync } from 'fs';
import { gerarInstancia } from './gerarInstancia.js';

// opções do menu
function carregarOpcoes() {
    return [
        { key: '1', label: 'Estrela' },
        { key: '2', label: 'Anel' },
        { key: '3', label: 'Malha' },
        { key: '4', label: 'Sair' }
    ];
}

function prompt(rl, pergunta) {
    return new Promise(res => rl.question(pergunta, ans => res(ans)));
}

// retorna o path do arquivo baseado na topologia e quantidade de vertices
function getPath(topologia, qtd) {
    const base = 'src/data';
    if (topologia === '1') return `${base}/estrela/estrela${qtd}.txt`;
    if (topologia === '2') return `${base}/anel/anel${qtd}.txt`;
    if (topologia === '3') return `${base}/malha/malha${qtd}.txt`;
    return null;
}

// lista as instâncias disponíveis no console (número de vértices)
function listarInstancias(topologiaKey) {
    const topologiaMap = {
        '1': 'estrela',
        '2': 'anel',
        '3': 'malha'
    };
    const topologia = topologiaMap[topologiaKey];
    console.log(`\nInstâncias disponíveis para topologia ${topologia}:`);
    let arquivos = [];
    try {
        arquivos = readdirSync(`src/data/${topologia}`).filter(f => f.endsWith('.txt'));
    } catch (e) {
        // pasta pode não existir ainda
    }
    if (arquivos.length > 0) {
        // lista apenas o numero das instancias
        arquivos.forEach(arq => console.log(`  - ${arq.replace(/[^0-9]/g, '')} vértices`));
    } else {
        console.log('  (Nenhuma instância disponível)');
    }
}

// menu para escolher instância existente
export async function menu1(rl) {
    const opcoes = carregarOpcoes();
    console.clear();
    console.log('Selecione uma das opções abaixo:');
    opcoes.forEach(opt => console.log(`${opt.key} - ${opt.label}`));

    // ler a opção do usuário
    const respostaTopo = (await prompt(rl, 'Digite o número da topologia: ')).trim();
    const opcao = opcoes.find(opt => opt.key === respostaTopo);

    // se for sair ou inválido, retorna direto
    if (!opcao || opcao.key === '4') return opcao;

    // exibe as instancias desta topologia
    listarInstancias(opcao.key);

    // ler a quantidade de vertices
    const qtd = (await prompt(rl, 'Digite qual instância (quantidade de vértices): ')).trim();
    
    // verifica se essa instância existe
    const path = getPath(opcao.key, qtd);
    if (!existsSync(path)) {
        console.log('Instância não encontrada.');
        return null;
    }

    return {
        key: opcao.key,
        label: opcao.label,
        path: path
    };
}

// menu para gerar nova instância
export async function menu2(rl) {
    // Perguntar parâmetros para gerar nova instância
    const opcoes = carregarOpcoes();
    console.clear();
    console.log('Selecione uma das opções abaixo:');
    opcoes.forEach(opt => console.log(`${opt.key} - ${opt.label}`));

    // ler a opção do usuário
    const respostaTopo = (await prompt(rl, 'Digite o número da topologia: ')).trim();
    const opcao = opcoes.find(opt => opt.key === respostaTopo);

    // se for sair ou inválido, retorna direto
    if (!opcao || opcao.key === '4') return opcao;

    // ler a quantidade de vertices
    let numVertices = '';
    while (isNaN(numVertices) ||
        Number(numVertices) < 5 ||
        Number(numVertices) > 30) {
        numVertices = (await prompt(rl, 'Digite a quantidade de vértices (entre 5 e 30): ')).trim();
    }

    // ler a quantidade de vértices infectados
    let numInfectados = '';
    while (isNaN(numInfectados) ||
        Number(numInfectados) < 1 ||
        Number(numInfectados) >= Number(numVertices)) {
        numInfectados = (await prompt(rl, `Digite a quantidade de vértices infectados (entre 1 e ${Number(numVertices) - 1}): `)).trim();
    }
    
    // gerar a instância
    console.log('\nGerando nova instância com Gemini, aguarde...');
    const topologia = opcao.label.toLowerCase();
    await gerarInstancia(topologia, Number(numVertices), Number(numInfectados));

    return {
        key: opcao.key,
        label: opcao.label,
        path: getPath(opcao.key, numVertices)
    }
}