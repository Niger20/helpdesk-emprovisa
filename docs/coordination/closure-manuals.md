# Manuales locales — 14/10/2026

Propiedad: README.md, docs/deploy.md, docs/manuals/** y este archivo. No código,
spec/ER/mockups, quality, PROGRESS, DECISIONS ni closure.md modificados.
No subagentes, worktrees, servicios externos, tests globales ni commits.

Archivos previstos y redactados:
- docs/manuals/README.md: índice y fuentes.
- docs/manuals/usuario.md: solicitante, N1, N2, jefatura y auditor; rutas reales.
- docs/manuals/operacion-local.md: host, Postgre 18.1 existente, comandos y diagnóstico.
- docs/manuals/demostracion.md: caso nuevo end-to-end y escenarios ficticios.
- docs/manuals/seguridad-limitaciones.md: configuración, seguridad y límites.
- README.md: índice y corrección de pendientes históricos ya implementados.
- docs/deploy.md: ejecución local, base alternativa y alcance posterior.

Fuentes leídas: AGENTS; texto DOCX SPEC-TI-2026-002 por XML sin exportar documento;
ER completo .puml; referencias P-01–P-10 y P-09; router, formularios de tickets,
acciones/ciclo, permisos seed, escenarios/jobs seed, env/storage/queue, runner de
migración y driver de integración. Coordinaciones de activos, ciclo, CSAT,
calendarios, parámetros, asignación, roles y next-phases; PERFORMANCE leído.

Decisiones/documentación conservadora: specs es la carpeta real; alcance local
prevalece sobre LDAP/correo/infraestructura de SPEC. No añadir contraseñas demo:
solo se conserva la ya autorizada en README. Inventario no promete edición ni
transferencia; mockups no son rutas. STORAGE_DIR relativo depende de cwd de API,
por eso se recomienda absoluto. Test recrea public Y helpdesk_queue únicamente
en helpdesk_test. Seed repetida no restaura demo; jobs activos pueden cambiarla.
No afirmar browser/teclado revisado ni aceptación total sin evidencia.

Redacción completa. Cotejados código, closure-sla final y closure-accessibility
(COMPLETO CON LIMITACIÓN); incorporados consulta/nombres SLA, RF-19 parcial,
desplazamiento local de tablas y límites de revisión dinámica. Leído
closure-visual del 14/10/2026 mientras figura EN CURSO: se incorporan sus
observaciones de fechas nativas, selector en inglés, custodia/paginación móvil,
vacíos genéricos y CSAT sin token. No se afirma que el informe visual final haya
terminado ni que su revisión equivalga a aceptación global. Si QA repara estos
hallazgos después, debe conservar su evidencia y actualizar el alcance consolidado.

Validación documental ejecutada: 37 vínculos locales Markdown, cero rotos;
seis rutas administrativas coinciden con router; git diff --check focal y
whitespace de los cinco Markdown nuevos correctos. Dos lecturas previas de
coordinaciones todavía inexistentes devolvieron error de archivo ausente; se
repitieron cuando aparecieron, sin fallo de validación documental.

Limitaciones: no ejecución propia de navegador/teclado ni controles globales;
los cuatro controles y commits pertenecen exclusivamente a Aceptación final.
No se ejecutó pnpm test/check ni se recreó helpdesk_test. No se añadieron
contraseñas, secretos ni dependencias. Trabajo limitado a los ocho archivos
documentales asignados (cinco manuales, README, deploy y coordinación).

Estado: COMPLETO CON LIMITACIÓN
