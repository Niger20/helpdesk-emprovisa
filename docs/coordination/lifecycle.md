# Ciclo de tickets y adjuntos — dos sesiones

Esta sesión implementa reclasificación, escalamiento manual, pausa/reanudación,
resolución, cierre por solicitante, cancelación y reapertura con sus formularios,
control de versión, transacciones y pruebas. Jobs/cierre automático y asignación
automática siguen siendo una fase posterior.

La sesión 01a13882-0c8e-7592-af12-39e3f76e25bf implementa attachments API/storage,
sus contratos, hooks/componentes y pruebas reutilizables. Esta sesión integra
exports, plugins/rutas, env/config, detalle del ticket y suite global. Ninguna
otra sesión recrea helpdesk_test. Se reutiliza Postgre y el prototipo sigue local.

API pública ticketScope/requireTicketPermission exportada para que los adjuntos
usen la visibilidad existente sin duplicar reglas de alcance.

Entregas integradas: contracts y rutas, multipart, STORAGE_DIR, migración 015,
tipos regenerados, paneles de ciclo/adjuntos y ambas suites. pnpm check pasó
con 190 pruebas; revisión visual pendiente por fallo del entorno de cua.
PROGRESS y D-012/D-013 registran alcance, ambigüedades y trabajo pendiente.
