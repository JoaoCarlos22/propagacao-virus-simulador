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

    buscaLargura() {
        const infectados = new Set();
        const fila = [];
        let tempoTotal = 0;

        // Iniciar a busca a partir do dispositivo infectado
        if (this.dispositivoInfectado && this.adj.has(this.dispositivoInfectado)) {
            fila.push(this.dispositivoInfectado);
            infectados.add(this.dispositivoInfectado);
        }

        while (fila.length > 0) {
            const atual = fila.shift();
            const infoAtual = this.adj.get(atual);

            for (const aresta of infoAtual.arestas) {
                const vizinho = aresta.to;
                if (!infectados.has(vizinho)) {
                    // somatorio simples: pega o tempo atribuido ao peso e adiciona ao total
                    tempoTotal += this.tempoPorNivel(aresta.peso);
                    infectados.add(vizinho);
                    fila.push(vizinho);
                }
            }
        }

        return tempoTotal;
    }

    // exibe o tempo total de contágio
    tempoContagio() {
        const horas = this.buscaLargura();
        const dias = Math.floor(horas / 24);
        const horasRestantes = horas % 24;
        let resultado = "\nTempo de contágio total: ";
        if (dias > 0) {
            resultado += dias + " dias ";
        }
        resultado += horasRestantes + " horas.";
        return resultado;
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