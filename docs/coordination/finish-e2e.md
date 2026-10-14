# Coordinación de cierre E2E local

Fecha: 14/10/2026, America/Managua.
Propiedad exclusiva: docs/quality/E2E-CLOSURE.md, este archivo y capturas
locales .data/quality/e2e. Sin edición de código, commits, pruebas globales,
recreación de helpdesk_test ni mensajes a otros chats.

Navegador reservado a E2E. CUA abrió el prototipo 127.0.0.1:5173 y mostró login.
Se espera finish-ui y finish-drafts con marcador COMPLETO antes de los recorridos
finales. La sesión de accesibilidad debe esperar la liberación explícita aquí.

Plan: alta/adjunto ficticio, asignación/atención, comentario público y nota interna,
resolución, cierre por solicitante y CSAT emitido por flujo real; roles N1/N2/AUDITOR;
administración/SLA/Servicio; V-01–V-06 a 360 px; borrador/recarga/descarte/aislamiento.
Registrar límites de estados controlados y teclado sin equiparar API con UI.

## Hallazgos tempranos para Final QA

- TK-000016 creado/adjunto/tomado/atendido/comentado/resuelto/cerrado por UI;
  CSAT real respondido 5/5 y reuso rechazado. No se fabricó token.
- CSAT sin calificación: error visible `Invalid input: expected number, received
  undefined`. Corregir mensaje en español del schema/refinamiento y revalidar.
  No se editó código ajeno. Flechas 1–5 y envío funcionaron.
- En dos cambios de cuenta, primer login devolvió el error genérico; repetir
  las mismas credenciales funcionó. Causa no determinada; revisar en QA.
- Página /administracion/roles: sin AppShell, navegación ni botón para volver;
  se retornó con historial del navegador. Captura admin-roles-sin-shell-mobile.jpg.
- Servicio /disponibilidad: mensaje «La mesa de ayuda está en preparación.» y
  sin navegación/retorno a tickets; solo sesión y disponibilidad. Revisar texto
  y retorno contextual. No se cambió configuración.
- Vigencias de roles/miembros y feriado mantienen campos de fecha nativos;
  coincide con integración pendiente de finish-ui. Categorías/calendarios/
  parámetros conservan wrapper main dentro del shell: revisar landmarks.
- TK-000017: rama real N1→N2, pausa REPUESTOS, reanudación, solución y cierre;
  encuesta pendiente disponible para ana.managua en Avisos. No reiniciar API
  antes de revisión A11y: la invitación reside en memoria. Sin token en archivos.

## Entrega final y liberación

Archivos cambiados exclusivamente: docs/quality/E2E-CLOSURE.md, este archivo;
capturas y PNG ficticio en .data/quality/e2e, ignorados por Git.
Sin código, tests/check globales, commits, recreación de BD ni servicios reales.

Evidencia principal: TK-000016 NUEVO→ASIGNADO→EN_ATENCION→RESUELTO→CERRADO,
adjunto real PNG, comentario público/nota interna y nota ausente como solicitante;
CSAT emitido por cierre, escala con flechas, envío 5/5/agradecimiento y reuso rechazado.
TK-000017 rama N1→N2, pausa/reanudación, solución/cierre y CSAT pendiente para A11y.
Cinco perfiles observados (solicitante/N1/N2/jefe/auditor); cadenas íntegras 107/22.
Recuperación/descarte/aislamiento/limpieza tras éxito del borrador por UI.
V-01–V-06 repetidos con límites explícitos, administración/SLA/Servicio y estados
controlados documentados. Nueve hitos principales 9/9; no porcentaje global/UAT.

No cobertura completa de cuatro estados por cada vista, caducidad temporal,
cierre/reapertura de pestaña ni pérdida de red durante POST. Hallazgos técnicos
arriba requieren revisión/corrección por Final QA; no se fabrica aprobación.

NAVEGADOR LIBERADO para sesión accesibilidad: tab 1 (iab ID 2), /login,
sesión cerrada, viewport restablecido, markHandoff aplicado. A11y puede entrar
como ana.managua → Avisos → Evaluar atención TK-000017; no reiniciar API antes
de abrir/copiar invitación por UI. No token en documentos ni manipulación de seed.
Sin esperar correcciones QA para este marcador: evita dependencia circular;
Final QA retoma hallazgos después de las entregas.

Estado: COMPLETO CON LIMITACIÓN
