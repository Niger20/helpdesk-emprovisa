# Cierre de accesibilidad

Fecha: 14/10/2026. Alcance: revisión estática, mejoras de semántica/foco y uso móvil.
Sin navegador/CUA, subagentes, commits, pruebas globales ni modificaciones de BD.

## Archivos modificados

- apps/web/src/styles/globals.css
- apps/web/src/features/assets/components/list/AssetTable.tsx
- apps/web/src/features/assets/components/detail/AssetCustodyHistory.tsx
- apps/web/src/features/admin-identity/components/UserTable.tsx
- apps/web/src/features/admin-identity/components/IdentityWorkspace.tsx
- apps/web/src/features/catalog/components/CategoryTable.tsx
- apps/web/src/features/tickets/components/queue/TicketTable.tsx
- apps/web/src/features/tickets/components/form/TicketFields.tsx
- apps/web/src/features/tickets/components/form/CategoryField.tsx
- apps/web/src/features/tickets/components/form/AssetSearchField.tsx
- apps/web/src/features/reports/components/ReportCharts.tsx

## Archivos creados

- docs/quality/ACCESSIBILITY.md
- docs/coordination/closure-accessibility.md

## Resultado y decisiones para consolidar

Foco común, botones mínimos 40 × 40, campos contenidos y división de texto largo;
cinco regiones de tablas nombradas y enfocables; errores asociados en nuevo ticket;
paginación de identidad adaptable. Gráficos ocultos conservan alternativa textual
y dejan de ofrecer su capa de navegación. No cambian permisos, contratos ni negocio.

La paleta existente cumple las diez combinaciones opacas calculadas (mínimo 5,91:1).
No fue necesario cambiar tokens. Se conserva el desplazamiento local de tablas
para mantener sus relaciones entre columnas a 360 px; no se ocultan columnas.

ESLint focal de diez TSX pasó. Typecheck web y compilación Vite pasaron tras la última
edición. Se verificaron las reglas del CSS compilado; el primer verificador literal
falló por espacios en `calc` y el verificador corregido pasó. ESLint ignora CSS por
configuración; la validación de CSS procede de Vite. No se ejecutaron los cuatro
controles globales; quedan para Aceptación final según la asignación.

No se tocaron AppShell.tsx, router/routes.tsx, SLA nuevo, backend, contracts,
package.json, lockfile, README ni los documentos de consolidación.

## Limitación y entrega a QA

No se afirma operabilidad móvil real ni recorrido completo de teclado. Pendientes
detallados en docs/quality/ACCESSIBILITY.md: 360 px, zoom, flujo crear/atender,
CSAT, errores, alternativas de gráficos y lector de pantalla.

Para responsable AppShell/aceptación final: propuesto «Saltar al contenido»,
landmark principal limitado al contenido y foco/anuncio al cambiar ruta. No se
editó ese archivo por asignación. Consolidar esta decisión y los resultados en
PROGRESS/DECISIONS/closure generales; esta sesión no modifica esos documentos.

Estado: COMPLETO CON LIMITACIÓN
