---
generated: 2026-08-31T20:46:09-03:00
source: 4d-init
lang: en
---

# CDC — this library's domain

The CDC (*Código de Control*) is the **44-digit** code that uniquely identifies every
SIFEN electronic document. It is composed by **the issuer, not the tax authority**,
and that is where everything else follows from: you can invoice offline and transmit
once the connection is back.

The whole domain lives in one file: `src/cdc.ts`.

## Layout — Technical Manual v150, §10.1

The `LAYOUT` const in `src/cdc.ts` is the source of truth for order and widths. It
adds up to 43 digits; the 44th is the check digit.

| Pos. | Field | XML ID | Length |
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

Verified against the official table on page 57 of the v150 PDF (it is an image in the
document, not text) and against the sample CDC the manual itself publishes.

## The check digit's 4 blind spots

Modulo 11 uses cyclic weights from 2 to 11. Where the weight is **11**, the product is
a multiple of 11 and **does not change the remainder**: that digit is unprotected. In
a 43-digit body this happens at positions **4, 14, 24 and 34** — falling in `dRucEm`,
`dEst`, `dNumDoc` and `iTipEmi` respectively.

**This comes from the algorithm the manual defines, not from this implementation.**
Do not "fix" it: changing the computation would produce CDCs that SIFEN rejects. The
`alcance de la detección de errores` test pins it down as expected behaviour.

In the other 39 positions every single-digit change is caught, and every transposition
of adjacent digits is always caught.

## Contingency does not work today

`TipoEmision.CONTINGENCIA` (value 2) exists in the standard, but the v150 Technical
Manual's own table of contents lists chapter 14 as
**"Operación de Contingencia (Futuro)"** — future.

To issue offline you use `TipoEmision.NORMAL` and transmit on reconnect. Offline works
because the CDC is composed locally, not because of contingency mode.

## The security code has rules (§10.3)

`dCodSeg` must be random, 9 digits, between `000000001` and `999999999`, different for
every document and **different from the document number**. `componerCdc` rejects the
last two cases; `generarCodigoSeguridad` uses `crypto.getRandomValues` with rejection
sampling to avoid modulo bias.

## Source

SIFEN Technical Manual v150 (DNIT), September 2019.
<https://www.dnit.gov.py/web/e-kuatia/documentacion-tecnica>
