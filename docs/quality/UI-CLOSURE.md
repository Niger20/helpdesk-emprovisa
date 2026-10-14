# Cierre de correcciones de interfaz

Fecha: 14/10/2026, America/Managua. Alcance asignado: V-01, V-02, V-05 y V-06.
Revisión de código y controles focales; sin navegador, capturas nuevas ni aceptación
dinámica. Este informe complementa VISUAL.md y ACCESSIBILITY.md, no los sustituye.

## Fuentes consultadas

AGENTS.md; SPEC-TI-2026-002 v2.0 extraída de OOXML (RNF-05, RNF-10 y secciones
5.3/5.4); ER_2_Catalogos_SLA_y_configuracion.puml; CLAUDE.md y estados P-11/P-12;
ACCEPTANCE.md, VISUAL.md, ACCESSIBILITY.md y coordinaciones de sus cierres.
No se certifica la presentación del DOCX ni fidelidad píxel a píxel de mockups.

## Implementación entregada

| Hallazgo | Cambio de código | Validación dinámica pendiente |
|---|---|---|
| V-01 | DateInput controlado muestra dd/mm/aaaa, etiqueta explícita, ayuda y error en español. Convierte fechas válidas a ISO YYYY-MM-DD; rechaza días imposibles y considera años bisiestos. ReportFilters/AuditFilters lo consumen. Los borradores inválidos conservan su texto y los schemas de contracts impiden aplicarlos. No cambia API, Zod ni zona horaria. | Editar ambos rangos, fechas imposibles/vacías, teclado y móvil; comprobar petición ISO y límites inclusivos existentes. |
| V-02 | Input file nativo visualmente oculto con sr-only, etiqueta española que abre el selector y contorno en la etiqueta con peer-focus-visible. Nombre seleccionado o «Ningún archivo seleccionado» en español. Conserva accept, disabled, select, errores, tamaño, submit y validación real del servidor. | Tab/Enter/Espacio, cancelación del selector, nombre largo, tipo/tamaño denegados, subida y descarga autorizada; navegador y lector de pantalla. |
| V-05 | QueryBoundary admite emptyState; mantiene carga, error/reintento y datos. Vacíos contextuales de búsquedas/catálogo/vínculos KB, invitaciones CSAT, avisos/tareas y adjuntos. Incluyen explicación y siguiente paso, con enlaces/botón donde procede. | Ejercitar las cuatro situaciones por pantalla y comprobar el anuncio de estados. |
| V-06 | AppShell limita main al contenido, con id estable, tabIndex=-1 y etiqueta. Enlace «Saltar al contenido» visible y operable con teclado. useContentFocus enfoca el contenido tras montar una ruta o cambiar pathname; el montaje posterior a React.lazy también ejecuta el efecto. Consultas, hash y filtros en la misma ruta no son dependencias del efecto. | Foco y scroll reales al entrar/navegar/volver, 360 px y zoom; confirmar lector de pantalla y resolver wrappers administrativos indicados abajo. |

V-03/V-04: se leyeron AssetCustodyHistory y AuditEvents. Conservan las reparaciones
previas (tabla mínimo 640 px/fechas sin división; paginación en grilla con texto
en fila completa). No se reescribieron ni se afirma que su revisión móvil pasó.
SessionPanel, autenticación, logout y router/routes.tsx no se modificaron.

## API de los componentes

- DateInput: label, value y onChange(value: string); admite props de input,
  incluyendo name, onBlur, ref, required, disabled, id y aria-describedby.
  ref apunta al input real (compatible con Controller de React Hook Form).
  value válido se recibe/entrega ISO; texto parcial o inválido permanece en el
  borrador hasta que la validación existente lo rechace. Para opcionales que usan
  null, el consumidor debe adaptar value ?? '' y el vacío a null.
  Es un campo de texto con formato explícito; no incluye selector de calendario.
- EmptyState: title opcional, description opcional y action opcional ReactNode.
  Mensaje con role=status; la acción permanece fuera de la región de anuncio.
- QueryBoundary: emptyState opcional ReactNode, mostrado solo en éxito vacío.
  Consumidores existentes conservan el mensaje predeterminado.
- AppShell: conserva children; contenido principal id=contenido-principal.
- date-input-format.ts: displayDate y parseDate, conversión pura sin locale ni UTC.

## Controles realizados y límites

ESLint focal de todos los TS/TSX de esta entrega: código 0, sin excepciones nuevas.
pnpm --filter web typecheck: código 0 tras las correcciones. La primera corrida
falló por colisión de nombres DateInput/dateInput en Windows; el auxiliar se
renombró date-input-format.ts. Otra corrida vio un error temporal en
ticketDraftStorage.test.ts, propiedad del chat de borrador; no se editó ese archivo.
La última corrida ya incluyó ese archivo sin errores.

No se ejecutaron pnpm test/check/build, integración, recreación de BD, navegador,
CUA ni commits. Los cuatro controles globales y revisión e2e corresponden a Final QA.
No se añadieron paquetes, enums, permisos ni servicios reales.

## Acciones concretas para Final QA / responsables de otras carpetas

1. Migrar fechas nativas aún existentes: admin-identity/components/RolePanel.tsx
   (vigenteDesde/vigenteHasta), MemberPanel.tsx (desde/hasta), y
   calendars/components/HolidaysEditor.tsx (feriados[].fecha). Usar DateInput con
   Controller, preservando schema, ref/onBlur, requeridos y conversión vacío/null.
   No se tocaron por propiedad exclusiva; esta necesidad impide declarar RNF-10
   completamente cerrado. Si necesitan calendario, evaluar la interacción en e2e
   antes de introducir una dependencia o un selector nuevo.
2. Cambiar solo los wrappers main internos a div en catalog/pages/CategoryAdminPage.tsx,
   calendars/pages/CalendarsPage.tsx y parameters/pages/ParametersPage.tsx:
   el main de AppShell ya contiene estas páginas. Sin este ajuste hay landmarks
   principales anidados en esas tres rutas. Se detectó por búsqueda de fuentes,
   no por navegador. SurveyPage/AvailabilityPage tienen main propio fuera del shell;
   deben conservarlo.
3. Repetir V-01–V-06 en escritorio/360 px, validar flujo por teclado, encuestas
   reales disponibles del prototipo, zoom y lector de pantalla. Registrar evidencia
   sin convertir la compilación en aceptación humana.
4. Consolidar PROGRESS/DECISIONS/ACCEPTANCE y commits en Final QA. Ninguno de esos
   archivos fue editado por esta sesión.

Estado: COMPLETO CON LIMITACIÓN
