# sifen-cdc

**Español** · [English](README.en.md)

**El CDC de SIFEN, bien hecho.** Composición, validación, parseo y formato KuDE del
Código de Control de la factura electrónica paraguaya. Cero dependencias.

[![test](https://github.com/FindTek/sifen-cdc/actions/workflows/test.yml/badge.svg)](https://github.com/FindTek/sifen-cdc/actions/workflows/test.yml)
[![MIT](https://img.shields.io/badge/licencia-MIT-71332F)](LICENSE)
[![sin dependencias](https://img.shields.io/badge/dependencias-0-E8645C)](package.json)
[![Manual Técnico](https://img.shields.io/badge/Manual_T%C3%A9cnico-v150_§10-2EAD33)](#verificación-contra-el-manual-técnico)

El CDC son **44 dígitos** que identifican unívocamente a cada documento electrónico.
Lo compone **el emisor, no el fisco** — y esa es exactamente la razón por la que se
puede facturar sin conexión y transmitir al reconectar.

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

## Instalación

```bash
npm install sifen-cdc
```

## Estructura del CDC

Layout según el **Manual Técnico del SIFEN v150, §10.1**, con los IDs de campo del XML:

| Pos. | Campo | ID | Largo | Qué es |
|---:|---|---|---:|---|
| 1–2 | `C002` | `iTiDE` | 2 | Tipo de documento electrónico |
| 3–10 | `D101` | `dRucEm` | 8 | RUC del emisor, sin dígito verificador |
| 11 | `D102` | `dDVEmi` | 1 | Dígito verificador del RUC |
| 12–14 | `C005` | `dEst` | 3 | Establecimiento |
| 15–17 | `C006` | `dPunExp` | 3 | Punto de expedición |
| 18–24 | `C007` | `dNumDoc` | 7 | Número correlativo del documento |
| 25 | `D103` | `iTipCont` | 1 | Tipo de contribuyente |
| 26–33 | `D002` | `dFeEmiDE` | 8 | Fecha de emisión, `AAAAMMDD` |
| 34 | `B002` | `iTipEmi` | 1 | Tipo de emisión |
| 35–43 | `B004` | `dCodSeg` | 9 | Código de seguridad, aleatorio |
| 44 | `A003` | `dDVId` | 1 | Dígito verificador, módulo 11 |

## API

| Función | Devuelve | Lanza |
|---|---|---|
| `componerCdc(campos)` | El CDC de 44 dígitos | `CdcInvalidoError` si algún campo viola el manual |
| `validarCdc(cdc)` | `boolean` | Nunca — ante basura devuelve `false` |
| `analizarCdc(cdc)` | Los campos descompuestos + validez | `CdcInvalidoError` si no son 44 dígitos |
| `formatearKude(cdc)` | El CDC en grupos de cuatro | `CdcInvalidoError` si no son 44 dígitos |
| `digitoVerificador(cadena)` | El dígito módulo 11 | `CdcInvalidoError` si no es numérica |
| `generarCodigoSeguridad(numDoc?)` | Aleatorio de 9 dígitos, conforme §10.3 | — |

Constantes tipadas: `TipoDocumento`, `TipoEmision`, `TipoContribuyente`.

`analizarCdc` y `validarCdc` toleran la representación con espacios del KuDE.

## Lo que esta librería sabe y otras no

### 1. El dígito verificador tiene 4 puntos ciegos

El módulo 11 usa pesos cíclicos de 2 a 11. Donde el peso es **11**, el producto es
múltiplo de 11 y **no aporta nada al resto**: cambiar ese dígito no cambia el
verificador. En un cuerpo de 43 dígitos eso pasa en las posiciones **4, 14, 24 y 34**.

| Posición ciega | Cae en el campo |
|---:|---|
| 4 | `dRucEm` — RUC del emisor |
| 14 | `dEst` — establecimiento |
| 24 | `dNumDoc` — número de documento |
| 34 | `iTipEmi` — tipo de emisión |

**No es un defecto de esta librería: es del algoritmo que define el manual.** Se
documenta para que nadie asuma una garantía que no existe. En las otras 39
posiciones, todo cambio de un dígito se detecta, y **toda transposición de dígitos
adyacentes se detecta siempre**. Hay tests que lo comprueban.

### 2. Contingencia (`tipoEmision: 2`) hoy no sirve

El valor existe en el estándar, pero el capítulo 14 del Manual Técnico v150 figura
literalmente como **"Operación de Contingencia (Futuro)"** en el propio índice del
documento, y la validación 1050 rechaza el valor.

Para emitir sin conexión se usa `tipoEmision: 1` (normal) y se transmite al
reconectar. La emisión offline funciona **porque el CDC se compone localmente**, no
por la contingencia.

### 3. El código de seguridad tiene reglas, no es un random cualquiera

El §10.3 exige que `dCodSeg` sea aleatorio, de 9 dígitos, entre `000000001` y
`999999999`, distinto para cada documento y **distinto del número de documento**.
`componerCdc` rechaza los dos últimos casos, y `generarCodigoSeguridad` usa
`crypto.getRandomValues` con muestreo por rechazo para evitar el sesgo del módulo.

## Verificación contra el Manual Técnico

Los tests no usan datos inventados: usan **el ejemplo oficial** del manual (§10.1,
página 57 del PDF v150) y comprueban que la librería lo reproduce exactamente.

```
componerCdc(campos del manual)  →  01444444017001001001452822017012515873260988
CDC publicado en el manual      →  01444444017001001001452822017012515873260988
formatearKude(cdc)              →  0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988
representación gráfica oficial  →  0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988
```

**23 tests, todos en verde**, sobre Node 22 y 24.

## Alcance

Esta librería cubre **el CDC**. No firma XML, no arma el DE, no habla con los web
services de SIFEN ni maneja certificados. Hace una cosa y la hace bien.

Para validar el RUC del emisor: [`ruc-paraguay`](https://github.com/FindTek/ruc-paraguay).

## Tests

Node 22+ ejecuta TypeScript de forma nativa, así que no hace falta instalar nada:

```bash
node --test --experimental-strip-types test/*.test.ts
```

## Fuente

Manual Técnico del SIFEN v150 (DNIT), septiembre de 2019:
<https://www.dnit.gov.py/web/e-kuatia/documentacion-tecnica>

## Licencia

MIT — [FindTek](https://www.findtek.com.py), San Lorenzo, Paraguay 🇵🇾
