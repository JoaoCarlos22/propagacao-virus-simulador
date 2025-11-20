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

export async function escolherOpcao(rl) {
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
    let qtd = '';
    while (qtd !== '6' && qtd !== '15') {
        qtd = (await prompt(rl, 'Digite a quantidade de vértices (6 ou 15): ')).trim();
    }

    return {
        key: opcao.key,
        label: opcao.label,
        path: getPath(opcao.key, qtd)
    };
}