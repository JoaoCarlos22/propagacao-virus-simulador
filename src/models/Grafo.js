class Grafo {
    static TEMPO_NIVEL_SEG = {
        1: 1, 2: 2, 3: 4, 4: 8, 5: 16,
        6: 20, 7: 24, 8: 28, 9: 32, 10: 48
    };

    constructor(topologia, numDispositivos, dispoInfectados) {
        // Mapa de adjacência: vértice (dispositivo) -> { arestas: [{to, peso (nível de segurança)}], infectado: boolean }
        this.adj = new Map();
        this.topologia = topologia || 'indefinida';
        this.numDispositivos = numDispositivos || 0;
        // garantir array seguro para dispositivos infectados
        this.dispositivosInfectados = Array.isArray(dispoInfectados) ? [...dispoInfectados] : (dispoInfectados ? [...dispoInfectados] : []);
    }

    // para cada nivel de peso é atribuido um tempo (hora) de contágio
    tempoPorNivel(nivel) {
        return Grafo.TEMPO_NIVEL_SEG[nivel];
    }

    // Garantir que um vértice exista na lista de adjacência
    _validar(vertice) {
        // verificar se o vértice é o vértice infectado
        const infectado = (this.dispositivosInfectados && this.dispositivosInfectados.includes(vertice)) ? true : false;
        if (!this.adj.has(vertice)) this.adj.set(vertice, { arestas: [], infectado });
    }

    addAresta(u, v, peso) {
        this._validar(u);
        this._validar(v);
        this.adj.get(u).arestas.push({ to: v, peso });
        this.adj.get(v).arestas.push({ to: u, peso });
    }

    // atualiza o peso de uma aresta existente
    atualizarAresta(u, v, novoPeso) {
        this._validar(u);
        this._validar(v);
        
        // Função auxiliar para atualizar o peso de uma aresta
        const atualizarPeso = (from, to, peso) => {
            const arestas = this.adj.get(from).arestas;
            for (const aresta of arestas) {
                if (aresta.to === to) {
                    aresta.peso = peso;
                    return;
                }
            }
        };

        // Atualiza o peso em ambas as direções
        atualizarPeso(u, v, novoPeso);
        atualizarPeso(v, u, novoPeso);
    }

    // remove um dispositivo e todas as suas conexões
    deletarDispositivo(dispositivo) {
        // se o dispositivo não existir, nada a fazer
        if (!this.adj.has(dispositivo)) return;

        // remover o dispositivo da lista de infectados, se presente
        if (Array.isArray(this.dispositivosInfectados)) {
            this.dispositivosInfectados = this.dispositivosInfectados.filter(d => d !== dispositivo);
        }

        const entry = this.adj.get(dispositivo);
        const vizinhos = entry ? entry.arestas.map(a => a.to) : [];

        // remover todas as arestas que apontam para o dispositivo a ser removido
        for (const vizinho of vizinhos) {
            if (!this.adj.has(vizinho)) continue; // proteção caso vértice vizinho já tenha sido removido
            const arestasVizinho = this.adj.get(vizinho).arestas;
            this.adj.get(vizinho).arestas = arestasVizinho.filter(a => a.to !== dispositivo);
        }
        this.adj.delete(dispositivo);
        if (this.numDispositivos > 0) {
            this.numDispositivos--;
        }
    }

    vertices() {
        return Array.from(this.adj.keys());
    }

    // calcula o grau de um dispositivo
    conexoes(dispositivo) {
        this._validar(dispositivo);
        return this.adj.get(dispositivo).arestas.length;
    }

    // calcula a resistencia media de um dispositivo (soma dos pesos / grau)
    resistenciaMedia(dispositivo) {
        this._validar(dispositivo);
        const arestas = this.adj.get(dispositivo).arestas;
        const conexoes = this.conexoes(dispositivo);

        // evitar divisao por zero
        if (conexoes === 0) return 0;

        const somaPesos = arestas.reduce((acc, val) => acc + val.peso, 0);
        return somaPesos / conexoes;
    }

    dispositivosVulneraveis() {
        const vulneraveis = [];

        // para cada dispositivo, calcula o grau e resistencia media
        for (const dispositivo of this.vertices()) {
            vulneraveis.push({
                dispositivo: dispositivo,
                grau: this.conexoes(dispositivo),
                resistenciaMedia: this.resistenciaMedia(dispositivo)
            });
        }

        // ordena os dispositivos mais vulneraveis
        vulneraveis.sort((a, b) => {
            // Ordenar por grau (descendente)
            if (b.grau !== a.grau) return b.grau - a.grau;
            // Se graus forem iguais, ordenar por resistência média (ascendente)
            return a.resistenciaMedia - b.resistenciaMedia;
        });

        return vulneraveis;
    }

    // calcula o tempo de infeccao para cada dispositivo usando Dijkstra (agora suporta múltiplos infectados)
    calcularTemposInfeccao() {
        const tempos = {};
        const infectados = new Set();
        const fila = [];

        // Suporte a múltiplos dispositivos infectados
        let fontes = Array.isArray(this.dispositivosInfectados) ? [...this.dispositivosInfectados] : [];

        // Inicializa todos os tempos como infinito, exceto os infectados iniciais
        for (const v of this.vertices()) {
            tempos[v] = Infinity;
        }
        // garantir que apenas fontes que ainda existem no grafo sejam consideradas
        fontes = fontes.filter(f => this.adj.has(f));
        for (const fonte of fontes) {
            tempos[fonte] = 0;
            fila.push({ vertice: fonte, tempo: 0 });
        }

        while (fila.length > 0) {
            // Seleciona o nó com menor tempo acumulado
            fila.sort((a, b) => a.tempo - b.tempo);
            const { vertice: atual, tempo: tempoAtual } = fila.shift();
            if (infectados.has(atual)) continue;
            infectados.add(atual);

            const nodoAtual = this.adj.get(atual);
            if (!nodoAtual) continue; // proteção adicional caso o nó tenha sido removido
            // Atualiza os tempos dos vizinhos
            for (const aresta of nodoAtual.arestas) {
                const vizinho = aresta.to;
                const tempoNovo = tempoAtual + this.tempoPorNivel(aresta.peso);

                if (tempoNovo < tempos[vizinho]) {
                    tempos[vizinho] = tempoNovo;
                    fila.push({ vertice: vizinho, tempo: tempoNovo });
                }
            }
        }

        // retorna os tempos de cada dispositivo infectado
        return Object.values(tempos);
    }

    // calcula o tempo medio total de infeccao
    calcularMediaTempo() {
        const tempos = this.calcularTemposInfeccao();
        const somaTempos = tempos.reduce((acc, val) => acc + val, 0);
        return somaTempos / this.numDispositivos;
    }

    // calcula o tempo minimo total de infeccao
    calcularMinimoTempo() {
        const tempos = this.calcularTemposInfeccao();
        return Math.max(...tempos);
    }

    sequenciaInfeccao() {
        const tempos = this.calcularTemposInfeccao();
        let listaDispositivos = [];
        const vertices = this.vertices();

        // cria um array de tuplas [dispositivo, tempo]
        for (let i = 0; i < vertices.length; i++) {
            listaDispositivos.push([vertices[i], tempos[i]]);
        }

        // filtra quaisquer nós inalcançáveis (tempo infinito)
        listaDispositivos = listaDispositivos.filter(([dispositivo, tempo]) => tempo !== Infinity);
        
        // ordena o array com base no tempo de infecção (ascendente)
        listaDispositivos.sort((a, b) => a[1] - b[1]); 
        
        // mapeia para obter apenas a sequência de nomes dos dispositivos
        const sequencia = listaDispositivos.map(([dispositivo, tempo]) => dispositivo);

        // formata o resultado para um insight claro
        const sequenciaFormatada = listaDispositivos
            .map(([dispositivo, tempo]) => `${dispositivo} (${tempo}h)`)
            .join(' → ');

        return {
            sequencia: sequencia,
            sequenciaFormatada: sequenciaFormatada
        }
    }

    // exibe o tempo total e minimo de contágio
    exibirTempoContagio() {
        const horasTotais = this.calcularMinimoTempo();
        const horaMedia = this.calcularMediaTempo();

        const formatHoras = (horas) => {
            if (horas === Infinity || Number.isNaN(horas)) return 'infinito';
            const dias = Math.floor(horas / 24);
            const horasRestantes = Math.floor(horas % 24);
            let partes = [];
            if (dias > 0) partes.push(`${dias} dias`);
            partes.push(`${horasRestantes} horas`);
            return partes.join(' ');
        };

        return `\nTempo médio de contágio: ${formatHoras(horaMedia)}\nTempo total de contágio: ${formatHoras(horasTotais)}.`;
    }

    // exibe a sequência de infecção
    exibirSequenciaInfeccao() {
        const { sequenciaFormatada } = this.sequenciaInfeccao();
        return `\nSequência de infecção: ${sequenciaFormatada}`;
    }

    exibirDispositivosVulneraveis() {
        const vulneraveis = this.dispositivosVulneraveis();
        const topN = 3;
        const selecionados = vulneraveis.slice(0, Math.min(topN, vulneraveis.length));

        let resultado = '\nTop ' + selecionados.length + ' dispositivos mais vulneráveis:\n';
        resultado += 'Dispositivo\tConexões\tResistência Média\n';
        resultado += '-------------------------------------------\n';

        if (selecionados.length === 0) {
            resultado += 'Nenhum dispositivo encontrado.\n';
            return resultado;
        }

        for (const item of selecionados) {
            resultado += `${item.dispositivo}\t\t${item.grau}\t\t${item.resistenciaMedia.toFixed(2)}\n`;
        }
        return resultado;
    }

    // Representação em string do grafo
    toString() {
        const topo = [];
        if (this.topologia) topo.push(`Topologia: ${this.topologia}`);
        topo.push(`Quantidade de dispositivos: ${this.numDispositivos ?? this.vertices().length}`);
        topo.push(`Dispositivos infectados: ${this.dispositivosInfectados ? this.dispositivosInfectados.join(', ') : 'Nenhum'}`);
        const corpo = Array.from(this.adj.entries())
            .map(([n, info]) => {
                const arestas = info.arestas.map(x => `${x.to}${x.peso !== 0 ? `(seg=${x.peso})` : ''}`).join(', ');
                return `${n} -> ${arestas}`;
            })
            .join('\n');
        return topo.join('\n') + '\n' + corpo;
    }
}

export default Grafo;