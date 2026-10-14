# Coordinación de borradores CU-01 — 14/10/2026

Propiedad limitada a formulario/borrador de tickets y estos dos documentos.
Sin subagentes, worktrees, navegador, mensajes a otros chats ni commits.
Sin edición de adjuntos, AppShell, auth, consultas globales, README, PROGRESS,
DECISIONS o ACCEPTANCE. Final QA integra documentación y commits.

## Archivos cambiados

- apps/web/src/features/tickets/hooks/useTicketForm.ts
- apps/web/src/features/tickets/hooks/useTicketDraft.ts (nuevo)
- apps/web/src/features/tickets/schemas/ticketDraft.ts (nuevo)
- apps/web/src/features/tickets/lib/ticketDraftStorage.ts (nuevo)
- apps/web/src/features/tickets/lib/ticketDraftStorage.test.ts (nuevo)
- apps/web/src/features/tickets/lib/ticketDraftOptions.ts (nuevo)
- apps/web/src/features/tickets/lib/ticketDraftOptions.test.ts (nuevo)
- apps/web/src/features/tickets/lib/ticketDraftContext.ts (nuevo)
- apps/web/src/features/tickets/components/form/TicketDraftSection.tsx (nuevo)
- apps/web/src/features/tickets/pages/NewTicketPage.tsx (composición mínima)
- apps/web/src/features/tickets/index.ts (API pública clearTicketDraft)
- docs/quality/DRAFTS.md (nuevo)
- docs/coordination/finish-drafts.md (nuevo)

## Entrega y evidencia

Borrador por idUsuario actual en localStorage, esquema derivado de contracts,
recuperación de campos incompletos, caducidad local de 24 horas, aislamiento,
reconciliación de opciones, comprobación con consulta fresca antes del POST,
descarte y limpieza tras éxito. No se persisten archivos ni credenciales.
Los errores de conexión conservan la copia; no hay POST automático repetido.
La política y sus límites están descritos en DRAFTS.md y en el aviso visible.

12 pruebas focales / dos archivos pasaron con Vitest (código 0).
ESLint focal pasó (código 0). pnpm --filter web typecheck pasó (código 0).
No se tocaron migraciones ni helpdesk_test; no se ejecutaron controles globales.

## Integración pendiente para Final QA

1. Ejecutar lint/typecheck/test/build globales y registrar resultado verdadero.
2. Actualizar PROGRESS/ACCEPTANCE/DECISIONS con la entrega y límites.
3. Si se decide eliminar al logout, importar clearTicketDraft desde el index
   público de tickets y llamarlo con el idUsuario de la sesión saliente después
   de logout exitoso, antes de eliminar la sesión de TanStack Query. No limpiar
   el borrador de otra cuenta ni cambiar la sesión/CSRF. auth queda fuera de
   esta propiedad. El helper es tolerante a indisponibilidad de localStorage.
4. Revisión dinámica: escribir, recargar, cerrar/abrir, cambiar de usuario,
   fallar conexión/reintentar, crear con éxito y descartar con teclado.

Implementación del alcance asignado: 100 %. Este porcentaje no representa
aceptación de CU-01 ni avance global del proyecto; la aceptación dinámica y
los cuatro controles globales pertenecen a las sesiones correspondientes.
Límites: localStorage sin cifrado, borrado de vencidos al abrir, última edición
de pestañas concurrentes prevalece, logout no editado aquí. No hay evidencia
dinámica inventada. Estado final de archivos propios estable para integrar.

Estado: COMPLETO CON LIMITACIÓN
