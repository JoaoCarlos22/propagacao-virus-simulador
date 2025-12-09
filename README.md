# 🦠 Simulador de Propagação de Vírus em Redes 🕸️

Este projeto simula a propagação de um vírus em diferentes topologias de redes de computadores, permitindo analisar o tempo de contágio, dispositivos mais vulneráveis e o impacto de múltiplos dispositivos infectados inicialmente. O simulador suporta geração automática de instâncias de redes usando IA (Google Gemini) 🤖 e análise de múltiplas redes conectadas.

**Novidade: Interface Web 3D Interativa!** 🎨

O simulador agora possui uma interface web moderna com visualização 3D usando Three.js, permitindo explorar a propagação do vírus de forma visual e interativa.

## ⚡ Funcionalidades

- 🦠 Simulação de propagação de vírus em redes com topologia Estrela, Anel ou Malha.
- 🤖 Geração automática de instâncias de redes (com IA Gemini).
- 🧑‍💻 Suporte a múltiplos dispositivos infectados inicialmente.
- 🔗 Análise de múltiplas redes conectadas (multi-redes).
- ⏱️ Cálculo do tempo médio e total de contágio.
- 🛡️ Identificação dos dispositivos mais vulneráveis.
- 💻 Interface CLI interativa via terminal.
- 🌐 **Interface web 3D interativa com visualização em tempo real**.
- 🎮 **Controles de simulação**: play/pause, velocidade ajustável, timeline de propagação.
- ✏️ **Edição em tempo real**: atualizar pesos de conexões e remover dispositivos pela interface web.
- 📊 **Painel de métricas**: estatísticas da simulação, informações de nós e progresso visual.

## 🗂️ Estrutura do Projeto

```
├── app.js                  # CLI interativo (terminal)
├── server.js               # Servidor Express + API REST
├── index.html              # Interface web principal
├── package.json
├── .env
├── README.md
├── public/                 # Recursos web
│   └── script.js           # Visualização 3D (Three.js)
└── src/
    ├── arquivoService.js
    ├── gerarInstancia.js
    ├── historyService.js   # Salvamento de histórico JSON
    ├── menu.js
    ├── data/
    │   ├── anel/
    │   ├── estrela/
    │   ├── malha/
    │   ├── multiredes/
    │   └── resultados/     # Histórico de simulações
    ├── generator/
    │   ├── generatorConfig.js
    │   ├── gerarDispoInfectados.js
    │   ├── gerarRede1.js
    │   └── gerarRede2.js
    ├── models/
    │   └── Grafo.js        # Modelo principal + algoritmos
    └── services/
        ├── buildMonoGrafo.js
        └── buildMultiGrafo.js
```  

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

### 🌐 Interface Web (Recomendado)

1. Inicie o servidor:
   ```sh
   npm start
   # ou
   node server.js
   ```

2. O servidor iniciará na porta **3000** (ou na porta definida em `process.env.PORT`).

3. Abra o navegador em:
   ```
   http://localhost:3000
   ```
   
   **No Dev Container**, você pode usar:
   ```sh
   "$BROWSER" http://localhost:3000
   ```

4. Na interface web você pode:
   - **Carregar instâncias existentes**: selecione por categoria (Estrela, Anel, Malha, Multi-redes)
   - **Gerar novas instâncias com IA**: escolha topologia, número de vértices e dispositivos infectados
   - **Gerar múltiplas redes**: crie e conecte até 5 redes diferentes
   - **Visualizar em 3D**: explore a rede com controles de órbita, zoom e rotação
   - **Controlar a simulação**: play/pause, ajustar velocidade (0.1x a 5x)
   - **Editar em tempo real**: atualizar pesos de arestas ou remover dispositivos
   - **Ver informações de nós**: clique em qualquer dispositivo para ver suas métricas

### 💻 Interface CLI (Terminal)

Execute o simulador via terminal:
```sh
node app.js
```

Você verá um menu interativo com as opções:
- **1️⃣ Usar uma instância existente:** Escolha e simule redes já existentes em `src/data`.
- **2️⃣ Criar uma nova com IA:** Gere uma nova rede personalizada usando Gemini.
- **3️⃣ Gerar múltiplas redes:** Crie e simule redes conectadas entre si.

Siga as instruções do terminal para escolher topologia, número de vértices, dispositivos infectados, etc.

**Edição Interativa do Grafo (CLI)**

O simulador CLI permite editar o grafo durante a execução:
- No menu, ao carregar uma instância, após a exibição do grafo você pode escolher a opção de edição.
- Opções de edição:
   - Atualizar peso de uma aresta: informe a origem (letra), destino (letra) e novo peso (0-10).
   - Remover um dispositivo: informe a letra do dispositivo a ser removido.

Observações sobre a edição:
- As alterações são aplicadas em memória e a visualização do grafo é atualizada imediatamente.
- Por enquanto as alterações **não** são persistidas automaticamente no arquivo `.txt` da instância.

## 🎨 Interface Web 3D

A interface web oferece uma experiência visual completa:

### Visualização 3D com Three.js
- **Renderização de nós**: esferas coloridas representam os dispositivos
  - 🟢 Verde: não infectado
  - 🟡 Amarelo: seed inicial (infectado no tempo 0)
  - 🔴 Vermelho: infectado durante a simulação
  - ⚫ Cinza: inalcançável
- **Links animados**: conexões entre dispositivos com transparência
- **Labels de dispositivos**: identificação de cada nó em 3D
- **Controles de câmera**: OrbitControls para navegação intuitiva

### Painéis Informativos
- **Status da Simulação**: tempo atual, contagem de infectados, topologia
- **Controles**: play/pause, reset, ajuste de velocidade
- **Progresso Visual**: barra de progresso com timeline de infecção
- **Informações do Nó**: ao clicar em um dispositivo, veja:
  - ID do dispositivo
  - Tempo de infecção
  - Número de conexões
  - Status atual
  - Opção de remover

### Funcionalidades de Edição (Web)
- **Atualizar peso de aresta**: origem, destino e novo peso (0-10)
- **Remover dispositivo**: delete um nó e suas conexões
- Alterações refletem imediatamente na visualização 3D

### Responsividade
- Layout adaptável para desktop e mobile
- Painéis otimizados para telas menores
- Controles touch-friendly

## 🔌 API REST

O `server.js` expõe os seguintes endpoints:

### GET `/api/files`
Lista todos os arquivos de instâncias disponíveis em `src/data`.

**Resposta:**
```json
{
  "files": [
    { "name": "estrela6.txt", "path": "estrela/estrela6.txt", "category": "estrela" },
    ...
  ]
}
```

### GET `/api/simulate?file=<path>`
Carrega e simula um arquivo de rede.

**Parâmetros:**
- `file`: caminho relativo (ex: `estrela/estrela6.txt`)

**Resposta:** Payload JSON com nós, links e metadados da simulação (formato esperado pelo `public/script.js`).

### POST `/api/generate`
Gera uma nova instância mono-rede usando IA.

**Body:**
```json
{
  "topology": "estrela|anel|malha",
  "numVertices": 10,
  "numInfected": 2
}
```

**Resposta:**
```json
{
  "filename": "estrela_10v_2i_2025-01-15T12-30-45-123Z.txt",
  "path": "estrela/estrela_10v_2i_2025-01-15T12-30-45-123Z.txt",
  "message": "Instância gerada com sucesso!"
}
```

### POST `/api/generate-multi`
Gera uma multi-rede usando IA.

**Body:**
```json
{
  "redes": [
    { "topologia": "estrela", "numVertices": 8, "numInfectados": 1 },
    { "topologia": "malha", "numVertices": 10, "numInfectados": 2 }
  ]
}
```

### POST `/api/edit/edge/update`
Atualiza o peso de uma aresta no grafo carregado.

**Body:**
```json
{
  "from": "A",
  "to": "B",
  "peso": 7
}
```

### POST `/api/edit/edge/delete`
Remove uma aresta do grafo carregado.

### POST `/api/edit/node/delete`
Remove um dispositivo e todas as suas conexões.

**Body:**
```json
{
  "id": "A"
}
```

**Resposta:** Payload atualizado da simulação (formato Three.js).

## 📊 Histórico de Simulações

O simulador salva automaticamente um snapshot JSON de cada simulação executada em `src/data/resultados`, organizado por tipo:
- `mono/`: simulações de redes únicas
- `multi/`: multi-redes completas
- `edicoes/`: modificações feitas pela interface web

Cada arquivo contém:
- Metadados da execução (timestamp, tipo, origem)
- Estrutura completa do grafo (vértices, arestas, pesos)
- Métricas calculadas (tempos, sequência, vulneráveis)

## 🤖 Geração de Instâncias com IA

O sistema utiliza o Google Gemini para gerar automaticamente arquivos de redes no formato esperado. As instâncias são salvas em `src/data/` e podem ser reutilizadas.

Arquivos relevantes:
- `src/generator/generatorConfig.js` — prompts e configuração da API
- `src/generator/gerarRede1.js` — geração de mono-redes
- `src/generator/gerarRede2.js` — geração de multi-redes

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

### Interface Web (Fluxo Visual)

1. **Acesso à Interface**
   - Abra `http://localhost:3000` no navegador
   - Interface carrega automaticamente com Three.js e controles

2. **Seleção de Modo**
   - Abas: Carregar | IA | Multi | Editar
   - Escolha entre carregar instância existente ou gerar nova

3. **Carregamento/Geração**
   - **Carregar**: selecione categoria e arquivo → clique em "Carregar e Simular"
   - **IA**: escolha topologia, vértices e infectados → gera arquivo automaticamente
   - **Multi**: configure cada rede individualmente → gera multi-rede conectada

4. **Visualização 3D**
   - Grafo renderizado em 3D com posicionamento automático
   - Layout especializado para Estrela (hub central + folhas em círculo)
   - Multi-redes: cada rede posicionada como cluster separado

5. **Simulação Interativa**
   - Controles de play/pause e velocidade
   - Nós mudam de cor conforme são infectados
   - Timeline mostra progresso e sequência de infecção

6. **Edição e Exploração**
   - Clique em nós para ver informações detalhadas
   - Aba "Editar" permite modificar pesos ou remover dispositivos
   - Alterações refletem imediatamente na visualização

### Interface CLI (Fluxo Original)

O simulador CLI segue o fluxo tradicional para análise da propagação do vírus:

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

## 🧪 Testando a Interface Web

1. **Teste Básico de Visualização**
   ```sh
   npm start
   "$BROWSER" http://localhost:3000
   ```
   - Carregue uma instância existente (ex: `src/data/estrela/estrela15.txt`)
   - Verifique se o grafo renderiza em 3D
   - Teste os controles de órbita (arrastar, zoom, rotação)

2. **Teste de Simulação**
   - Clique em "Play" e observe a propagação do vírus
   - Ajuste a velocidade com o slider (0.1x a 5x)
   - Verifique se as cores dos nós mudam conforme infectados
   - Confirme que a timeline mostra a sequência correta

3. **Teste de Edição**
   - Clique em um nó para ver suas informações
   - Vá para aba "Editar"
   - Atualize o peso de uma aresta (ex: A → B de 3 para 8)
   - Remova um dispositivo e veja a visualização atualizar
   - Confirme que o painel de status reflete as mudanças

4. **Teste de Geração com IA**
   - Aba "IA": escolha Estrela, 10 vértices, 2 infectados
   - Clique em "Gerar com IA" e aguarde
   - Verifique se o arquivo é criado em `src/data/estrela`
   - Carregue o arquivo gerado e simule

5. **Teste de Multi-Redes**
   - Aba "Multi": configure 2 redes (Estrela + Malha)
   - Gere a multi-rede
   - Verifique se as redes aparecem como clusters separados
   - Confirme que a aresta de conexão está visível

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** 18+ — runtime JavaScript
- **Express** 5.x — servidor HTTP e API REST
- **CORS** — habilita requisições cross-origin

### Frontend
- **Three.js** 0.160.0 — renderização 3D (WebGL)
- **OrbitControls** — navegação 3D interativa
- **Vanilla JavaScript** — lógica da interface (ES modules)
- **HTML5 + CSS3** — estrutura e estilo responsivo

### IA e Processamento
- **Google Generative AI** (@google/generative-ai) — geração de instâncias via Gemini
- **dotenv** — gerenciamento de variáveis de ambiente

### Estrutura de Dados
- **Grafos** (não-direcionados, ponderados) — implementação personalizada em `src/models/Grafo.js`
- **Algoritmos**: Dijkstra modificado, BFS para alcançabilidade, cálculo de métricas

## 📁 Arquivos-Chave

### Backend
- `server.js` — servidor Express + endpoints da API
- `src/models/Grafo.js` — classe principal do grafo + algoritmos
- `src/services/buildMonoGrafo.js` — parser de mono-redes
- `src/services/buildMultiGrafo.js` — parser de multi-redes
- `src/historyService.js` — salvamento de histórico JSON

### Frontend
- `index.html` — UI principal (abas, controles, painéis)
- `public/script.js` — visualização 3D e lógica de simulação

### Geração com IA
- `src/generator/generatorConfig.js` — prompts e API Gemini
- `src/generator/gerarRede1.js` — geração de mono-redes
- `src/generator/gerarRede2.js` — geração de multi-redes

### CLI
- `app.js` — ponto de entrada do CLI
- `src/menu.js` — menus interativos do terminal

## 📝 Observações

- 🎓 O projeto foi desenvolvido para fins acadêmicos.
- 💸 O uso da API Gemini pode gerar custos dependendo do seu plano Google Cloud.
- 🧐 Sempre revise as instâncias geradas automaticamente para garantir a validade dos dados.
- 🌐 A interface web requer um navegador moderno com suporte a WebGL.
- 📱 A interface é responsiva, mas a experiência 3D é otimizada para desktop.
- 🔒 O servidor roda localmente — não há persistência em banco de dados (tudo é baseado em arquivos `.txt` e `.json`).

## 👥 Colaboradores

- João Carlos G. Iannuzzi
- Diandre P. Bruce
- Evelly Rebeca S. Corrêa
- Luanne Victoria S. Santos
- Veríssimo Rodrigues C. Neto

---

Desenvolvido para a disciplina de Algoritmo e Estrutura de Dados II. 👨‍💻