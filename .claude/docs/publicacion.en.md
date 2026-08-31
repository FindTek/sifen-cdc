---
generated: 2026-08-31T20:46:40-03:00
source: 4d-init
lang: en
---

# Publishing to npm

## What gets compiled

`tsconfig.json` takes `src/` and emits `dist/` with `declaration: true`. Tests are
left out via `exclude`. `package.json` points at the build output:

```json
"main":    "./dist/cdc.js",
"types":   "./dist/cdc.d.ts",
"exports": { ".": { "types": "./dist/cdc.d.ts", "default": "./dist/cdc.js" } }
```

`prepublishOnly` runs `npm run build`, so `npm publish` can never ship a stale
`dist/`. `dist/` is in `.gitignore`: it is generated, not versioned.

## What goes into the tarball

`files: ["dist", "src"]`. `src/` ships on purpose: it is 271 lines and it lets people
read the code and its JSDoc straight from `node_modules` without cloning. Tests and
fixtures stay out.

## `engines: >=19` and where it comes from

`generarCodigoSeguridad` uses `crypto.getRandomValues` from the global object, which
is available without an import from **Node 19**. Do not lower it to 18 without adding
a fallback, and do not raise it to 22: that confuses the consumption requirement with
the development one (see `.claude/docs/testing.en.md`).

Using the global instead of `node:crypto` also makes the package work in the browser.
**Do not switch to `import { randomInt } from "node:crypto"`**: it breaks that
property and buys nothing.

## Before publishing

1. `node --test --experimental-strip-types test/*.test.ts` green
2. `npm run build` with no errors
3. Version bumped in `package.json` following semver — a change to the CDC layout or
   to the error contract is **major**, not patch
4. `npm publish --access public`

## Package name

`sifen-cdc`. As of 2026-08-31 it is not published yet: the repo exists but the npm
name is not claimed by FindTek. Check with `npm view sifen-cdc` before the first
publish.
