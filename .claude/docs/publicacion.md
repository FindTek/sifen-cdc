---
generated: 2026-08-31T20:45:09-03:00
source: 4d-init
---

# Publicación a npm

## Qué se compila

`tsconfig.json` toma `src/` y emite `dist/` con `declaration: true`. Los tests quedan
fuera vía `exclude`. `package.json` apunta a lo compilado:

```json
"main":    "./dist/cdc.js",
"types":   "./dist/cdc.d.ts",
"exports": { ".": { "types": "./dist/cdc.d.ts", "default": "./dist/cdc.js" } }
```

`prepublishOnly` corre `npm run build`, así que un `npm publish` nunca sube un `dist/`
viejo. `dist/` está en `.gitignore`: se genera, no se versiona.

## Qué entra al tarball

`files: ["dist", "src"]`. Va también `src/` a propósito: son 271 líneas y permiten
leer el código y los JSDoc desde `node_modules` sin clonar el repo. Los tests y el
fixture no entran.

## `engines: >=19` y de dónde sale

`generarCodigoSeguridad` usa `crypto.getRandomValues` del objeto global. Está
disponible sin import desde **Node 19**. No lo bajes a 18 sin agregar un fallback, ni
lo subas a 22: eso confunde el requisito de consumo con el de desarrollo (ver
`.claude/docs/testing.md`).

Al usar el global en vez de `node:crypto`, el paquete también funciona en el
navegador. **No cambies a `import { randomInt } from "node:crypto"`**: rompe esa
propiedad sin ganar nada.

## Antes de publicar

1. `node --test --experimental-strip-types test/*.test.ts` en verde
2. `npm run build` sin errores
3. Versión subida en `package.json` siguiendo semver — un cambio en el layout del CDC
   o en el contrato de errores es **major**, no patch
4. `npm publish --access public`

## Nombre del paquete

`sifen-cdc`. Verificado el 01/09/2026: el nombre está **libre** en npm, pero el
paquete todavía no se publicó.

Ojo con el paquete hermano: `ruc-paraguay` a secas **ya estaba tomado** por otro
(v0.0.1), así que se publica como **`@findtek/ruc-paraguay`**, con
`publishConfig.access = "public"` porque los scoped son privados por defecto.
Verificá siempre con `npm view <nombre>` antes del primer publish.
