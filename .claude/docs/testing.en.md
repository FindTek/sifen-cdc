---
generated: 2026-08-31T20:46:40-03:00
source: 4d-init
lang: en
---

# Testing

```bash
node --test --experimental-strip-types test/*.test.ts
```

**Nothing to install.** Node 22+ runs TypeScript by stripping types on the fly, and
the test runner is built in. That is why the repo has no vitest, no jest, no ts-node:
running the tests on a fresh clone is a single command.

## The official case

`test/cdc.test.ts` uses no made-up data. The `caso oficial del Manual Técnico v150`
suite takes the CDC the manual itself publishes in §10.1 and checks that `componerCdc`
reproduces it digit by digit, and that `formatearKude` yields the same graphical
representation the PDF prints:

```
01444444017001001001452822017012515873260988
0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988
```

If that suite goes red, **the library is wrong, not the test**. It is the anchor to
the primary source.

## The 6 suites

| Suite | What it pins down |
|---|---|
| `caso oficial del Manual Técnico v150` | The anchor: compose, validate, KuDE, round trip |
| `digitoVerificador` | Modulo 11 in isolation |
| `componerCdc — validaciones del manual` | Ranges, impossible dates, §10.3 rules |
| `analizarCdc` | Parsing, whitespace tolerance, expected digit |
| `alcance de la detección de errores` | The 4 blind spots as expected behaviour |
| `generarCodigoSeguridad` | Range, uniqueness, document-number exclusion |

## The CI matrix cannot include Node 20

`.github/workflows/test.yml` runs the 26 tests and **also compiles** (`tsc --noEmit`) on `22.x` and `24.x`. **Do not add `20.x`**:
`--experimental-strip-types` only exists from Node 22.6 onwards, so the job would fail
for a reason unrelated to the code.

`engines` in `package.json` says `>=19`, and that is both correct and different: it
refers to whoever **consumes** the compiled package, which only needs
`crypto.getRandomValues`.

## When adding tests

Suite and test names in Spanish, describing the rule rather than the mechanism. When a
test pins down something taken from the manual, cite the section in a comment — as
`alcance de la detección de errores` does with the blind spots.
