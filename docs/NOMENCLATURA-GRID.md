# Nomenclatura do grid (debug)

Use estes nomes ao descrever o mapa:

| Nome | Código | Significado |
|------|--------|-------------|
| **Faixa** `F1`…`F7` | `band` 0…6 | Latitude: **F1 = norte**, **F7 = sul** |
| **Coluna** `C1`…`Cn` | `col` 0…n-1 | Longitude ao redor do planeta |
| **Célula** `F#C#` | `(band, col)` | Ex.: `F4C2` = faixa 4, coluna 2 |

Tipos de faixa (layout fixo):

- `F1`, `F7` — barreiras (anéis contínuos)
- `F2`, `F4`, `F6` — ruas
- `F3`, `F5` — xadrez (blocos alternados)

Toggle no jogo: tecla **G** (default off).
