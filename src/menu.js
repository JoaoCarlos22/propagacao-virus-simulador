function carregarOpcoes() {
    return [
        { key: '1', label: 'Estrela', path: process.env.PATH_STAR },
        { key: '2', label: 'Anel',   path: process.env.PATH_RING },
        { key: '3', label: 'Malha',  path: process.env.PATH_MESH },
        { key: '4', label: 'Sair',   path: null }
    ];
}

function prompt(rl, pergunta) {
    return new Promise(res => rl.question(pergunta, ans => res(ans)));
}

export async function escolherOpcao(rl) {
    const opcoes = carregarOpcoes();
    // Exibir opções
    console.clear();
    console.log('Selecione uma das opções abaixo:');
    opcoes.forEach(opt => console.log(`${opt.key} - ${opt.label}`));

    // Esperar pela escolha do usuário
    const resposta = (await prompt(rl, 'Digite o número da opção: ')).trim();
    return opcoes.find(opt => opt.key === resposta);
}