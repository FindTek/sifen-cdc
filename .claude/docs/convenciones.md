---
generated: 2026-08-31T20:45:42-03:00
source: 4d-init
evidence: high
---

# Convenciones

> Medido sobre `src/cdc.ts` y `test/cdc.test.ts`. Desde la 2.0.0 **las convenciones
> de formato las aplica [Biome](https://biomejs.dev)** (`biome.json`), y el CI las
> verifica: `npm run lint` falla si el código no cumple. Las de idioma y estructura
> siguen siendo a mano — ningún linter sabe que los identificadores van en español.

## Idioma

**Español, en todo lo que se escribe.** Medido: 67 identificadores en español contra
1 en inglés.

- Identificadores: `componerCdc`, `digitoVerificador`, `codigoSeguridad`, `cuerpo`, `peso`
- JSDoc y comentarios: español, con tildes
- Mensajes de error: español
- Nombres de test y de suite: español

**Excepción, y es la única:** los IDs de campo del Manual Técnico se escriben tal cual
figuran en el documento — `iTiDE`, `dRucEm`, `dDVEmi`, `dCodSeg`, `dDVId`. Traducirlos
rompe el puente con la fuente oficial.

## Formato

| Regla | Estado medido |
|---|---|
| Indentación | 2 espacios |
| Comillas | dobles (52 dobles, 0 simples) |
| Punto y coma | siempre |
| Ancho de línea | 92, aplicado por Biome |
| TypeScript | `strict: true` en `tsconfig.json` |

`npm run lint` verifica · `npm run lint:fix` corrige. Biome también ordena los imports,
así que no los acomodes a mano.

## Estructura

```
src/cdc.ts          todo el dominio, un solo archivo
test/cdc.test.ts    todos los tests, agrupados por describe
.claude/docs/       estos documentos
```

Mientras el dominio quepa cómodo en un archivo, **no lo partas**: la librería hace una
cosa sola y el archivo único es parte de que se entienda de una sentada.

## Tipado

- Constantes de dominio como objeto `as const` más un `type` del mismo nombre
  (`TipoDocumento`, `TipoEmision`, `TipoContribuyente`), no `enum`: sobreviven al
  borrado de tipos de Node y no generan runtime extra.
- Las interfaces exportadas llevan JSDoc **por propiedad**, citando el ID del campo del
  manual cuando corresponde.
- Los helpers privados van al final del archivo, después de todo lo exportado.

## Documentación

Cada función exportada lleva JSDoc con: qué hace, `@throws` si lanza, y `@example` con
valores reales — preferentemente los del caso oficial del manual, para que el ejemplo
sea también una verificación.
