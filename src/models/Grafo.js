class Grafo {
    constructor(topologia, numDispositivos, dispInfectado) {
        // Mapa de adjacência: vértice (dispositivo) -> { arestas: [{to, peso (nível de segurança)}], infectado: boolean }
        this.adj = new Map();
        this.topologia = topologia || 'indefinida';
        this.numDispositivos = numDispositivos || 0;
        this.dispositivoInfectado = dispInfectado || null;
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