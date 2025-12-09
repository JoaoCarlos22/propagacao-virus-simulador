class Grafo {
    static TEMPO_NIVEL_SEG = {
        1: 1, 2: 2, 3: 4, 4: 8, 5: 16,
        6: 20, 7: 24, 8: 28, 9: 32, 10: 48
    };

    constructor(topologia, numDispositivos, dispoInfectados, options = {}) {
        // Mapa de adjacência: vértice (dispositivo) -> { arestas: [{to, peso (nível de segurança)}], infectado: boolean }
        this.adj = new Map();
        this.topologia = topologia || 'indefinida';
        this.numDispositivos = numDispositivos || 0;
        // garantir array seguro para dispositivos infectados
        this.dispositivosInfectados = Array.isArray(dispoInfectados) ? [...dispoInfectados] : (dispoInfectados ? [...dispoInfectados] : []);

        // 🔹 novo: metadados de grupos para multiredes
        // mapa: idDoVertice -> "rede1" | "rede2" | ...
        this.grupoPorVertice = options.grupoPorVertice || null;
        // mapa: "rede1" -> "estrela", "rede2" -> "malha", etc.
        this.topologiaGrupos = options.topologiaGrupos || null;

        // cache interno dos tempos de infecção (para evitar recalcular Dijkstra toda hora)
        this._temposInfeccaoCache = null;
    }

    // para cada nivel de peso é atribuido um tempo (hora) de contágio
    tempoPorNivel(nivel) {
        return Grafo.TEMPO_NIVEL_SEG[nivel];
    }

    // Garantir que um vértice exista na lista de adjacência
    // criar = true (padrão) → cria o vértice se não existir
    // criar = false         → apenas verifica, sem criar nada
    _validar(vertice, criar = true) {
        const jaExiste = this.adj.has(vertice);

        if (!jaExiste && !criar) {
            // modo "somente validar": não cria vértice novo
            return false;
        }

        if (!jaExiste) {
            // verificar se o vértice é infectado inicial
            const infectado = (
                this.dispositivosInfectados &&
                this.dispositivosInfectados.includes(vertice)
            ) ? true : false;

            this.adj.set(vertice, { arestas: [], infectado });
            this._recontarDispositivos();
        }

        return true;
    }

    // invalida o cache dos tempos de infecção sempre que o grafo for modificado
    _resetTemposCache() {
        this._temposInfeccaoCache = null;
    }

    // verifica se um vértice existe no grafo (sem criar nada)
    existe(vertice) {
        return this.adj.has(vertice);
    }

    addAresta(u, v, peso) {
        this._validar(u);
        this._validar(v);
        this.adj.get(u).arestas.push({ to: v, peso });
        this.adj.get(v).arestas.push({ to: u, peso });
        this._recontarDispositivos();

        // grafo mudou → invalida cache de tempos
        this._resetTemposCache();
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

        // grafo mudou → invalida cache de tempos
        this._resetTemposCache();
    }

    // verifica se existe uma aresta entre u e v (grafo não-direcionado)
    temAresta(u, v) {
        const entry = this.adj.get(u);
        if (!entry) return false;
        return entry.arestas.some(a => a.to === v);
    }

    // obtém informações da aresta entre u e v (no sentido u -> v)
    // retorna { from, to, peso } ou null se não existir
    getAresta(u, v) {
        const entry = this.adj.get(u);
        if (!entry) return null;

        const found = entry.arestas.find(a => a.to === v);
        if (!found) return null;

        return {
            from: u,
            to: v,
            peso: found.peso
        };
    }

    // remove a aresta entre u e v (grafo não-direcionado)
    // retorna true se alguma aresta foi removida, false caso contrário
    removerAresta(u, v) {
        let removed = false;

        const entryU = this.adj.get(u);
        if (entryU) {
            const antes = entryU.arestas.length;
            entryU.arestas = entryU.arestas.filter(a => a.to !== v);
            if (entryU.arestas.length < antes) {
                removed = true;
            }
        }

        const entryV = this.adj.get(v);
        if (entryV) {
            const antes = entryV.arestas.length;
            entryV.arestas = entryV.arestas.filter(a => a.to !== u);
            if (entryV.arestas.length < antes) {
                removed = true;
            }
        }

        if (removed) {
            this._resetTemposCache(); // tempos de infecção mudam quando a topologia muda
        }

        return removed;
    }

    // lista todas as arestas do grafo (não-direcionado), sem duplicatas
    // retorna array de objetos { source, target, weight }
    listarArestas() {
        const arestas = [];
        const vistos = new Set();

        for (const [from, entry] of this.adj.entries()) {
            const lista = entry.arestas || [];
            for (const a of lista) {
                const to = a.to;
                const peso = a.peso;

                // normaliza o par para evitar duplicatas (A|B == B|A)
                const aId = String(from);
                const bId = String(to);
                const key = aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;

                if (vistos.has(key)) continue;
                vistos.add(key);

                arestas.push({
                    source: from,
                    target: to,
                    weight: peso
                });
            }
        }

        return arestas;
    }

    // remove um dispositivo e todas as suas conexões
    deletarDispositivo(dispositivo) {
        // Se o dispositivo não existir, não há nada a remover
        if (!this.adj.has(dispositivo)) {
            return false; // indica que nada foi removido
        }

        // Remove o dispositivo da lista de infectados, se estiver lá
        if (Array.isArray(this.dispositivosInfectados)) {
            this.dispositivosInfectados = this.dispositivosInfectados.filter(
                d => d !== dispositivo
            );
        }

        // Pega os vizinhos diretamente a partir das arestas desse dispositivo
        const entry = this.adj.get(dispositivo);
        const vizinhos = entry ? entry.arestas.map(a => a.to) : [];

        // Para cada vizinho, remove a aresta que aponta para o dispositivo removido
        for (const vizinho of vizinhos) {
            const dadosVizinho = this.adj.get(vizinho);
            if (!dadosVizinho) continue; // proteção extra

            dadosVizinho.arestas = dadosVizinho.arestas.filter(
                a => a.to !== dispositivo
            );
        }

        // Remove o dispositivo do mapa de adjacência
        this.adj.delete(dispositivo);

        // Atualiza o contador total de dispositivos para manter consistência
        this._recontarDispositivos();

        // grafo mudou → invalida cache de tempos
        this._resetTemposCache();
        
        if (Array.isArray(this.dispositivosInfectados) &&
            this.dispositivosInfectados.length === 0) {
            this._semInfectadosIniciais = true;
        }

        // Retorna true indicando que a remoção foi feita com sucesso
        return true;
    }


    vertices() {
        return Array.from(this.adj.keys());
    }

    _recontarDispositivos() {
        this.numDispositivos = this.adj.size;
    }

    // calcula o grau de um dispositivo
    conexoes(dispositivo) {
        const entry = this.adj.get(dispositivo);
        if (!entry) return 0;
        return entry.arestas.length;
    }

    // calcula a resistencia media de um dispositivo (soma dos pesos / grau)
    resistenciaMedia(dispositivo) {
        const entry = this.adj.get(dispositivo);
        if (!entry) return 0; // se o vértice não existir, resistência 0

        const arestas = entry.arestas;
        const conexoes = arestas.length;

        // evitar divisao por zero (dispositivo isolado)
        if (conexoes === 0) return 0;

        const somaPesos = arestas.reduce((acc, val) => acc + val.peso, 0);
        return somaPesos / conexoes;
    }

    // Retorna informações consolidadas sobre um dispositivo (vértice) do grafo
    infoDispositivo(dispositivo) {
        const entry = this.adj.get(dispositivo);

        // se o vértice não existe, devolve um objeto "vazio" mas informativo
        if (!entry) {
            return {
                id: dispositivo,
                existe: false,
                grau: 0,
                resistenciaMedia: 0,
                infectadoInicial: false,
                tempoInfeccao: Infinity,
                alcancavel: false,
                vizinhos: []
            };
        }

        // grau = número de arestas
        const grau = entry.arestas.length;

        // vizinhos = lista única de ids conectados a partir deste dispositivo
        const vizinhos = entry.arestas.map(a => a.to);

        // já temos resistenciaMedia otimizada na Task 5
        const resistenciaMedia = this.resistenciaMedia(dispositivo);

        // infectado inicial? (seed)
        const infectadoInicial = Array.isArray(this.dispositivosInfectados)
            ? this.dispositivosInfectados.includes(dispositivo)
            : false;

        // tempo de infecção usando o mapa de tempos (Task 2 + Patch 3)
        const tempos = this.calcularTemposInfeccao(); // { A: 0, B: 5, ... }
        const tempoInfeccao = tempos[dispositivo];

        // alcancavel = tem um tempo finito
        const alcancavel = tempoInfeccao !== undefined && tempoInfeccao !== Infinity;

        return {
            id: dispositivo,
            existe: true,
            grau,
            resistenciaMedia,
            infectadoInicial,
            tempoInfeccao,
            alcancavel,
            vizinhos
        };
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
    _calcularTemposInfeccaoBruto() {
        const tempos = {};
        const infectados = new Set();
        const fila = [];

        // Suporte a múltiplos dispositivos infectados
        let fontes = Array.isArray(this.dispositivosInfectados)
            ? [...this.dispositivosInfectados]
            : [];

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
        return tempos;
    }

    // wrapper público que usa cache interno para os tempos de infecção
    calcularTemposInfeccao() {
        // se já temos cache, reutiliza
        if (this._temposInfeccaoCache !== null) {
            return this._temposInfeccaoCache;
        }

        // caso contrário, calcula do zero e guarda no cache
        const tempos = this._calcularTemposInfeccaoBruto();
        this._temposInfeccaoCache = tempos;
        return tempos;
    }


    // calcula o tempo medio total de infeccao
    calcularMediaTempo() {
        const tempos = this.calcularTemposInfeccao();   // { A: 0, B: 5, C: Infinity, ... }
        const valores = Object.values(tempos);

        // filtra só os tempos finitos (nós realmente infectados)
        const finitos = valores.filter(v => v !== Infinity);

        // se não houver nenhum nó com tempo finito, não houve propagação
        if (finitos.length === 0) return 0;

        const somaTempos = finitos.reduce((acc, val) => acc + val, 0);
        return somaTempos / finitos.length;
    }

    // calcula o tempo minimo total de infeccao
    calcularMinimoTempo() {
        const tempos = this.calcularTemposInfeccao();
        const valores = Object.values(tempos);
        const finitos = valores.filter(v => v !== Infinity);

        if (finitos.length === 0) return 0;

        return Math.max(...finitos);
    }

    sequenciaInfeccao() {
        const tempos = this.calcularTemposInfeccao();   // { A: 0, B: 5, ... }
        let listaDispositivos = [];

        // monta [dispositivo, tempo] de forma explícita
        for (const dispositivo of this.vertices()) {
            const tempo = tempos[dispositivo];
            listaDispositivos.push([dispositivo, tempo]);
        }

        // filtra nós inalcançáveis (tempo infinito)
        listaDispositivos = listaDispositivos.filter(
            ([, tempo]) => tempo !== Infinity
        );

        // ordena pelo tempo de infecção (ascendente)
        listaDispositivos.sort((a, b) => a[1] - b[1]);

        // só os nomes na ordem
        const sequencia = listaDispositivos.map(([dispositivo]) => dispositivo);

        // string bonitinha
        const sequenciaFormatada = listaDispositivos
            .map(([dispositivo, tempo]) => `${dispositivo} (${tempo}h)`)
            .join(' → ');

        return {
            sequencia,
            sequenciaFormatada
        };
    }

    // exibe o tempo total e minimo de contágio
    exibirTempoContagio() {
        const horasTotais = this.calcularMinimoTempo();
        const horaMedia = this.calcularMediaTempo();

        // Caso especial: sem infectados iniciais ou nenhum nó alcançável
        if (horasTotais === 0 && horaMedia === 0) {
            return '\nNenhum dispositivo será infectado: ' +
                   'não há dispositivos infectados iniciais ou não há caminhos válidos.';
        }

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

    // Gera um objeto puro pronto pra virar JSON (sem mexer com fs)
    toSimulationResult(meta = {}) {
        // pegar sequência de infecção
        const { sequencia } = this.sequenciaInfeccao();

        return {
            meta: {
                // metadados da execução (vem de fora)
                tipoSimulacao: meta.tipoSimulacao || 'mono',     // 'mono' | 'multi'
                arquivoOrigem: meta.arquivoOrigem || null,
                dataExecucao: meta.dataExecucao || new Date().toISOString(),
                ...meta.extra,                                   // espaço pra mais coisas no futuro
            },
            grafo: {
                topologia: this.topologia,
                numDispositivos: this.numDispositivos ?? this.vertices().length,
                dispositivosInfectados: Array.isArray(this.dispositivosInfectados)
                    ? [...this.dispositivosInfectados]
                    : [],
                tempoTotalHoras: this.calcularMinimoTempo(),
                tempoMedioHoras: this.calcularMediaTempo(),
                sequenciaInfeccao: sequencia,
                dispositivosVulneraveis: this.dispositivosVulneraveis(),
            }
        };
    }

    // Gera um payload no formato esperado pela interface 3D (script.js)
    toFrontendSimulation(metaOverride = {}) {
        const vertices = this.vertices();                 // lista de ids dos nós
        const tempos = this.calcularTemposInfeccao();     // { id: tempo }
        const totalNodes = vertices.length;

        // Helper para criar node sem repetir código
        const makeNode = (id, x, y, z) => {
            const infectedTime = tempos[id];
            const isReachable = infectedTime !== undefined && infectedTime !== Infinity;
            const isInfectedStart = Array.isArray(this.dispositivosInfectados)
                ? this.dispositivosInfectados.includes(id)
                : false;

            return {
                id,
                x,
                y,
                z,
                infectedTime,
                isInfectedStart,
                isReachable
            };
        };

        const nodes = [];
        const topo = (this.topologia || '').toLowerCase();
        const ehMultirede = topo.startsWith('multirede');
        const ehEstrelaSimples = topo.startsWith('estrela');

        if (ehMultirede && this.grupoPorVertice) {
            // 🔹 MULTI-REDE: clusteriza por grupo (rede1, rede2, etc.)
            const grupos = new Map(); // grupoId -> array de vértices

            for (const id of vertices) {
                const g = this.grupoPorVertice[id] || 'default';
                if (!grupos.has(g)) grupos.set(g, []);
                grupos.get(g).push(id);
            }

            const groupIds = Array.from(grupos.keys());
            const numGroups = groupIds.length || 1;

            // distância entre grupos no eixo X
            const baseDist = Math.max(60, totalNodes * 3);

            groupIds.forEach((grupoId, idx) => {
                const vs = grupos.get(grupoId);
                if (!vs || vs.length === 0) return;

                // centro do grupo no espaço
                const centerX = (idx - (numGroups - 1) / 2) * baseDist;
                const centerZ = 0;

                const topoGrupo = (this.topologiaGrupos && this.topologiaGrupos[grupoId])
                    ? this.topologiaGrupos[grupoId].toLowerCase()
                    : '';

                const ehEstrelaGrupo = topoGrupo.startsWith('estrela');

                if (ehEstrelaGrupo && vs.length > 1) {
                    // layout estrela por grupo
                    let central = vs[0];
                    let maxGrau = this.conexoes(central);

                    for (const v of vs) {
                        const g = this.conexoes(v);
                        if (g > maxGrau) {
                            maxGrau = g;
                            central = v;
                        }
                    }

                    const outros = vs.filter(v => v !== central);
                    const radius = Math.max(20, vs.length * 3);

                    // nó central
                    nodes.push(makeNode(central, centerX, 0, centerZ));

                    // folhas em círculo
                    outros.forEach((id, index) => {
                        const angle = (2 * Math.PI * index) / Math.max(1, outros.length);
                        const x = centerX + radius * Math.cos(angle);
                        const z = centerZ + radius * Math.sin(angle);
                        nodes.push(makeNode(id, x, 0, z));
                    });

                } else {
                    // layout genérico em círculo para esse grupo
                    const radius = Math.max(20, vs.length * 3);

                    vs.forEach((id, index) => {
                        const angle = (2 * Math.PI * index) / Math.max(1, vs.length);
                        const x = centerX + radius * Math.cos(angle);
                        const z = centerZ + radius * Math.sin(angle);
                        nodes.push(makeNode(id, x, 0, z));
                    });
                }
            });

        } else if (ehEstrelaSimples && totalNodes > 0) {
            // 🔹 CASO ESTRELA "SIMPLES" (um grafo só)
            let central = vertices[0];
            let maxGrau = this.conexoes(central);

            for (const v of vertices) {
                const grau = this.conexoes(v);
                if (grau > maxGrau) {
                    maxGrau = grau;
                    central = v;
                }
            }

            const outros = vertices.filter(v => v !== central);
            const radius = Math.max(20, totalNodes * 3);

            nodes.push(makeNode(central, 0, 0, 0));

            outros.forEach((id, index) => {
                const angle = (2 * Math.PI * index) / Math.max(1, outros.length);
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                nodes.push(makeNode(id, x, 0, z));
            });

        } else {
            // 🔹 CASO GENÉRICO (um grafo só, sem topologia especial)
            const radius = Math.max(20, totalNodes * 4);
            vertices.forEach((id, index) => {
                const angle = (2 * Math.PI * index) / Math.max(1, totalNodes);
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                nodes.push(makeNode(id, x, 0, z));
            });
        }

        // Construir links (aresta não-direcionada; evitar duplicar A-B e B-A)
        const links = [];
        const vistos = new Set();

        for (const [from, entry] of this.adj.entries()) {
            const arestas = entry.arestas || [];
            for (const aresta of arestas) {
                const to = aresta.to;
                const peso = aresta.peso;

                // normalizar par (from, to) para evitar duplicata
                const a = String(from);
                const b = String(to);
                const key = a < b ? `${a}|${b}` : `${b}|${a}`;

                if (vistos.has(key)) continue;
                vistos.add(key);

                links.push({
                    source: from,
                    target: to,
                    weight: peso
                });
            }
        }

        // métricas globais usando os tempos já cacheados
        const valoresTempos = Object.values(tempos);
        const finitos = valoresTempos.filter(v => v !== Infinity);

        const maxTime = finitos.length === 0
            ? 0
            : Math.max(...finitos);

        const averageTime = finitos.length === 0
            ? 0
            : finitos.reduce((acc, v) => acc + v, 0) / finitos.length;

        const reachableNodes = nodes.filter(n => n.isReachable).length;

        // meta padrão, com possibilidade de override
        const meta = {
            topology: this.topologia || metaOverride.topology || null,
            totalNodes,
            reachableNodes,
            maxTime: Number.isFinite(maxTime) ? maxTime : null,
            averageTime: Number.isFinite(averageTime) ? averageTime : null,
            ...metaOverride // permite sobrescrever campos se necessário
        };

        return {
            meta,
            nodes,
            links
        };
    }

}

export default Grafo;