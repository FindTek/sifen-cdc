---
generated: 2026-08-31T20:45:09-03:00
source: 4d-init
---

# Testing

```bash
node --test --experimental-strip-types test/*.test.ts
```

**No hace falta instalar nada.** Node 22+ ejecuta TypeScript quitándole los tipos en
caliente, y el test runner viene incorporado. Por eso el repo no tiene ni vitest ni
jest ni ts-node: correr los tests en un clon recién hecho es un solo comando.

## El caso oficial

`test/cdc.test.ts` no usa datos inventados. La suite
`caso oficial del Manual Técnico v150` toma el CDC que el propio manual publica en
§10.1 y comprueba que `componerCdc` lo reproduce dígito por dígito, y que
`formatearKude` da la misma representación gráfica que imprime el PDF:

```
01444444017001001001452822017012515873260988
0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988
```

Si esa suite se pone en rojo, **la librería está mal, no el test**. Es el ancla contra
la fuente primaria.

## Las 6 suites

| Suite | Qué fija |
|---|---|
| `caso oficial del Manual Técnico v150` | El ancla: componer, validar, KuDE, ida y vuelta |
| `digitoVerificador` | El módulo 11 aislado |
| `componerCdc — validaciones del manual` | Rangos, fechas inexistentes, reglas de §10.3 |
| `analizarCdc` | Parseo, tolerancia a espacios, dígito esperado |
| `alcance de la detección de errores` | Los 4 puntos ciegos como comportamiento esperado |
| `generarCodigoSeguridad` | Rango, unicidad, exclusión del número de documento |

## El matrix de CI no puede incluir Node 20

`.github/workflows/test.yml` corre en `22.x` y `24.x`. **No agregues `20.x`**:
`--experimental-strip-types` recién existe desde Node 22.6, así que el job fallaría
por una razón que no tiene nada que ver con el código.

`engines` del `package.json` dice `>=19` y eso es correcto y distinto: se refiere a
quien **consume** el paquete ya compilado, que solo necesita `crypto.getRandomValues`.

## Al agregar tests

Nombres de suite y de test en español, describiendo la regla y no el mecanismo.
Cuando el test fija algo que sale del manual, citá la sección en un comentario — como
hace `alcance de la detección de errores` con los puntos ciegos.
