---
generated: 2026-08-31T20:44:37-03:00
source: 4d-init
---

# Contrato de errores

Una sola clase de error en toda la API pública: `CdcInvalidoError`, definida en
`src/cdc.ts`. Extiende `Error` y fija `name = "CdcInvalidoError"` para que sobreviva
al pasaje por estructuras serializadas.

## Quién lanza y quién no

| Función | Ante entrada inválida |
|---|---|
| `componerCdc` | **lanza** `CdcInvalidoError` |
| `analizarCdc` | **lanza** `CdcInvalidoError` |
| `formatearKude` | **lanza** (delega en `analizarCdc`) |
| `digitoVerificador` | **lanza** si la cadena no es numérica |
| `validarCdc` | **nunca lanza** — devuelve `false` |
| `generarCodigoSeguridad` | nunca lanza |

La asimetría es deliberada. `validarCdc` es la función que se llama desde un
`onChange` de formulario con lo que sea que el usuario haya tipeado: ahí un throw
obliga a envolver cada llamada en try/catch. Las demás son de composición y
descomposición, donde una entrada mal formada es un bug del llamador y conviene que
explote fuerte.

## Al agregar una función nueva

- Si recibe entrada de usuario sin sanitizar, seguí el patrón de `validarCdc`:
  try/catch interno y un booleano afuera.
- Si recibe datos ya validados por el sistema, lanzá.
- **Siempre `CdcInvalidoError`**, nunca `Error`, `TypeError` ni `RangeError` pelados:
  quien consume la librería filtra por esa clase.

## Mensajes

En español, nombrando el campo y el valor recibido. El patrón vigente:

```
`${nombre} debe ser un entero entre 0 y ${maximo}, se recibió ${valor}`
`fechaEmision no existe en el calendario: "${fecha}"`
`codigoSeguridad no puede ser igual a numeroDocumento (Manual Técnico §10.3)`
```

Cuando la regla sale del manual, **citá la sección**. Quien lee el error después
necesita poder ir a la fuente sin preguntarle a nadie.
