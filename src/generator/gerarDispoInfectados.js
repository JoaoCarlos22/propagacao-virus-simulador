// função para gerar os dispositivos infectados aleatórios
export function gerarDispoInfectado(numVertices, numInfectados) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let infectados = [];
    while (infectados.length < numInfectados) {
        const index = Math.floor(Math.random() * Math.min(numVertices, letters.length));
        const letra = letters[index];
        if (!infectados.includes(letra)) {
            infectados.push(letra);
        }
    }
    return infectados.join(', ');
}