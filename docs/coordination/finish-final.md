# Integración y QA final — 14/10/2026

Propiedad: README.md, docs/manuals/**, docs/PROGRESS.md, docs/DECISIONS.md,
docs/quality/ACCEPTANCE.md, docs/coordination/finish.md y este archivo.
Tras liberación: apps/api/test/database.integration.test.ts para RN-08,
pruebas necesarias de borradores y correcciones mínimas enumeradas previamente.
No se modifican archivos de las seis sesiones mientras mantienen propiedad.

Fuentes leídas: AGENTS.md, texto OOXML de SPEC-TI-2026-002 v2.0
(requisitos, CU-01, protocolo 5.5 y criterios 6.7), ER completo, guía de mockups,
ACCEPTANCE/VISUAL/ACCESSIBILITY, coordinaciones previas y manuales.
Base 4eb69a4, 316 pruebas, avance orientativo 97 % con reservas.

Se esperan los seis marcadores COMPLETO o COMPLETO CON LIMITACIÓN antes
de controles globales, recreación exclusiva de helpdesk_test y commits.
Navegador reservado a E2E y posteriormente accesibilidad; QA final espera
su liberación. Sin mensajes a otros chats, subagentes ni despliegue.

Pendiente: revisar entregas, integrar helpers/pruebas, corregir hallazgos
técnicos viables, pnpm check, documentación y commits por capacidad.
No se acreditará UAT humano, lector audible ni retención temporal no observados.

Revisión previa a liberación: UI/borradores/seguridad/rendimiento entregados.
Tras los seis marcadores se completarán fechas administrativas en RolePanel,
MemberPanel y HolidaysEditor; wrappers main de CategoryAdminPage, CalendarsPage
y ParametersPage; CSP del documento Vite y dependencias corregibles. E2E/A11y
observan la entrega de UI actual; estos ajustes posteriores tendrán su propia
revalidación por Final QA. No se edita código todavía.
Protocolo humano preparado en docs/manuals/aceptacion-usuarios.md, sin firmas.
Decisión D-030 registra borradores, conservación al logout y caducidad local.
Diagnóstico solo lectura de login N1: cuenta LOCAL ACTIVO, sin bloqueo ni
fallos acumulados. Intento 01:39:30 Managua falló por credenciales; siguiente
01:39:53 fue exitoso. Sin modificación ni sesión adicional. Herramienta local
.tools/finish-login-diagnosis.cjs ignorada; primera consulta corrigió un nombre
de columna y la segunda terminó código 0. No se registra secreto/hash.

## Archivos previstos de integración, después de los seis marcadores

- apps/api/test/database.integration.test.ts: registrar helper RN-08 al final.
- packages/contracts/src/index.ts, tickets.ts, surveys.ts y localization.test.ts:
  locale español y regresión de categoría/CSAT, sin cambiar reglas ni enums.
- apps/web/src/features/admin-identity/components/RolePanel.tsx y MemberPanel.tsx;
  apps/web/src/features/calendars/components/HolidaysEditor.tsx: DateInput/RHF.
- apps/web/src/features/catalog/pages/CategoryAdminPage.tsx,
  calendars/pages/CalendarsPage.tsx y parameters/pages/ParametersPage.tsx:
  wrappers sin main anidado.
- apps/web/src/features/role-catalog/pages/RoleCatalogPage.tsx: AppShell.
- apps/web/src/features/admin/pages/AvailabilityPage.tsx y
  components/AvailabilityCard.tsx: retorno y texto de disponibilidad local.
- apps/web/vite.config.ts, config/local-csp.ts y config/local-csp.test.ts,
  apps/web/tsconfig.json; apps/api/src/app.ts: CSP frontend por documento
  y API sin defaults permisivos. Excepción de estilo inline de atributos
  para geometría React/Recharts, explícita y acotada; scripts sin unsafe-inline.
- pnpm-workspace.yaml, pnpm-lock.yaml, patches/braces@3.0.3.patch y
  packages/eslint-config/__tests__/dependency-safety.test.ts: correcciones
  Handlebars/UUID y mitigación de recursión de patrones Braces con prueba.
- docs/quality/FINAL-QA.md: evidencia posterior y límites sin reescribir
  los informes históricos de otras sesiones. Repetir red tras build web nuevo.

Las rutas conservan estructura modular y páginas de composición. Sin migración,
tabla, permiso, framework o dependencia de UI nuevos. Esta lista no acredita
edición, pruebas ni mitigación antes de ejecutarlas.

Después de A11y: se añaden noValidate a formularios RHF/Zod de GroupForm,
MemberPanel, RolePanel, SpecialtyPanel, UserAccessPanel, UserForm, CalendarForm,
RoleForm, CategoryForm, SlaPriorityForm, ParameterForm, KnowledgeForm y
KnowledgeLinks para evitar mensajes nativos en inglés sin relajar esquemas.
CategoryForm/SlaPriorityForm asocian errores a campos; DateInput acepta error
de RHF asociado a su ayuda. Lista anunciada antes de editar; sin nueva lógica
de negocio. CalendarBinding conserva validación y botón deshabilitado sin sede.

Ampliación mínima antes de editar: packages/contracts/src/catalog.ts y
sla-settings.ts, mensajes de nombre vacío claros; apps/web/vite.config.ts y
tsconfig.json, import con extensión para configuración Vite; nuevo helper
apps/api/test/runtime-route-access-checks.ts registrado al final del driver,
construye todos los módulos del runtime y recorre el inventario de permisos.
No inicia cola ni servidor, no concede permisos y no modifica datos de demo.

## Entrega integrada

Se esperaron seis marcadores finales y archivos estables; se aplicaron las
correcciones enumeradas, sin migración/tablas/permisos nuevos. RN-08 y runtime
completo integrados en driver; README/manuales/ACCEPTANCE/FINAL-QA y decisiones
D-030–D-033 consolidados. pnpm check código 0: lint/typecheck, 369 pruebas/
27 archivos (55,69 s), build 312,6 kB gzip/499 kB, solo helpdesk_test recreada
sin k6 simultáneo. Fallos iniciales de fixtures Braces documentados/corregidos.
SCA 1 alto Braces mitigado localmente, 0 críticos/moderados; DAST pendiente.
CSP HTML/API comprobada, nonce por documento y excepción de estilo explícita.

Revalidación CUA: roles/categorías/Servicio/CSAT 360; SLA y vigencias/miembros/
feriados escritorio. TK-000018 preparado REST/CSRF, error español y 5/5 UI;
sesiones propias cerradas, viewport reset. Capturas locales ignoradas y anchos
correctos en FINAL-QA. Historia demo/categoría inactiva de A11y conservadas.
Transferencia final 148.248 bytes/4,734 s inicial y 317.863 bytes/10,562 s total;
34 hashes correctos. CPU/k6 previo conserva fecha/alcance.

Usuario pidió omitir nuevas pruebas y hacer commits; controles anteriores ya
verdes. Revisión adicional queda para mañana. Avance orientativo 99 %;
UAT/PO, zoom/lector, revisión exhaustiva/DAST/advisory y archivo/24 meses
como reservas; RF-19/activo y simulaciones conservados. Sin firma humana,
deploy, chats/subagentes ni recursos externos. Commits se enumeran antes
del commit documental. Archivos reales cambiados: lista previa de este informe,
entregas de los seis propietarios y documentos/manuales de cierre.

Commits realizados:
- 488120f — localización, navegación y accesibilidad de interfaz.
- 8475a8f — borradores locales y evidencia de su capacidad.
- 6ccaa7b — CSP/dependencias, RN-08/inventario y evidencia de calidad.
- Cierre documental: commit que contiene este informe, README/manuales,
  PROGRESS/DECISIONS/ACCEPTANCE, FINAL-QA y coordinación raíz.
Sin nuevas pruebas después de la instrucción final del usuario.

Estado: COMPLETO CON LIMITACIÓN
