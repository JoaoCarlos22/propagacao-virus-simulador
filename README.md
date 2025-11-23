
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