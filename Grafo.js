class Grafo {
    constructor() {
        // Mapa de adjacência: nó -> lista de {to, peso}
        this.adj = new Map();
    }

    // Garantir que um nó exista na lista de adjacência
    _ensure(vertice) {
        if (!this.adj.has(vertice)) this.adj.set(vertice, []);
    }

    addAresta(u, v, peso) {
        this._ensure(u);
        this._ensure(v);
        this.adj.get(u).push({ to: v, peso });
        this.adj.get(v).push({ to: u, peso });
    }

    vertices() {
        return Array.from(this.adj.keys());
    }

    // Retorna as arestas do grafo
    toString() {
        return Array.from(this.adj.entries())
            .map(([n, neis]) => `${n} -> ${neis.map(x => `${x.to}${x.peso !== 1 ? `(${x.peso})` : ''}`).join(', ')}`)
            .join('\n');
    }
}

export default Grafo;