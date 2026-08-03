# Prompt inaugural — Planeta Galaxy Bomberman

> Referência norte do projeto. Use este documento para alinhar escopo, física e estilo do protótipo.

---

Atue como um desenvolvedor especialista em jogos 3D para web, matemática vetorial e Three.js.

Sua tarefa é criar um protótipo funcional em **arquivo único HTML (com Three.js via CDN)** para um jogo estilo Bomberman jogado na superfície de um pequeno planeta esférico (estilo Super Mario Galaxy).

### 1. Planeta e Estrutura do Grid

* **Matemática do Planeta:** Crie um planeta esférico centralizado na origem (0,0,0).
* **Grid de 7 Faixas Latitudinais (Linhas do Equator/Trópicos):**
  * O jogador só pode se mover dentro de 7 faixas latitudinais. Os polos Norte e Sul não são acessíveis.
  * **Faixa 1 (Topo) e Faixa 7 (Base):** Sequência contínua de blocos indestruíveis justapostos formando as barreiras limites do mapa.
  * **Faixas 2, 4 e 6:** "Ruas" livres para movimentação do jogador.
  * **Faixas 3 e 5:** Possuem blocos indestruíveis dispostos de forma alternada, criando o grid xadrez clássico do Bomberman.
* **Divisão Longitudinal:** O anel do planeta deve ser dividido em exatamente 32 colunas/fatias angulares.
* **Blocos Destruíveis:** Preencha ~50% dos espaços vazios das "ruas" (faixas 2, 4 e 6) aleatoriamente com blocos destruíveis.
* **Alinhamento dos Blocos:** Todos os blocos e entidades devem ter suas faces orientadas diretamente para o centro do planeta e adaptados à curvatura da superfície.

### 2. Jogador, Movimentação e Controles

* **Tamanho:** O jogador deve ser representado por uma primitiva 3D (cápsula ou esfera) com proporções equivalentes ao tamanho de um bloco do grid.
* **Orientação de Controles Absoluta:**
  * **W:** Move o jogador em direção ao Norte do planeta.
  * **S:** Move o jogador em direção ao Sul do planeta.
  * **A:** Move o jogador em direção ao Oeste do planeta.
  * **D:** Move o jogador em direção ao Leste do planeta.
* **Movimentação Esférica:** O movimento deve seguir estritamente a superfície do planeta usando rotação ao longo do raio esférico/quatérnios (evite Gimbal Lock).

### 3. Câmera

* A câmera deve seguir o jogador em 3ª pessoa, mantendo-se fixa em suas costas.
* **Regra de Ouro da Câmera:** O topo da tela/vetor `up` da câmera deve apontar sempre na direção do Polo Norte do planeta, garantindo que o jogador veja a curvatura à sua frente enquanto corre.

### 4. Mecânica de Bombas e Explosões

* **Tecla Espaço:** Dropa uma bomba no centro da célula atual do grid onde o jogador está.
* **Tempo da Bomba:** A bomba pisca/espera 3 segundos antes de detonar.
* **Explosão Esférica:**
  * A explosão se espalha no formato de cruz (Norte, Sul, Leste, Oeste) acompanhando a curvatura do planeta por 1 ou 2 células de raio.
  * A explosão destrói blocos destruíveis no caminho.
  * Se atingir o jogador, registra colisão/game over ou dano.

### 5. Visual e Entrega

* Use **apenas primitivas 3D nativas do Three.js com cores sólidas e iluminação básica** (Luz Direcional + Luz Ambiente):
  * Planeta: Esfera com tom escuro/terroso.
  * Blocos Indestruíveis: Cubos cinza escuro/metal.
  * Blocos Destruíveis: Cubos marrom/madeira.
  * Jogador: Esfera/Cápsula azul.
  * Bomba: Esfera preta.
  * Explosão: Partículas/cubos amarelos e vermelhos temporários.
* Entregue todo o código em um **único arquivo `.html` pronto para rodar**, incluindo estilos CSS simples e script Three.js importado via CDN (cdnjs/unpkg).

---

## Notas de evolução do projeto

O protótipo atual foi **rearquitetado** em módulos (`src/`) com Vite + Three.js via npm, mantendo a física e o grid do prompt. Desvios conscientes:

| Prompt original | Estado atual |
|-----------------|--------------|
| Arquivo único HTML + CDN | Módulos ES + Vite |
| 32 colunas | 16 (ajustável em `gameConfig.js`) |
| Câmera `up` = Polo Norte | Órbita satélite com `up` radial + Gram–Schmidt (mais estável no globo) |

Arquivos centrais de física:

* `src/math/spherical.js` — coords esféricas e frame de superfície
* `src/systems/MovementSystem.js` — WASD absoluto N/S/L/O
* `src/systems/CameraSystem.js` — satélite / 3ª pessoa
* `src/config/gameConfig.js` — constantes do planeta e grid

**Estudo da matemática:** ver [`docs/FISICA-ESFERICA.md`](FISICA-ESFERICA.md) (arcos, \(\cos\phi\), slerp, singularidades).