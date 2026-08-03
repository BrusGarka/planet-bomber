# Física esférica — guia de estudo

Documento conceitual da matemática usada no *Planeta Galaxy Bomberman*. Objetivo: entender **por que** o código faz o que faz, e quais armadilhas existem em coordenadas esféricas.

---

## 1. Parametrização

O planeta está centrado na origem. Usamos latitude \(\phi\) **desde o equador** (norte positivo, sul negativo) e longitude \(\theta\) em \([-\pi, \pi)\).

\[
\mathbf{p}(\phi, \theta) =
R \begin{pmatrix}
\cos\phi\cos\theta \\
\sin\phi \\
\cos\phi\sin\theta
\end{pmatrix}
\]

No código: `sphericalToCartesian(lat, lon, radius)` em [`src/math/spherical.js`](../src/math/spherical.js).

| Símbolo | Código | Significado |
|---------|--------|-------------|
| \(\phi\) | `lat` | latitude desde o equador |
| \(\theta\) | `lon` | longitude |
| \(R\) | `CONFIG.PLANET_RADIUS` | raio do planeta |

---

## 2. Base local na superfície

Derivadas de \(\mathbf{p}\) (ou equivalentes normalizadas) dão o frame tangente:

- **Up (normal):** \(\hat{n} = \mathbf{p}/\|\mathbf{p}\|\) — aponta para fora do planeta
- **Norte:** direção de aumento de \(\phi\)
- **Leste:** direção de aumento de \(\theta\)

No Three.js o look padrão é **-Z**, mas uma base **direita** com +X=leste e +Y=up exige **+Z = norte** (`east × up = north`). Por isso:

- **+X** = leste  
- **+Y** = up (normal)  
- **+Z** = norte (frente local do jogador / nariz)

> Bug histórico: `makeBasis(east, up, -north)` tinha `det = -1` (reflexão). `setFromRotationMatrix` gerava quaternion **não unitário** e cisalhava blocos/boneco.

```
makeSurfaceMatrix(lat, lon)
  → Matrix4 com colunas (east, up, -north)
placeOnSurface(obj, lat, lon, height)
  → position = p(φ,θ) em raio R+height
  → quaternion da matrix acima
```

---

## 3. Arcos: meridiano vs paralelo

Deslocamento infinitesimal na superfície:

\[
ds_\phi = R\, d\phi
\qquad
ds_\theta = R\cos\phi\, d\theta
\]

- Andar em **latitude** (W/S): arco proporcional a \(d\phi\) — **igual** em qualquer \(\phi\).
- Andar em **longitude** (A/D): o paralelo encolhe com \(\cos\phi\). O mesmo \(d\theta\) perto do polo percorre **menos chão** que no equador.

### Por que A/D sem `1/cos(φ)` fica errado

Se o jogo soma o mesmo `speed·dt` em `lat` e em `lon`:

- W/S → velocidade linear \(\approx R \cdot speed\)
- A/D → velocidade linear \(\approx R\cos\phi \cdot speed\)

Nas faixas mais longe do equador, A/D fica mais lento. A correção métrica é:

\[
d\phi = \hat{n}_{\text{input}} \cdot \omega\, dt
\qquad
d\theta = \frac{\hat{e}_{\text{input}} \cdot \omega\, dt}{\max(\cos\phi,\ \varepsilon)}
\]

onde \(\omega =\) `PLAYER_MOVE_SPEED` (radianos de arco / s no meridiano, i.e. velocidade linear \(v = \omega R\)).

Implementação: [`src/systems/MovementSystem.js`](../src/systems/MovementSystem.js).

---

## 4. Diagonal e normalização

Se W e D forem aplicados no mesmo frame **sem** normalizar, a velocidade fica \(\sqrt{2}\) maior.

Fluxo correto:

1. Montar vetor de input \((n, e)\) com componentes em \(\{-1,0,1\}\)
2. Se \(\|(n,e)\| > 1\), normalizar
3. Converter para \(d\phi\), \(d\theta\) com a correção de \(\cos\phi\)

---

## 5. Colisão: espaço angular vs métrica

O grid divide o planeta em faixas de altura angular fixa (`BAND_HEIGHT`) e fatias iguais de longitude.

- Em **ângulo**, a célula é um “retângulo” \((\Delta\phi, \Delta\theta)\).
- Na **superfície**, é um trapézio esférico: a largura leste–oeste encolhe com \(\cos\phi\).

Os blocos têm tamanho fixo em metros (`BLOCK_SCALE`). A colisão atual testa se o jogador está perto do **centro da célula em \((\phi,\theta)\)** com uma margem angular (`COLLISION_MARGIN`). Isso é simples e jogável perto do equador, mas **não** é colisão métrica exata bloco↔cápsula.

`cellAt`, `lonDelta`, `#isBlocked` — mesma família de funções.

---

## 6. Câmera satélite

A câmera vive numa órbita de raio \(R_{\text{orb}} = R + \texttt{CAM\_ALT}\).

1. Parte da normal do jogador \(\hat{n}\)
2. Rotação de **Rodrigues** em torno do eixo leste → offset angular para trás (sul local)
3. Segunda rotação → elevação
4. Posição desejada: \(\hat{d} \cdot R_{\text{orb}}\)

### Lerp cartesiano vs slerp

`position.lerp(desired, α)` interpola em \(\mathbb{R}^3\): o segmento **corta a corda** da esfera orbital → a altitude da câmera **cai** durante a transição.

**Slerp** na direção unitária mantém \(\|\mathbf{c}\| = R_{\text{orb}}\):

\[
\hat{c}_{t+1} = \mathrm{slerp}(\hat{c}_t,\ \hat{d},\ \alpha),\qquad
\mathbf{c} = \hat{c}\, R_{\text{orb}}
\]

com \(\alpha = 1 - e^{-k\,dt}\).

> **Nota de implementação:** `THREE.Vector3` não possui `.slerp` (só `Quaternion` tem). O jogo usa um helper `slerpUnit` em `CameraSystem.js`.

### Vetor `up`

O prompt inaugural pedia `up` = Polo Norte. A implementação usa **up radial** na câmera, ortogonalizado à direção de visão (Gram–Schmidt): mais estável no globo, sem roll forçado pelo polo. Desvio consciente.

Arquivo: [`src/systems/CameraSystem.js`](../src/systems/CameraSystem.js).

---

## 7. Singularidade nos polos

Em \(\phi \to \pm\pi/2\), \(\cos\phi \to 0\): leste e norte no plano tangente degeneram (todos os meridianos se encontram).

Neste jogo o playable band fica longe dos polos (`clampPlayableLat` + barreiras nas faixas 1 e 7). Por isso não precisamos de um frame especial nos polos — desde que o clamp permaneça.

---

## 8. Fora desta rodada (notas futuras)

| Tema | Ideia |
|------|--------|
| Grid métrico | Dimensionar `BLOCK_SCALE` / fatias por arco local \(R\cos\phi\,\Delta\theta\) |
| Explosão geodésica | Cruz no grid \((b,c)\) ≠ geodésicas; no equador quase coincide |
| `up` = Polo Norte | Misturar radial com \((0,1,0)\) e ortogonalizar, se quiser o look do prompt |

---

## 9. Mapa rápido: fórmula ↔ código

| Conceito | Função / arquivo |
|----------|------------------|
| \(\mathbf{p}(\phi,\theta)\) | `sphericalToCartesian` |
| Base leste/up/norte | `makeSurfaceMatrix` |
| Colocar entidade na superfície | `placeOnSurface` |
| Wrap / Δ longitude | `normalizeLon`, `lonDelta` |
| Célula do grid | `cellAt` |
| Limite playable | `clampPlayableLat` |
| WASD métrico + diagonal | `MovementSystem.update` |
| Órbita + slerp | `CameraSystem.update` |
| Constantes \(R\), speed, cam | `src/config/gameConfig.js` |

---

## 10. Checklist mental ao mexer na física

1. Estou misturando **ângulo** e **metros** sem converter?
2. A/D usa `/cos(φ)`?
3. Input diagonal está normalizado?
4. Câmera interpola na **esfera** (slerp) ou na corda (lerp)?
5. Ainda estou longe o bastante dos polos?
