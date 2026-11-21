# 🏆 FUTMESA OLÍMPICO 3D — DOCUMENTAÇÃO DO PROJETO
> **Projeto do Lucas** · Desenvolvido com ❤️ usando HTML5 + Three.js
> Última atualização: 20/11/2026

---

## 📁 Arquivos do Projeto

| Arquivo | Descrição |
|---|---|
| `index.html` | Interface, estilos CSS, overlays e HUD |
| `game.js` | Motor do jogo completo (física, 3D, IA, áudio) |
| `JOGAR.bat` | Duplo-clique para abrir o jogo no navegador |
| `mikasa_ref.jpg` | Imagem de referência da bola Mikasa FT-5 |
| `README.md` | Notas rápidas |
| `PROJETO.md` | **Este arquivo** — documentação completa |

---

## 🎮 Como Jogar

1. Dê **duplo-clique** no `JOGAR.bat` → o navegador abre automaticamente  
2. Clique **"ENTRAR NA QUADRA"**  
3. Escolha a dificuldade:
   - **AMADOR** → computador mais lento, erra mais, bom para aprender
   - **AVANÇADO** → computador rápido e preciso, desafio de verdade
4. O mouse é **capturado** (Pointer Lock). Pressione `ESC` para soltar.

### ⌨️ Controles
| Tecla | Ação |
|---|---|
| `W` / `↑` | Mover para frente |
| `S` / `↓` | Mover para trás |
| `A` / `←` | Mover para a esquerda |
| `D` / `→` | Mover para a direita |
| `Scroll do Mouse` | Aproximar / afastar câmera (Zoom) |
| `Mouse` (arrastar) | Girar câmera (olhar ao redor) |
| `F` | **Sacar** (servir a bola) |
| `Z` | **Ajeitar a bola** (cushion/controle — tem buffer de 750ms) |
| `X` | **Chutar a bola** (ataque ofensivo) |

---

## 🏓 Regras do Jogo (Futmesa Oficial)

- A mesa é **curvada nas extremidades** (arco parabólico), como na Teqball oficial.
- A bola deve **bater no lado adversário** para valer ponto.
- **Sem toque no próprio lado** (ponto adversário imediato).
- **Máximo de 80 toques** por partida (contador no placar).
- Vence quem fizer **11 pontos** com vantagem mínima de 2.
- **Juiz árbitro NPC** ao lado da mesa: apita e aponta o braço para o lado vencedor do ponto.

---

## 🏟️ Cenário e Estética

### Mesa
| Dimensão | Valor |
|---|---|
| Comprimento | **5,18 m** (mais 20% sobre 4,32m — total de +44% vs v1) |
| Largura | **2,74 m** (mais 20% sobre 2,28m) |
| Altura no centro | 0,82 m |
| Curvatura (drop) | 0,20 m |
| Altura da rede | 0,18 m |

Superfície: azul royal com gradiente escuro, bordas de jogo em ciano luminoso, rede translúcida com postes dourados.

### Bola — Mikasa FT-5 Goalmaster
Textura procedural gerada via Canvas 2D fiel à bola real:
- Base de couro **branco nobre** com granulação acetinada
- **5 triângulos pretos** distribuídos esfericamente
- Silhueta dourada do **Goalmaster** (jogador chutando) em um dos triângulos
- Logo **MIKASA JAPAN** e texto "FT-5 · Footvolley ball" no painel central
- Curvatura e costura esféricas com lineWidth

### Arquibancadas 360°
4 setores ao redor completo da quadra, cada um com:
- **4 degraus** de concreto escuro com corrimãos cromados
- **Cadeiras tipo concha** azuis com encosto
- **Torcedores 3D** com camisas do EA SPORTS FC / FIFA inspiradas nas fotos enviadas:
  - 🤍 Camisa branca **Real Madrid** (Emirates FLY BETTER + listras douradas)
  - 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Camisa branca/azul **Tottenham** (AIA vermelho + mangas navy)
  - 🍷 **Polo vinho/bordeaux** (torcedor de bigode da Foto 1)
  - 🩶 **Henley cinza mescla** (torcedor sorridente da Foto 1)
  - 🔷 **Polo xadrez azul geométrica** (torcedor loiro da Foto 1)
  - 🔴 **Polo vermelha** (torcedor de boné da Foto 2)
  - 🇧🇷 **Amarelinha do Brasil** (canarinho clássica com calção azul)
- **4 poses de torcedor**:
  - Punho erguido bem alto (ícone da Foto 1 — braço vertical ao céu)
  - Cachecol "REAL MADRID CF" esticado com as duas mãos
  - Gritando/vibrando com os braços abertos (Foto 2 — torcedora do Tottenham)
  - Bandeira no mastro tremulando
- **Cabelos individualizados**: loiro, castanho, preto, ruivo, ponytail feminino (moça do Real Madrid), careca
- **Painéis de LED Ribbon** em cada setor (estilo EA SPORTS FC broadcast)
- **Faixas suspensas no alto**: "¡POR SIEMPRE REAL MADRID!", "AUDERE EST FACERE", etc.
- **Quadros históricos P&B** nas paredes do ginásio (estilo lounge da Foto 1)

### HUD (tela do jogo)
- **Canto superior esquerdo**: Selo broadcast `EA SPORTS` + badge verde `AO VIVO` + local "RIO DE JANEIRO, BRASIL"
- **Centro superior**: Placar com nome do jogador (azul) vs Computador (vermelho), contador de toques `X / 80`
- **Canto superior direito**: Badge `LIVE` piscando em vermelho + indicador de dificuldade
- Sem popups centrais durante a partida (removidos conforme pedido)

---

## 🤖 Inteligência Artificial (Computador)

### Modo Amador
- Velocidade de movimento: **2.9 m/s** (lento, dá tempo de reagir)
- **28% de chance** de errar o golpe de propósito (bola cai fora ou na rede)
- Tempo de voo mais longo (0,95–1,10 s) → arco alto, bola mais previsível

### Modo Avançado
- Velocidade: **4.4 m/s** (rápido, se posiciona bem)
- **18 % de chance** de errar o golpe (bola cai fora ou na rede)
- Tempo de voo mais rápido (0,75–0,85 s) → chute mais rasteiro e preciso
- Espalhamento: 75% da largura da mesa

### Comportamento
- CPU rastreia a posição X da bola e se posiciona no lado certo
- Mantém distância da mesa (não atravessa)
- Decide entre "ajeitar" (tiro para cima, controle) ou "chutar" (lance para o lado do jogador)

---

## ⚙️ Arquitetura Técnica

### Stack
- **Three.js r128** via CDN (WebGL 3D)
- **Web Audio API** (sons sintetizados, zero dependências externas)
- **Canvas 2D** para todas as texturas (procedural, sem imagens externas)
- Funciona **100% offline** com `file://` — sem servidor necessário

### Módulos principais em `game.js`

```
SoundManager          → Áudio sintetizado (Web Audio API)
  playKick()          → Som de chute
  playControl()       → Som de controle [Z]
  playTableBounce()   → Biquinho na mesa
  playWhistle()       → Apito do árbitro
  playPointCheer()    → Melodia de ponto (arpejo)

FutmesaGame           → Classe principal do jogo
  initThree()         → Renderer, câmera, iluminação
  buildOlympicGym()   → Chão de madeira, tapete, paredes, quadros
  buildFC26Grandstands() → Arquibancadas 360° com torcedores estilo EA FC
  buildUltraVisibleTable() → Mesa curvada oficial + rede + postes dourados
  buildRefereeNPC()   → Árbitro 3D com animação de braço apontando
  buildBall()         → Bola Mikasa FT-5 Goalmaster com textura procedural
  buildCharacters()   → Jogador (azul) e CPU (vermelho)
  setupEvents()       → Teclado, mouse, scroll, pointer lock, botões
  updatePhysics(dt)   → Física da bola, colisões mesa/rede/chão, scoring
  updatePlayer(dt)    → Movimento, câmera 3ª pessoa, zoom
  updateCPU(dt)       → IA (amador/avançado)
  updateCrowd(dt)     → Animação de pulos e gestos da torcida
  tryExecuteControl() → Lógica do [Z] com buffer de 750ms e alcance de 3,4m
  launchBallToTarget()→ Projétil parabólico com física
  scorePoint()        → Pontua, chama árbitro, mostra banner
  animate()           → Loop principal requestAnimationFrame
```

### Física da Bola
- Gravidade: **12.0 m/s²**
- Elasticidade na mesa: **0.83** (83% da velocidade conservada no rebote)
- Colisão com rede: `ballVel.z *= -0.3` (rebate com 30% de força)
- Colisão com tampa da mesa: produto escalar com normal curvada
- Raio da bola: **0.11 m**

### Câmera
- Terceira pessoa suave (lerp `0.18` por frame)
- Distância: **1.2 a 4.8** (controlada pelo scroll)
- Pitch: `-0.35` a `0.65` rad
- Yaw: livre 360° pelo mouse
- Olha em direção à mesa (5 m à frente do personagem)

### Colisão Personagem ↔ Mesa
Limites calculados automaticamente a partir do `CONFIG`:
```js
tableLimitZ = CONFIG.tableLength / 2 + 0.4   // barreira frontal da mesa
tableLimitX = CONFIG.tableWidth / 2 + 0.4    // barreira lateral da mesa
```
O personagem não consegue entrar dentro ou atravessar a mesa.

---

## 📋 Histórico de Versões / Changelog

| Versão | Data | O que mudou |
|---|---|---|
| 1.0 | Nov 2026 | Primeira versão — mesa básica, bola, físca simples |
| 2.0 | Nov 2026 | Câmera 3ª pessoa, controles WASD, modos de jogo |
| 3.0 | Nov 2026 | Árbitro NPC com animação de braço, placar funcional |
| 4.0 | Nov 2026 | Arquibancadas dos dois lados (lado a lado) |
| 5.0 | Nov 2026 | Arquibancadas 360° ao redor de toda a quadra |
| 5.1 | Nov 2026 | Arquibancadas viradas corretamente para a quadra (bug corrigido) |
| 5.2 | Nov 2026 | Limite de toques definido como 80; remoção dos popups centrais |
| 6.0 | Nov 2026 | Torcedores 3D detalhados (camisas, cabelos, acessórios) estilo EA FC 26 |
| 6.1 | Nov 2026 | Tela de dificuldade: Amador / Avançado |
| 7.0 | Nov 2026 | Bola Mikasa FT-5 Goalmaster (textura procedural fiel à foto) |
| 7.1 | Nov 2026 | Mesa aumentada em 20% (3,6m→4,32m / 1,9m→2,28m) |
| 7.2 | Nov 2026 | Torcedores com camisas reais do EA FC (Real Madrid, Tottenham, Brasil); faixas suspensas; quadros históricos nas paredes; poses individualizadas (punho no ar, cachecol, gritando) |
| 8.0 | Nov 2026 | Mesa +20% novamente (4,32m→5,18m / 2,28m→2,74m); alcance do [Z] e [X] reduzido para 1.4m/1.6m (só pega bola quando está perto E no lado certo); CPU corrigido para nunca espelhar o jogador e só agir quando a bola está no seu lado (z < 0) |

---

## 🛠️ Próximas Ideias (Backlog)

- [ ] Melhorar ainda mais o `[Z]` (ajeitar a bola) — feedback visual mais claro de quando está no alcance
- [ ] Partículas de confete ao marcar ponto
- [ ] Música de fundo ambiente (torcida barulhenta sintetizada)
- [ ] Placar animado com flash ao ponto
- [ ] Modo torneio (melhor de 3 sets)
- [ ] Personagem com rosto do Lucas (textura custom)
- [ ] Skins alternativas para a mesa

---

## 📌 Decisões Técnicas Importantes

### Por que sem servidor Node/Python?
Nenhum dos dois estava no PATH da máquina. O projeto foi construído 100% client-side para funcionar via `file://` com duplo-clique no `JOGAR.bat`, sem nenhuma instalação.

### Por que Canvas 2D para texturas?
Carregamento de imagens externas via `THREE.TextureLoader` falha com CORS em `file://`. Todas as texturas (mesa, bola, camisas, placar, LED ribbon) são geradas proceduralmente com `<canvas>` e convertidas com `CanvasTexture`. Isso também permite personalização infinita sem arquivos de imagem.

### Como funciona o `[Z]` (ajeitar a bola)?
```
1. Usuário pressiona Z
2. controlBufferedTime = 0.75 (buffer de 750ms fica ativo)
3. A cada frame, tryExecuteControl() verifica:
   - distância horizontal à bola < 3.4m
   - bola do lado do jogador (z > -0.3)
   - bola acima do chão (y > 0.05)
   - bola não muito alta (y < 3.2)
4. Se as condições forem atendidas dentro do buffer → executa o controle
5. A bola é suavemente puxada para junto do jogador (lerp 0.8/0.2)
   e arremessada para cima (vel Y = 5.4) para configurar o próximo golpe
```

---

> 🎯 **Dica para retomar o desenvolvimento:**  
> Abra `c:\lucas\game.js` e procure por `// ---` para navegar entre as seções.  
> O `CONFIG` no topo é onde ficam todos os números principais (mesa, gravidade, velocidade, toques).
