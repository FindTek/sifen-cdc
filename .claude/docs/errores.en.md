---
generated: 2026-08-31T20:46:09-03:00
source: 4d-init
lang: en
---

# Error contract

A single error class across the whole public API: `CdcInvalidoError`, defined in
`src/cdc.ts`. It extends `Error` and sets `name = "CdcInvalidoError"` so it survives
serialization boundaries.

## Who throws and who does not

| Function | On invalid input |
|---|---|
| `componerCdc` | **throws** `CdcInvalidoError` |
| `analizarCdc` | **throws** `CdcInvalidoError` |
| `formatearKude` | **throws** (delegates to `analizarCdc`) |
| `digitoVerificador` | **throws** if the string is not numeric |
| `validarCdc` | **never throws** — returns `false` |
| `generarCodigoSeguridad` | never throws |

The asymmetry is deliberate. `validarCdc` is the function you call from a form's
`onChange` with whatever the user typed: a throw there forces a try/catch around every
call. The others compose and decompose, where malformed input is a caller bug and
should fail loudly.

## When adding a new function

- If it takes unsanitized user input, follow the `validarCdc` pattern: internal
  try/catch, boolean on the outside.
- If it takes data the system already validated, throw.
- **Always `CdcInvalidoError`** — never a bare `Error`, `TypeError` or `RangeError`:
  consumers filter on that class.

## Messages

In Spanish, naming the field and the received value. The current pattern:

```
`${nombre} debe ser un entero entre 0 y ${maximo}, se recibió ${valor}`
`fechaEmision no existe en el calendario: "${fecha}"`
`codigoSeguridad no puede ser igual a numeroDocumento (Manual Técnico §10.3)`
```

When the rule comes from the manual, **cite the section**. Whoever reads the error
later must be able to reach the source without asking anyone.
