# Conocimientos: integración y avance

Implementación preparada. Propiedad exclusiva respetada. Ninguna migración, seed ni comando de integración ejecutado.

## Decisiones para trasladar a DECISIONS.md

La especificación RF-09 y P-07 exigen búsqueda por palabra/categoría y ficha. El ER no enumera estados ni visibilidades; la seed fija PUBLICADO/PUBLICO. Se propone BORRADOR/PUBLICADO/ARCHIVADO y PUBLICO/INTERNO como catálogo del prototipo sin cambiar tablas. No se agrega una aprobación editorial independiente: publicar con kb.editar registra a quien publica como revisor, decisión pendiente de validación de negocio.

Solo kb.ver permite acceder. Artículos públicos publicados son visibles a todos; internos publicados a soporte (permisos ticket.ver_sede, ticket.ver_grupo o ticket.ver_todos), editores y auditoría. Solo editores y auditoría ven borradores/archivados e historial; evita exponer versiones antiguas de borradores al solicitante. Edición global requiere grant kb.editar sin restricción por sede, porque el ER no tiene sede en artículos. No se incrementan vistas mediante GET para conservar el perfil auditor solo lectura. Votos/enlaces de tickets quedan fuera de esta fase.

Contenido tratado como texto plano, sin HTML ejecutable. Edición compara versionActual bajo bloqueo de fila; artículo, nueva versión y auditoría son una sola transacción.

## Integración coordinadora

- Exportar todo lo público de packages/contracts/src/knowledge.ts desde contracts/index.ts.
- API: createKnowledgeService(database), registerKnowledgeRoutes(app, service), KnowledgeService desde modules/knowledge/index.ts.
- Front: loadKnowledgeListPage y loadKnowledgeDetailPage desde features/knowledge-base/index.ts. Rutas /conocimientos y /conocimientos/:idArticulo protegidas con kb.ver.
- Conectar knowledgeChecks(database, env) de apps/api/test/knowledge-checks.ts en la suite de integración existente.
- Actualizar PROGRESS/DECISIONS; ejecutar cuatro controles globales e integración al terminar la coordinación.

Exports de contratos (se puede usar `export * from './knowledge.js'`): estadoArticuloSchema, visibilidadArticuloSchema, knowledgeParamsSchema, knowledgeQuerySchema, knowledgeCreateSchema, knowledgeUpdateSchema, knowledgeSchema, knowledgeVersionSchema, knowledgeDetailSchema, knowledgeListSchema, knowledgeCatalogSchema. Tipos: KnowledgeQuery, KnowledgeCreate, KnowledgeUpdate, Knowledge, KnowledgeDetail, KnowledgeList, KnowledgeCatalog.

API: GET /api/v1/conocimientos, GET /api/v1/conocimientos/catalogos, GET /api/v1/conocimientos/:idArticulo, POST /api/v1/conocimientos, PUT /api/v1/conocimientos/:idArticulo. Escrituras declaran kb.editar y usan CSRF global. Body limit específico de 450 KB para contenido de hasta 100000 caracteres. La paginación es page/pageSize y el orden acepta titulo, -titulo, -publicadoEn. El listado no contiene el texto completo; la ficha filtra historial según permisos. Conflicto de edición: HTTP 409, code ENTRADA_INVALIDA existente, sin modificar catálogo compartido de errores.

El frontend compone AppShell, QueryBoundary, componentes propios, hooks Query/RHF y HTTP con CSRF. Alta dentro del listado; edición en la ficha; no necesita loader adicional. El contenido y las versiones se presentan como texto plano.

## Verificaciones ejecutadas

- ESLint acotado sobre knowledge, knowledge-checks.ts, knowledge-base y knowledge.ts: pasó.
- Vitest acotado knowledge.policies.test.ts: 4 pruebas pasaron (denegación, autoservicio/soporte, auditoría y alcance de edición).
- TypeScript acotado API y frontend: pasó usando un barrel temporal que combina index.ts existente con knowledge.ts, sin cambiar contracts/index.ts. Archivos temporales retirados. Debe repetirse la verificación global después de exportar contratos.
- No se ejecutaron pnpm test, build, checks globales ni integration. knowledgeChecks registra pruebas HTTP/service para autenticación, permisos, CSRF, filtros literales, estados/visibilidad, historial, publicación, bloqueo concurrente, hashes de auditoría y rollback.

## Pendiente coordinador

Conectar exports/rutas/nav/suite y ejecutar los cuatro controles. Revisar las decisiones propuestas antes de aceptar la política editorial como definitiva. La especificación habla de publicación por analistas, pero el AGENTS y seed reservan kb.editar a N2 y jefatura: se conserva la autorización más restrictiva existente y no se amplían permisos de N1.

## Integración coordinadora completada

Exports, app/main, rutas lazy, navegación con kb.ver y knowledgeChecks conectados.
Decisiones trasladadas a D-011, conservando la autorización restrictiva de AGENTS.
pnpm check pasó con lint, typecheck, 170 pruebas y build (161,37 KB gzip).
Listado/ficha verificados en navegador integrado a 360 px. PROGRESS actualizado.
