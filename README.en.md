# sifen-cdc

[Español](README.md) · **English**

**The SIFEN CDC, done right.** Compose, validate, parse and KuDE-format the Control
Code of the Paraguayan electronic invoice. Zero dependencies.

[![npm](https://img.shields.io/npm/v/sifen-cdc?color=E8645C&label=npm)](https://www.npmjs.com/package/sifen-cdc)
[![test](https://github.com/FindTek/sifen-cdc/actions/workflows/test.yml/badge.svg)](https://github.com/FindTek/sifen-cdc/actions/workflows/test.yml)
[![MIT](https://img.shields.io/badge/license-MIT-71332F)](LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-E8645C)](package.json)
[![Technical Manual](https://img.shields.io/badge/Technical_Manual-v150_§10-2EAD33)](#verification-against-the-technical-manual)

The CDC is a **44-digit** code that uniquely identifies every electronic document.
It is composed by **the issuer, not the tax authority** — and that is exactly why you
can invoice offline and transmit once you reconnect.

```ts
import { componerCdc, validarCdc, formatearKude, TipoDocumento } from "sifen-cdc";

const cdc = componerCdc({
  tipoDocumento: TipoDocumento.FACTURA,
  rucEmisor: 44444401, dvRucEmisor: 7,
  establecimiento: 1, puntoExpedicion: 1, numeroDocumento: 14528,
  tipoContribuyente: 2, fechaEmision: "20170125",
  tipoEmision: 1, codigoSeguridad: 587326098,
});
// "01444444017001001001452822017012515873260988"

validarCdc(cdc);       // true
formatearKude(cdc);    // "0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988"
```

> The API is in Spanish on purpose: it mirrors the field names of the official
> Paraguayan documentation, so you can move between this code and the manual without
> translating anything.

## Install

```bash
npm install sifen-cdc
```

## CDC structure

Layout per the **SIFEN Technical Manual v150, §10.1**, with the XML field IDs:

| Pos. | Field | ID | Length | What it is |
|---:|---|---|---:|---|
| 1–2 | `C002` | `iTiDE` | 2 | Electronic document type |
| 3–10 | `D101` | `dRucEm` | 8 | Issuer's RUC, without check digit |
| 11 | `D102` | `dDVEmi` | 1 | RUC check digit |
| 12–14 | `C005` | `dEst` | 3 | Establishment |
| 15–17 | `C006` | `dPunExp` | 3 | Point of issue |
| 18–24 | `C007` | `dNumDoc` | 7 | Sequential document number |
| 25 | `D103` | `iTipCont` | 1 | Taxpayer type |
| 26–33 | `D002` | `dFeEmiDE` | 8 | Issue date, `YYYYMMDD` |
| 34 | `B002` | `iTipEmi` | 1 | Issue type |
| 35–43 | `B004` | `dCodSeg` | 9 | Random security code |
| 44 | `A003` | `dDVId` | 1 | Check digit, modulo 11 |

## API

| Function | Returns | Throws |
|---|---|---|
| `componerCdc(campos)` | The 44-digit CDC | `CdcInvalidoError` if a field violates the manual or the RUC check digit is inconsistent |
| `validarCdc(cdc)` | `boolean` | Never — returns `false` on garbage |
| `analizarCdc(cdc)` | Decomposed fields + validity | `CdcInvalidoError` if not 44 digits |
| `formatearKude(cdc)` | The CDC in groups of four | `CdcInvalidoError` if not 44 digits |
| `digitoVerificador(cadena)` | The modulo-11 digit | `CdcInvalidoError` if not numeric |
| `generarCodigoSeguridad(numDoc?)` | 9-digit random, per §10.3 | — |

Typed constants: `TipoDocumento`, `TipoEmision`, `TipoContribuyente`.

`analizarCdc` and `validarCdc` tolerate the KuDE's space-separated representation.

## What this library knows and others don't

### 1. The check digit has 4 blind spots

Modulo 11 uses cyclic weights from 2 to 11. Where the weight is **11**, the product is
a multiple of 11 and **contributes nothing to the remainder**: changing that digit does
not change the check digit. In a 43-digit body that happens at positions
**4, 14, 24 and 34**.

| Blind position | Field it falls in |
|---:|---|
| 4 | `dRucEm` — issuer's RUC |
| 14 | `dEst` — establishment |
| 24 | `dNumDoc` — document number |
| 34 | `iTipEmi` — issue type |

**This is not a flaw in this library: it is in the algorithm the manual defines.** It
is documented so nobody assumes a guarantee that does not exist. In the other 39
positions every single-digit change is caught, and **every transposition of adjacent
digits is always caught**. There are tests for both.

### 2. Contingency (`tipoEmision: 2`) does not work today

The value exists in the standard, but chapter 14 of the v150 Technical Manual appears
literally as **"Operación de Contingencia (Futuro)"** — future — in the document's own
table of contents.

To issue offline you use `tipoEmision: 1` (normal) and transmit on reconnect. Offline
issuing works **because the CDC is composed locally**, not because of contingency mode.

### 3. The issuer's check digit must match their RUC

`componerCdc` verifies that `dvRucEmisor` is the real check digit of `rucEmisor`.
Without that check you can build a **structurally flawless** CDC — its 44th digit adds
up fine — carrying an inconsistent RUC inside. The error surfaces neither on compose
nor on validate: it surfaces when SIFEN rejects the already-signed document.

```ts
componerCdc({ ...campos, rucEmisor: 44444401, dvRucEmisor: 3 });
// CdcInvalidoError: dvRucEmisor no corresponde al RUC 44444401: esperado 7, se recibió 3
```

### 4. The security code has rules — it is not just any random number

§10.3 requires `dCodSeg` to be random, 9 digits, between `000000001` and `999999999`,
different for every document and **different from the document number**. `componerCdc`
rejects the last two cases, and `generarCodigoSeguridad` uses `crypto.getRandomValues`
with rejection sampling to avoid modulo bias.

## Verification against the Technical Manual

The tests use no made-up data: they use **the official example** from the manual
(§10.1, page 57 of the v150 PDF) and check that the library reproduces it exactly.

```
componerCdc(manual's fields)      →  01444444017001001001452822017012515873260988
CDC published in the manual       →  01444444017001001001452822017012515873260988
formatearKude(cdc)                →  0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988
official graphical representation →  0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988
```

**26 tests, all green**, on Node 22 and 24. CI also compiles the package.

## Scope

This library covers **the CDC**. It does not sign XML, build the DE, talk to SIFEN's
web services or handle certificates. It does one thing and does it well.

To validate the issuer's RUC: [`ruc-paraguay`](https://github.com/FindTek/ruc-paraguay).

## Tests

Node 22+ runs TypeScript natively, so nothing needs installing:

```bash
node --test --experimental-strip-types test/*.test.ts
```

## Source

SIFEN Technical Manual v150 (DNIT), September 2019:
<https://www.dnit.gov.py/web/e-kuatia/documentacion-tecnica>

## License

MIT — [FindTek](https://www.findtek.com.py), San Lorenzo, Paraguay 🇵🇾
