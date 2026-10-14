# Calendarios y ciclos SLA — 14/10/2026

Fuentes: RF-19/RN-09, ER calendarios_laborales/horarios_laborales/feriados, P-09.
Contracts calendars.ts; settings/calendars con repository/service/routes/mapper/
policies/domain; feature calendars con forms y bindings; calendarsChecks y cinco
pruebas de configuración. Ruta /administracion/calendarios, permiso global.

Tickets calendar-sla.repository captura calendario en bitácora por ciclo; todos
los consumidores del ciclo usan esa fotografía. Reapertura valida plazo con el ciclo
cerrado y calcula el nuevo con configuración vigente. Portal/correo y seed capturan
en transacción. Migración 022 protege ciclos anteriores y añade índice parcial.
Sin tablas nuevas, reescritura de evidencia ni cambios de plazos. D-023.

Integración final: pnpm check, 301 pruebas en 22 archivos, 302,51 KB gzip.
HTTP local confirmó horario partido/feriado asignado a Managua, plazo previo
conservado y cadenas íntegras. Revisión visual pendiente.
