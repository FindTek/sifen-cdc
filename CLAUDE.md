# sifen-cdc

Librería del CDC de SIFEN (e-Kuatia, Paraguay): composición, validación, parseo y
formato KuDE del Código de Control de 44 dígitos. Cero dependencias.

<!-- BEGIN 4D-BRIDGES -->
## Reglas del proyecto (siempre)
- NUNCA agregues dependencias de runtime: el paquete es cero-dependencias por diseño.
- `componerCdc` es PURA: el código de seguridad entra como argumento, nunca se genera adentro.
- Para el azar usá SIEMPRE `crypto.getRandomValues`; NUNCA `Math.random`.
- NUNCA cambies anchos de campo, códigos ni el algoritmo del dígito sin citar la sección del Manual Técnico v150 que lo respalda.
- Identificadores, JSDoc y mensajes de error en español; los IDs de campo del manual (`iTiDE`, `dRucEm`, `dDVEmi`, `dCodSeg`, `dDVId`) van tal cual figuran en el documento.

## Puentes de documentación
| Tema | Cuándo leer | Archivo |
|------|-------------|---------|
| CDC | layout de los 44 dígitos, códigos oficiales, puntos ciegos, contingencia | .claude/docs/cdc.md |
| Errores | qué función lanza y cuál no, `CdcInvalidoError` | .claude/docs/errores.md |
| Testing | correr los tests, el caso oficial del manual, el matrix de CI | .claude/docs/testing.md |
| Publicación | build a `dist/`, `engines`, semver, npm | .claude/docs/publicacion.md |
| Convenciones | idioma, formato, estructura, tipado | .claude/docs/convenciones.md |

Si la pregunta o tarea toca un tema de la tabla, LEÉ ese archivo ANTES de responder.
Al escribir código, respetá `.claude/docs/convenciones.md`.

Cada doc tiene su versión en inglés como `<tema>.en.md`. La versión en español es la
principal: si divergen, manda la española y hay que actualizar la inglesa.
<!-- END 4D-BRIDGES -->
