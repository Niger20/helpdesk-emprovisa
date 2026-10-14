# Utilidad y vínculos de conocimiento

Fuentes: AGENTS.md, DOCX SPEC-TI-2026-002 (RF-09/E-04), ER completo (kb_votos y ticket_articulos), P-07.

Implementación terminada en contratos knowledge.ts; API knowledge/feedback.repository/service/routes; API pública authorizeKnowledgeTicket en tickets/index; UI knowledge-base/api/hooks/components; helper knowledge-feedback-checks.ts.

Integración: registerKnowledgeRoutes registra las cinco rutas nuevas automáticamente y createKnowledgeService incluye feedback/vote/links/link. No cambiar main/app. Los contratos ya salen del export existente knowledge.js. El coordinador debe importar y llamar knowledgeFeedbackChecks(database, env) en el helper global, actualizar PROGRESS/DECISIONS y ejecutar los cuatro controles. Esta sesión no recrea helpdesk_test ni hace commits.

Decisiones conservadoras para trasladar a DECISIONS:
- kb_votos es booleano, PK artículo/usuario, comentario opcional de 300 caracteres. PUT actualiza un solo voto; repetición exacta no escribe ni audita. Totales agregados; comentario solo para el autor.
- kb.ver autoriza lectura. Votar requiere además ticket.crear (capacidad presente en usuarios operativos, ausente del auditor); no se inventa permiso ni se comprueba un rol en código. Falta permiso específico de voto en ER/spec. La UI usa esa misma capacidad.
- Vincular requiere kb.ver y ticket.atender con alcance de sede verificado en servicio público de tickets, incluyendo grupos vigentes. Solo artículos publicados. Se impiden cambios en CERRADO/CANCELADO; RESUELTO permite documentar resolución. Desvincular conserva esos controles, pero admite artículos archivados visibles.
- uso es varchar(10) libre en ER, sin enum ni lista normativa. Se valida texto de 1–10 caracteres y la UI propone «consulta» editable. No se inventa un catálogo.
- El vínculo no almacena versión en ER. No modifica versiones de artículo ni versión de ticket. Se bloquea ticket y artículo en transacción; votos serializados por artículo y PK. Auditoría por operación solo contiene identificadores, sin comentario/contenido/uso; el vínculo también escribe bitácora de ticket (evento interno). Fallar cualquiera revierte el cambio.
- Lista de vínculos filtra cada ticket con authorizeKnowledgeTicket, que reutiliza repository/find y ticketScope reales por API pública. No entrega ids internos, títulos, solicitantes ni notas. Puede requerir optimización si crece mucho (prototipo local).

Controles focales: contracts build, ESLint de archivos propietarios, typecheck api y web en verde antes del helper. Pruebas de integración preparadas; ejecución exclusivamente del coordinador.

Integración global completada por coordinador: 282 pruebas en 21 archivos y los
cuatro controles en verde; build 295,11 KB gzip. Prueba HTTP local confirmó voto
repetido sin cambio, vínculo a TK-000015 y ambas cadenas íntegras. Los vínculos
también registran bitácora del ticket en la misma transacción. Decisión D-022.
