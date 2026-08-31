---
generated: 2026-08-31T20:44:37-03:00
source: 4d-init
---

# CDC — el dominio de esta librería

El CDC (Código de Control) son **44 dígitos** que identifican unívocamente a cada
documento electrónico de SIFEN. Lo compone **el emisor, no el fisco**, y de ahí sale
la propiedad que hace todo lo demás posible: se puede facturar sin conexión y
transmitir al reconectar.

Todo el dominio vive en un archivo: `src/cdc.ts`.

## Layout — Manual Técnico v150, §10.1

La const `LAYOUT` en `src/cdc.ts` es la fuente de verdad del orden y los anchos.
Suma 43 dígitos; el 44 es el verificador.

| Pos. | Campo | ID XML | Largo |
|---:|---|---|---:|
| 1–2 | `C002` | `iTiDE` | 2 |
| 3–10 | `D101` | `dRucEm` | 8 |
| 11 | `D102` | `dDVEmi` | 1 |
| 12–14 | `C005` | `dEst` | 3 |
| 15–17 | `C006` | `dPunExp` | 3 |
| 18–24 | `C007` | `dNumDoc` | 7 |
| 25 | `D103` | `iTipCont` | 1 |
| 26–33 | `D002` | `dFeEmiDE` | 8 |
| 34 | `B002` | `iTipEmi` | 1 |
| 35–43 | `B004` | `dCodSeg` | 9 |
| 44 | `A003` | `dDVId` | 1 |

Verificado contra la tabla oficial de la página 57 del PDF v150 (es una imagen en el
documento, no texto) y contra el CDC de ejemplo que el mismo manual publica.

## Los 4 puntos ciegos del dígito verificador

El módulo 11 usa pesos cíclicos de 2 a 11. Donde el peso es **11**, el producto es
múltiplo de 11 y **no altera el resto**: ese dígito no está protegido. En un cuerpo de
43 dígitos ocurre en las posiciones **4, 14, 24 y 34** — que caen en `dRucEm`, `dEst`,
`dNumDoc` e `iTipEmi` respectivamente.

**Es del algoritmo que define el manual, no de esta implementación.** No lo "arregles":
cambiar el cálculo produciría CDCs que SIFEN rechaza. El test
`alcance de la detección de errores` lo fija como comportamiento esperado.

En las otras 39 posiciones todo cambio de un dígito se detecta, y toda transposición
de dígitos adyacentes se detecta siempre.

## Contingencia no sirve hoy

`TipoEmision.CONTINGENCIA` (valor 2) existe en el estándar, pero el índice del Manual
Técnico v150 lista el capítulo 14 como **"Operación de Contingencia (Futuro)"**.

Para emitir sin conexión se usa `TipoEmision.NORMAL` y se transmite al reconectar. El
offline funciona porque el CDC se compone localmente, no por la contingencia.

## El código de seguridad tiene reglas (§10.3)

`dCodSeg` debe ser aleatorio, de 9 dígitos, entre `000000001` y `999999999`, distinto
en cada documento y **distinto del número de documento**. `componerCdc` rechaza los
dos últimos casos; `generarCodigoSeguridad` usa `crypto.getRandomValues` con muestreo
por rechazo para evitar el sesgo del módulo.

## Fuente

Manual Técnico del SIFEN v150 (DNIT), septiembre de 2019.
<https://www.dnit.gov.py/web/e-kuatia/documentacion-tecnica>
