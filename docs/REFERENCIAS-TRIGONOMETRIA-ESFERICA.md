# Referências — trigonometria esférica

Base de estudo e ponte entre a matemática clássica e a física do *Planeta Galaxy Bomberman*.

Guia de implementação do jogo: [`FISICA-ESFERICA.md`](./FISICA-ESFERICA.md).  
Nomenclatura do mapa: [`NOMENCLATURA-GRID.md`](./NOMENCLATURA-GRID.md).

---

## 1. Artigo base

**Fonte:** [Trigonometria esférica (Wikipédia PT)](https://pt.wikipedia.org/wiki/Trigonometria_esf%C3%A9rica)

A trigonometria esférica estuda triângulos formados por **arcos de círculo máximo** na superfície de uma esfera — lados medidos como ângulos no centro, não como metros. É a linguagem clássica por trás de ortodromia, haversine, rumos e geodésicas.

### Ideias do artigo que importam para o jogo

| Conceito no artigo | Significado | Onde aparece no projeto |
|--------------------|-------------|-------------------------|
| **Círculo máximo** | Interseção da esfera com um plano pelo centro; caminho mais curto entre dois pontos | Meridianos; geodésicas futuras; slerp da câmera |
| **Distância ortodrômica** | Comprimento do arco de círculo máximo | Distância “de verdade” na superfície (hoje usamos Δ angular no grid) |
| **Lados como ângulos** | Arco × \(R\) = comprimento linear | `PLAYER_MOVE_SPEED` em rad/s → \(v = \omega R\) |
| **Lei dos cossenos esférica** | \(\cos c = \cos a\cos b + \sin a\sin b\cos C\) | Distância / azimute entre dois \((\phi,\theta)\); base da haversine |
| **Lei dos senos esférica** | \(\sin a / \sin A = \sin b / \sin B = \sin c / \sin C\) | Relação lado ↔ ângulo em triângulos na superfície |
| **Excesso esférico** | \(\alpha+\beta+\gamma > 180°\) | Células do grid **não** são retângulos euclidianos; trapézios esféricos |
| **Singularidade / polos** | Meridianos se encontram; frame degenera | `clampPlayableLat`, barreiras F1/F7, `COS_LAT_EPS` |

### Fórmulas fundamentais (resumo)

Triângulo esférico com lados \(a,b,c\) (arcos) e ângulos opostos \(A,B,C\):

**Cossenos (lados):**

\[
\cos c = \cos a\cos b + \sin a\sin b\cos C
\]

**Senos:**

\[
\frac{\sin a}{\sin A} = \frac{\sin b}{\sin B} = \frac{\sin c}{\sin C}
\]

No artigo há ainda cotangente (elementos consecutivos), fórmulas de Bessel e o pentágono de Napier (mnemônica para triângulos retângulos). Úteis se formos calcular rumo inicial / interseção de geodésicas; o protótipo atual não precisa delas frame a frame.

---

## 2. Mapa: dificuldade do jogo ↔ referência

### 2.1 Movimento do jogador (métrica \(\cos\phi\))

**Problema:** o mesmo \(d\theta\) perto do polo percorre menos chão que no equador.

**Matemática:** elemento de arco na esfera

\[
ds^2 = R^2\,d\phi^2 + R^2\cos^2\phi\, d\theta^2
\]

(equivalente à métrica citada em textos de geometria riemanniana em \(S^2\)).

**No jogo:** A/D divide por \(\cos\phi\) — ver §3 de [`FISICA-ESFERICA.md`](./FISICA-ESFERICA.md) e `MovementSystem.js`.

**Leituras:**

- Artigo base — círculo máximo vs paralelo (paralelos **não** são círculos máximos, exceto o equador)
- [The Planet Engine (Leon)](https://leonsnotes.ca/2026/05/04/the-planet-engine/) — mesma métrica \(ds^2 = R^2(\cos^2\phi\,d\theta^2 + d\phi^2)\); discute singularidade em \(\cos\phi=0\) e alternativa SO(3) (frame sem lat/lon)
- [The Tangent Space](https://antoninus.org/blog/the-tangent-space/) — comprimentos dos vetores base no espaço tangente (\(|e_{\text{lon}}| \propto \cos\phi\))

### 2.2 Frame tangente (orientação do jogador / blocos)

**Problema:** base esquerda (`det = -1`) quebra quaternion; polos degeneram leste/norte.

**Matemática:** base ortonormal \(\{\hat{e},\hat{n},\hat{\nu}\}\) (leste, norte, normal); `makeBasis` precisa ser direita.

**No jogo:** `makeSurfaceMatrix` / `placeOnSurface` em `spherical.js`.

**Leituras:**

- Artigo base — domínio na superfície; pontos unidos por arcos
- [SPEC: walking on a sphere (june-sol)](https://github.com/Ayush909/june-sol/blob/main/SPEC.md) — estado como vetores `position` + `forward` (sem lat/lon); movimento = rotação no círculo máximo
- Fórum Bullet: [tangents on a spherical surface](https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=10264) — manter forward ⊥ up sob rotação incremental

### 2.3 Câmera orbital (slerp vs lerp)

**Problema:** `lerp` cartesiano corta a corda e derruba a altitude orbital.

**Matemática:** slerp = interpolação ao longo do **círculo máximo** na esfera unitária (geodésica em \(S^2\)):

\[
\operatorname{slerp}(p_0,p_1;t)
= \frac{\sin[(1-t)\Omega]}{\sin\Omega}\,p_0
+ \frac{\sin[t\Omega]}{\sin\Omega}\,p_1,
\quad \cos\Omega = p_0\cdot p_1
\]

**No jogo:** `slerpUnit` + Rodrigues em `CameraSystem.js`.

**Leituras:**

- [Spherical linear interpolation (EN)](https://en.wikipedia.org/wiki/Spherical_linear_interpolation) — fórmula geométrica e slerp de quaternions (Shoemake)
- Artigo base — círculo máximo = caminho mais curto (o slerp **é** esse caminho na esfera de direções)
- [Arcball / órbita em coords esféricas](https://nerdhut.de/2020/05/09/unity-arcball-camera-spherical-coordinates/) — atualizar ângulos e projetar de volta a \(\mathbb{R}^3\)

### 2.4 Grid / mapa (células, trapézios, wrap)

**Problema:** células são retângulos em \((\Delta\phi,\Delta\theta)\) mas trapézios na superfície; largura ∝ \(\cos\phi\); explosão em cruz indexada ≠ geodésica.

**Matemática:** excesso esférico e lados medidos em arco; distância verdadeira entre centros de célula = ortodromia (haversine / lei dos cossenos).

**No jogo:** `Grid.js`, `BlockManager.js`, `cellAt`, `lonDelta`; nomenclatura F#C# em [`NOMENCLATURA-GRID.md`](./NOMENCLATURA-GRID.md).

**Leituras:**

- Artigo base — excesso esférico; domínio limitado por curvas na superfície
- [Ortodromia (Wikipédia PT)](https://pt.wikipedia.org/wiki/Ortodromia) — caminho mais curto vs loxodromia (rumo constante)
- [Fórmula de haversine (Wikipédia PT)](https://pt.wikipedia.org/wiki/F%C3%B3rmula_de_haversine) — forma numericamente estável da lei dos cossenos para arcos curtos
- [Esri: Distance on a sphere — Haversine](https://community.esri.com/t5/coordinate-reference-systems-blog/distance-on-a-sphere-the-haversine-formula/ba-p/902128) — quando “chão plano” deixa de bastar

### 2.5 Distância e rumo na superfície (futuro: explosão geodésica, pathfinding)

**Haversine** (ângulo central \(c\), raio \(R\)):

\[
a = \sin^2\frac{\Delta\phi}{2} + \cos\phi_1\cos\phi_2\sin^2\frac{\Delta\theta}{2}
\qquad
d = 2R\,\operatorname{atan2}(\sqrt{a},\sqrt{1-a})
\]

**Rumo inicial** (azimute de \(1\) para \(2\)):

\[
\theta = \operatorname{atan2}\bigl(
\sin\Delta\theta\cos\phi_2,\ 
\cos\phi_1\sin\phi_2 - \sin\phi_1\cos\phi_2\cos\Delta\theta
\bigr)
\]

**Leituras:**

- [unit-sphere (Rust) — great-circle navigation](https://github.com/kenba/unit-sphere-rs) — trig esférica + vetores para curso, distância e interseção de arcos
- [Great-circle navigation (EN)](https://en.wikipedia.org/wiki/Great-circle_navigation)
- Artigo base — leis do seno/cosseno; Bessel para combinações seno×cosseno

---

## 3. Glossário rápido (PT ↔ jogo)

| Termo | Sinônimo / EN | No código |
|-------|---------------|-----------|
| Círculo máximo | Great circle | Meridiano; trajetória do slerp |
| Ortodromia | Great-circle route | Distância mínima na superfície |
| Loxodromia | Rhumb line | Rumo constante (WASD “leste” ≈ paralelo, não geodésica) |
| Paralelo | Small circle (exceto equador) | Faixas F#; largura ∝ \(\cos\phi\) |
| Meridiano | Longitude line | Colunas C#; arco de círculo máximo |
| Excesso esférico | Spherical excess | Célula ≠ retângulo euclidiano |
| Slerp | Spherical linear interpolation | `slerpUnit` na câmera |
| Frame tangente | Tangent basis | `makeSurfaceMatrix` |

---

## 4. Biblioteca de links

### Primárias (matemática)

1. [Trigonometria esférica — Wikipédia PT](https://pt.wikipedia.org/wiki/Trigonometria_esf%C3%A9rica) — **artigo âncora deste doc**
2. [Spherical trigonometry — Wikipédia EN](https://en.wikipedia.org/wiki/Spherical_trigonometry) — cobertura mais ampla das identidades
3. [Ortodromia — Wikipédia PT](https://pt.wikipedia.org/wiki/Ortodromia)
4. [Fórmula de haversine — Wikipédia PT](https://pt.wikipedia.org/wiki/F%C3%B3rmula_de_haversine)
5. [Slerp — Wikipédia EN](https://en.wikipedia.org/wiki/Spherical_linear_interpolation)
6. [Great-circle navigation — Wikipédia EN](https://en.wikipedia.org/wiki/Great-circle_navigation)

### Aplicadas a jogos / engines

7. [The Planet Engine — Leon's Notes](https://leonsnotes.ca/2026/05/04/the-planet-engine/) — métrica \(S^2\), polos, SO(3) vs lat/lon
8. [june-sol SPEC — walking on a sphere](https://github.com/Ayush909/june-sol/blob/main/SPEC.md) — `position`+`forward`, rotação geodésica
9. [Arcball camera com coords esféricas](https://nerdhut.de/2020/05/09/unity-arcball-camera-spherical-coordinates/)
10. [unit-sphere-rs](https://github.com/kenba/unit-sphere-rs) — haversine, azimute, interseção de arcos

### Ferramentas / extras do artigo base

11. [Great Circle Calculator](https://www.movable-type.co.uk/scripts/latlong.html) (ligado no artigo PT)
12. [Apuntes de Trigonometría esférica — Univ. de Cádiz](https://www.uca.es/) (bibliografia do artigo; buscar PDF localmente se precisar de exercícios)

---

## 5. Como usar este arquivo

1. **Conceito novo** (ex.: “explosão deve seguir geodésica”) → ler §1–2 do artigo base + haversine/ortodromia.
2. **Bug de velocidade A/D ou câmera** → [`FISICA-ESFERICA.md`](./FISICA-ESFERICA.md) primeiro; voltar aqui só se a intuição geométrica faltar.
3. **Redesign de movimento sem lat/lon** → Planet Engine + june-sol SPEC (§2.1–2.2).
4. **Grid métrico / escala de bloco por faixa** → excesso esférico + métrica \(\cos\phi\) (§2.4).

Última atualização: alinhado ao protótipo com lat/lon, correção \(1/\cos\phi\), colisão angular e câmera com slerp unitário.
