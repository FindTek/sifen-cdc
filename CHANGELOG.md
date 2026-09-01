# Changelog

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versionado [SemVer](https://semver.org/lang/es/).

## [2.0.0] — 2026-09-01

### Cambiado — ⚠ ruptura

- **`componerCdc` ahora exige que `dvRucEmisor` corresponda al RUC de `rucEmisor`.**
  Antes aceptaba cualquier dígito de 0 a 9, así que se podía componer un CDC
  estructuralmente perfecto —con su dígito 44 cerrando bien— y un RUC inconsistente
  adentro. El error solo aparecía cuando SIFEN rechazaba el documento, ya firmado.

  **Cómo migrar:** si el DV que venís pasando es correcto, no hay nada que hacer. Si
  no lo era, hasta hoy estabas emitiendo CDCs que SIFEN iba a rechazar. Para obtener
  el dígito: [`@findtek/ruc-paraguay`](https://github.com/FindTek/ruc-paraguay).

### Agregado

- 3 tests que cubren el control del DV, incluido el caso de un RUC de menos de 8
  dígitos (el relleno con ceros no altera el resultado).
- El CI compila el paquete además de correr los tests: un `tsconfig` roto ya no
  espera hasta el `npm publish` para aparecer.
- **Linter y formateador con [Biome](https://biomejs.dev)** (`biome.json`), una sola
  devDependency. `npm run lint` verifica, `npm run lint:fix` corrige, y el CI lo
  ejecuta. Hasta ahora las convenciones estaban documentadas pero nada las aplicaba.

## [1.0.0] — 2026-08-31

- Primera versión: `componerCdc`, `analizarCdc`, `validarCdc`, `formatearKude`,
  `digitoVerificador`, `generarCodigoSeguridad`.
- Verificado contra el ejemplo oficial del Manual Técnico del SIFEN v150 §10.1.
