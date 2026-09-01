---
generated: 2026-08-31T20:46:40-03:00
source: 4d-init
lang: en
evidence: high
---

# Conventions

> Measured on `src/cdc.ts` and `test/cdc.test.ts`. Since 2.0.0 the formatting
> conventions are **enforced by [Biome](https://biomejs.dev)** (`biome.json`) and
> checked in CI: `npm run lint` fails if the code does not comply. Language and
> structure are still by hand — no linter knows identifiers must be in Spanish.

## Language

**Spanish, in everything written.** Measured: 67 Spanish identifiers against 1 English
one.

- Identifiers: `componerCdc`, `digitoVerificador`, `codigoSeguridad`, `cuerpo`, `peso`
- JSDoc and comments: Spanish, with accents
- Error messages: Spanish
- Test and suite names: Spanish

**One exception, and only one:** Technical Manual field IDs are written exactly as
they appear in the document — `iTiDE`, `dRucEm`, `dDVEmi`, `dCodSeg`, `dDVId`.
Translating them breaks the bridge to the official source.

## Formatting

| Rule | Measured state |
|---|---|
| Indentation | 2 spaces |
| Quotes | double (52 double, 0 single) |
| Semicolons | always |
| Line width | 92, enforced by Biome |
| TypeScript | `strict: true` in `tsconfig.json` |

`npm run lint` checks · `npm run lint:fix` fixes. Biome also sorts imports, so do not
arrange them by hand.

## Structure

```
src/cdc.ts          the whole domain, one file
test/cdc.test.ts    all tests, grouped by describe
.claude/docs/       these documents
```

While the domain fits comfortably in one file, **do not split it**: the library does
one thing, and the single file is part of it being understandable in one sitting.

## Typing

- Domain constants as an `as const` object plus a `type` of the same name
  (`TipoDocumento`, `TipoEmision`, `TipoContribuyente`), not `enum`: they survive
  Node's type stripping and add no runtime.
- Exported interfaces carry JSDoc **per property**, citing the manual's field ID where
  it applies.
- Private helpers go at the end of the file, after everything exported.

## Documentation

Every exported function carries JSDoc with: what it does, `@throws` if it throws, and
`@example` with real values — preferably those of the manual's official case, so the
example doubles as a verification.
