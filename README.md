# 🦠 Simulador de Propagação de Vírus em Redes 🕸️

Este projeto simula a propagação de um vírus em diferentes topologias de redes de computadores, permitindo analisar o tempo de contágio, dispositivos mais vulneráveis e o impacto de múltiplos dispositivos infectados inicialmente. O simulador suporta geração automática de instâncias de redes usando IA (Google Gemini) 🤖 e análise de múltiplas redes conectadas.

## ⚡ Funcionalidades

- 🦠 Simulação de propagação de vírus em redes com topologia Estrela, Anel ou Malha.
- 🤖 Geração automática de instâncias de redes (com IA Gemini).
- 🧑‍💻 Suporte a múltiplos dispositivos infectados inicialmente.
- 🔗 Análise de múltiplas redes conectadas (multi-redes).
- ⏱️ Cálculo do tempo médio e total de contágio.
 - 🛡️ Identificação dos dispositivos mais vulneráveis.
 - 💻 Interface interativa via terminal.
 - ✏️ Edição interativa do grafo: atualizar peso de conexões e remover dispositivos.

## 🗂️ Estrutura do Projeto

├── app.js  
├── grafo.txt  
├── package.json  
├── .env  
├── README.md  
└── src/  
&emsp;├── arquivoService.js  
&emsp;├── gerarInstancia.js  
&emsp;├── menu.js  
&emsp;├── data/  
&emsp;│&emsp;├── anel/  
&emsp;│&emsp;├── estrela/  
&emsp;│&emsp;├── malha/  
&emsp;│&emsp;└── multiredes/  
&emsp;├── generator/  
&emsp;│&emsp;├── generatorConfig.js  
&emsp;│&emsp;├── gerarDispoInfectados.js  
&emsp;│&emsp;├── gerarRede1.js  
&emsp;│&emsp;└── gerarRede2.js  
&emsp;├── models/  
&emsp;│&emsp;└── Grafo.js  
&emsp;└── services/  
&emsp;&emsp;├── buildMonoGrafo.js  
&emsp;&emsp;└── buildMultiGrafo.js  

## 🛠️ Pré-requisitos

- Node.js 18+
- Conta e chave de API do [Google Gemini](https://ai.google.dev/) 🔑

## 🚀 Instalação

1. Clone o repositório:
   ```sh
   git clone <url-do-repositorio>
   cd propagacao-virus-simulador
   ```
2. Instale as dependências:
   ```sh
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto e adicione sua chave Gemini:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```

## ▶️ Como Usar

Execute o simulador:
```sh
node app.js
```

Você verá um menu interativo com as opções:
- **1️⃣ Usar uma instância existente:** Escolha e simule redes já existentes em `src/data`.
- **2️⃣ Criar uma nova com IA:** Gere uma nova rede personalizada usando Gemini.
- **3️⃣ Gerar múltiplas redes:** Crie e simule redes conectadas entre si.


Siga as instruções do terminal para escolher topologia, número de vértices, dispositivos infectados, etc.

**Edição Interativa do Grafo**

O simulador agora permite editar o grafo durante a execução:
- No menu, ao carregar uma instância, após a exibição do grafo você pode escolher a opção de edição.
- Opções de edição:
   - Atualizar peso de uma aresta: informe a origem (letra), destino (letra) e novo peso (0-10).
   - Remover um dispositivo: informe a letra do dispositivo a ser removido.

Observações sobre a edição:
- As alterações são aplicadas em memória e a visualização do grafo é atualizada imediatamente.
- Por enquanto as alterações **não** são persistidas automaticamente no arquivo `.txt` da instância; se desejar, posso adicionar uma opção para salvar as alterações de volta ao arquivo.

**Correção: remoção de dispositivo infectado**

Corrigimos um bug em que remover um dispositivo infectado causava erro ("Cannot read properties of undefined (reading 'arestas')"). Agora, ao remover um dispositivo:
- O nó é removido de forma segura do mapa de adjacência.
- O nó é removido também da lista `dispositivosInfectados` para evitar referências a vértices inexistentes.
- Os vizinhos que apontavam para o nó removido têm as arestas limpas corretamente.

Arquivos modificados relacionados a essa correção e nova funcionalidade:
- `src/models/Grafo.js` — melhorias em `deletarDispositivo`, validações e suporte a múltiplos infectados.
- `src/menu.js` — menu de edição para atualizar peso de aresta e remover dispositivo.
- `app.js` — fluxo atualizado para carregar o grafo e chamar o menu de edição.
- `src/arquivoService.js` — `carregarGrafo` agora pode retornar o grafo carregado para edição.

Recomendações de teste (local):
1. Execute `node app.js`.
2. Carregue uma instância existente (por ex. `src/data/estrela/estrela6.txt`).
3. Escolha a opção de edição e: atualize um peso, remova um dispositivo não infectado e depois remova um infectado.
4. Verifique que não ocorrem erros e que o grafo exibido reflete as alterações.

Se quiser que eu implemente a persistência (salvar alterações no `.txt`) ou que valide se uma aresta existe antes de atualizá-la (com opção de criação), posso adicionar isso em seguida.

## 🤖 Geração de Instâncias com IA

O sistema utiliza o Google Gemini para gerar automaticamente arquivos de redes no formato esperado. As instâncias são salvas em `src/data/` e podem ser reutilizadas.

## 📄 Formato dos Arquivos de Rede

Exemplo de arquivo de rede simples:
```
# Topologia de Rede: Estrela
# Número de vértices: 6
# Dispositivo infectado: E
# origem | destino | nivel de segurança
A	B	3
A	C	8
A	D	5
A	E	1
A	F	9
```

Exemplo de arquivo de múltiplas redes:
```
# Quantidade de redes: 2
# Topologias das Redes: rede1: malha, rede2: malha
# Número de vértices: rede1: 7, rede2: 10
# Dispositivos infectados: rede1: A, rede2: H, J

# rede 1
# origem | destino | nivel de segurança
A	B	7
A	C	9
...

# aresta que conecta as redes
G	H	3

# rede 2
# origem | destino | nivel de segurança
H	I	5
...
```


## 🔄 Fluxo de Funcionamento do Simulador

O simulador segue o seguinte fluxo para análise da propagação do vírus:

1. **Escolha do Usuário**
   - O usuário escolhe no menu se deseja:
     - Usar uma instância existente
     - Gerar uma nova instância com IA (Gemini)
     - Gerar e simular múltiplas redes conectadas

2. **Geração ou Seleção do Arquivo de Rede**
   - Se for uma instância existente, o usuário seleciona o arquivo desejado.
   - Se for uma nova instância, o sistema gera o arquivo automaticamente com base nos parâmetros escolhidos (topologia, número de vértices, dispositivos infectados, etc), salvando em `src/data/`.
   - Para múltiplas redes, o sistema gera ou carrega um arquivo especial contendo todas as redes e suas conexões.

3. **Leitura e Transformação do Grafo**
   - O arquivo selecionado é lido e transformado em uma estrutura de grafo na memória.
   - Para múltiplas redes, cada rede é lida separadamente e depois todas são unificadas em um grafo completo.

4. **Simulação da Propagação**
   - O simulador executa o algoritmo de propagação (BFS/Dijkstra) a partir dos dispositivos inicialmente infectados.
   - O tempo de contágio é calculado considerando o nível de segurança (peso) de cada aresta.

5. **Cálculo dos Insights**
   - O sistema calcula e exibe:
     - Tempo médio e total de contágio
     - Sequência de infecção dos dispositivos
     - Dispositivos mais vulneráveis
     - Estatísticas por rede e para o grafo completo (em caso de multi-redes)

6. **Exibição dos Resultados**
   - Os resultados são apresentados no terminal de forma clara, destacando os principais insights para análise.

## 🔒 Relação entre Nível de Segurança, Tempo de Contágio e Medidas de Segurança

Cada aresta do grafo possui um **nível de segurança** (peso) de 1 a 10, que representa o grau de proteção entre dois dispositivos. O tempo de contágio e as medidas de segurança associadas a cada faixa de peso são:

| Nível de Segurança | Tempo de Contágio | Medidas de Segurança Relacionadas (Agregadas) |
|--------------------|-------------------|-----------------------------------------------|
| **1-2 (Muito Baixo)** | 1h – 2h | **Sem Firewall/Antivírus.** Conexão direta. Senha padrão. Serviço desatualizado. |
| **3-5 (Baixo a Moderado)** | 4h – 16h | **Antivírus Desatualizado.** Firewall configurado de forma básica (regras abertas). Sem segmentação de rede (VLAN). |
| **6-8 (Alto)** | 20h – 28h | **Firewall WAF/IDS ativo. VPN obrigatória.** Servidor por trás de DMZ. Segmentação de rede forte. |
| **9-10 (Crítico)** | 32h – 48h | **Autenticação de Múltiplos Fatores (MFA). Uso de Zero Trust.** Patches 100% atualizados. Criptografia ponta a ponta. |

- **Quanto maior o nível de segurança (peso), maior o tempo necessário para o vírus se propagar entre os dispositivos.**
- Os pesos são atribuídos automaticamente ou definidos nos arquivos de instância, e refletem o cenário de proteção de cada conexão.

---

## Observações

- 🎓 O projeto foi desenvolvido para fins acadêmicos.
- 💸 O uso da API Gemini pode gerar custos dependendo do seu plano Google Cloud.
- 🧐 Sempre revise as instâncias geradas automaticamente para garantir a validade dos dados.

## 👥 Colaboradores

- João Carlos Guimarães Iannuzzi
- Diandre Bruce
- Evelly
- Luanne
- Veríssimo Casas

---

Desenvolvido para a disciplina de Algoritmo e Estrutura de Dados II. 👨‍💻