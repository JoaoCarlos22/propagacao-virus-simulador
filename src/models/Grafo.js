class Grafo {
    constructor() {
        // Mapa de adjacência: vértice (dispositivo) -> { arestas: [{to, peso (nível de segurança)}], infectado }
        this.adj = new Map();
    }

    // Garantir que um vértice exista na lista de adjacência
    _validar(vertice) {
        if (!this.adj.has(vertice)) this.adj.set(vertice, { arestas: [], infectado: false });
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

    // Retorna as arestas do grafo com estado de cada nó
    toString() {
        return Array.from(this.adj.entries())
            .map(([n, info]) => {
                const estado = info.infectado ? 'infectado' : 'saudável';
                const arestas = info.arestas.map(x => `${x.to}${x.peso !== 1 ? `(seg=${x.peso})` : ''}`).join(', ');
                return `${n} (${estado}) -> ${arestas}`;
            })
            .join('\n');
    }
}

export default Grafo;