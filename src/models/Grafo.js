class Grafo {
    static TEMPO_NIVEL_SEG = {
        1: 1, 2: 2, 3: 4, 4: 8, 5: 16,
        6: 20, 7: 24, 8: 28, 9: 32, 10: 48
    };

    constructor(topologia, numDispositivos, dispInfectado) {
        // Mapa de adjacência: vértice (dispositivo) -> { arestas: [{to, peso (nível de segurança)}], infectado: boolean }
        this.adj = new Map();
        this.topologia = topologia || 'indefinida';
        this.numDispositivos = numDispositivos || 0;
        this.dispositivoInfectado = dispInfectado || null;
    }

    // para cada nivel de peso é atribuido um tempo (hora) de contágio
    tempoPorNivel(nivel) {
        return Grafo.TEMPO_NIVEL_SEG[nivel];
    }

    // Garantir que um vértice exista na lista de adjacência
    _validar(vertice) {
        // verificar se o vértice é o vértice infectado
        const infectado = vertice === this.dispositivoInfectado;
        if (!this.adj.has(vertice)) this.adj.set(vertice, { arestas: [], infectado });
    }

    addAresta(u, v, peso) {
        this._validar(u);
        this._validar(v);
        this.adj.get(u).arestas.push({ to: v, peso });
        this.adj.get(v).arestas.push({ to: u, peso });
    }

    vertices() {
        return Array.from(this.adj.keys());
    }

    // calcula o tempo de infeccao para cada dispositivo usando Dijkstra
    calcularTemposInfeccao() {
        const tempos = {};
        const infectados = new Set();
        const fila = [];

        // Inicializa todos os tempos como infinito, exceto o infectado inicial
        for (const v of this.vertices()) {
            tempos[v] = Infinity;
        }
        tempos[this.dispositivoInfectado] = 0;
        fila.push({ vertice: this.dispositivoInfectado, tempo: 0 });

        while (fila.length > 0) {
            // Seleciona o nó com menor tempo acumulado
            fila.sort((a, b) => a.tempo - b.tempo);
            const { vertice: atual, tempo: tempoAtual } = fila.shift();
            if (infectados.has(atual)) continue;
            infectados.add(atual);

            // Atualiza os tempos dos vizinhos
            for (const aresta of this.adj.get(atual).arestas) {
                // Calcula o tempo acumulado para o vizinho
                const vizinho = aresta.to;
                const tempoNovo = tempoAtual + this.tempoPorNivel(aresta.peso);

                // Se o novo tempo for menor, atualiza e adiciona à fila
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

    // Representação em string do grafo
    toString() {
        const topo = [];
        if (this.topologia) topo.push(`Topologia: ${this.topologia}`);
        topo.push(`Quantidade de dispositivos: ${this.numDispositivos ?? this.vertices().length}`);
        if (this.dispositivoInfectado) topo.push(`Dispositivo infectado: ${this.dispositivoInfectado}`);
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