# Corrigir sensação de leste/oeste invertidos

## O que eu verifiquei

Projetei em NDC (coordenadas de tela) o jogador e um passo para o leste geográfico, usando exatamente a matemática atual da câmera (meridiano do jogador, `lookAt(origem)`, `up` = Polo Norte):

```text
jogador  x = -0.000  y = 0.424
leste    x = -0.068  y = 0.424   <- leste aparece à ESQUERDA
norte    x = -0.000  y = 0.517   <- norte aparece em cima (correto)
```

Ou seja: sua percepção está certa. Norte/sul estão corretos, mas o leste geográfico é desenhado à esquerda da tela. A causa está na parametrização em `sphericalToCartesian` (`x = cosφcosθ`, `z = cosφsinθ`): com Y para cima, a longitude crescente gira no sentido que, visto de fora do globo com norte em cima, corre para a esquerda. Como as colunas do grid são numeradas por longitude crescente (`cellCenterLon`), a numeração `C1…Cn` também cresce para a esquerda — daí a sensação contraintuitiva no grid.

## Opção recomendada: corrigir a parametrização (1 sinal)

Inverter o sinal da componente Z da longitude, o que equivale a usar `θ → -θ` em todo o mundo. Isso mantém a física intacta (mesmas fórmulas, mesma métrica, mesmo `1/cos φ`), só espelha a direção em que a longitude cresce.

Mudanças, todas pontuais:

1. `src/math/spherical.js`
   - `sphericalToCartesian`: `z = -R·cosφ·sinθ`
   - `makeSurfaceMatrix`: `north.z = +sinφ·sinθ`, `east = (-sinθ, 0, -cosθ)`
   - Nada mais muda: `normalizeLon`, `lonDelta`, `cellAt`, `clampPlayableLat` são puramente angulares.
2. `src/systems/CameraSystem.js`
   - Mesmas duas fórmulas inline: `normal.set(cosφcosθ, sinφ, -cosφsinθ)` e `east.set(-sinθ, 0, -cosθ)`.

Não há outro ponto do código que monte posições esféricas à mão (`Planet.js`, `BlockManager.js`, `GridDebugOverlay.js` todos passam por `spherical.js`).

Efeito: D vai para a direita da tela = leste, A para a esquerda = oeste, colunas `C1…Cn` passam a crescer para a direita, e a travessia do meridiano ±π continua usando o mesmo `normalizeLon`/`lonDelta` (não há caso especial novo).

## Verificação antes de dar como pronto

- Rodar de novo o teste de projeção NDC: `leste.x > jogador.x`, `norte.y > jogador.y`, `origem ≈ (0,0)`.
- Conferir que a base `(east, up, north)` continua com determinante +1 (senão volta o bug histórico de blocos cisalhados).
- Playwright: andar segurando D atravessando a costura de longitude, tirar screenshots, e confirmar que não há salto/teleporte nem inversão de câmera; idem para A, W e S.
- Repetir nos planetas 2, 3 e 4 (grids densos) para garantir que colisão e câmera seguem iguais.

## Alternativa mais conservadora (se preferir risco zero na matemática)

Trocar apenas o mapeamento de input: `KeyD` passa a somar `east = -1` e `KeyA` `+1`, o mesmo no analógico touch. Uma linha em `MovementSystem.js` e duas em `TouchControls.js`.

Custo: o controle fica intuitivo, mas o grid continua numerado ao contrário e o código passa a chamar de "leste" algo que vai para o oeste — dívida de confusão para futuras mudanças. Só recomendo se você quiser o mínimo absoluto de mexida.
