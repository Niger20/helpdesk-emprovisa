# Adjuntos: coordinación

Implementado dentro de los archivos exclusivos asignados; listo para integración del coordinador.

## Necesidades compartidas detectadas
- ER incluye `ticket_adjuntos.hash_sha256`, pero la migración inicial y el tipo generado lo omiten. El coordinador debe agregar migración y actualizar tipo generado (hashSha256 string). El repositorio de adjuntos escribirá este campo.
- Agregar parámetro `adjunto.maximo_bytes` ENTERO con valor inicial `10485760` (P-03/P-05: JPG, PNG, PDF, 10 MB). Sin parámetro válido el servicio deniega subidas.
- Exportar attachments.ts desde contracts/index.ts y construir contracts.
- Exportar ticketScope y requireTicketPermission desde tickets/index.ts.
- Registrar @fastify/multipart antes de las rutas; integrar createAttachmentsService y registerAttachmentsRoutes con STORAGE_DIR.
- Componer TicketAttachments en detalle, con numero y estado.
- Especificación: auditor consulta bitácora sin contenido de adjuntos. Descarga exige ticket.ver y una capacidad operativa de tickets; el auditor de solo lectura queda excluido. Listado solo metadatos públicos.

## Alcance
Subida independiente (sin idComentario; campos multipart adicionales rechazados). Listado/descarga también protegen datos existentes ligados a comentarios internos: nunca visibles al solicitante aunque tenga permisos de analista. Los casos CERRADO/CANCELADO no admiten subidas. Se bloquea ticket, incrementa versión y escribe metadatos/bitácora en una transacción. Limpieza del archivo al fallar transacción; un corte de proceso puede dejar archivos huérfanos, sin garantía distribuida.

## Verificación
ESLint acotado de todos los archivos propios: verde. Pruebas unitarias de almacenamiento: 3/3 verdes. Contrato attachments.ts verificado con TypeScript estricto individual: verde. Las pruebas unitarias del servicio esperan export/build de contracts; no se ejecutó integración ni pnpm test/check global. Typecheck de API/web se intentó: contracts todavía no exporta attachments y falta hashSha256 en tipo generado. Los errores propios adicionales detectados se corrigieron; errores concurrentes de ciclo de tickets se dejan a su propietario. El coordinador integra attachmentsChecks(database, env).

## API pública y composición
- `createAttachmentsService(database, storageDir)`, `registerAttachmentsRoutes(app, service)`, tipo `AttachmentsService` desde attachments/index.ts.
- GET `/api/v1/tickets/:numero/adjuntos`: `{ data, maximoBytes, puedeDescargar }`, permiso ticket.ver + alcance.
- POST misma ruta: multipart/form-data, exactamente un campo archivo, sin otros campos; devuelve Adjunto 201; permiso ticket.adjuntar + ticket.ver + alcance; CSRF usa plugin existente. El límite del plugin global no debe convertir cuerpo a JSON ni ser inferior al parámetro; request.parts recibe límites por solicitud.
- GET `/api/v1/tickets/:numero/adjuntos/:idAdjunto`: Buffer con MIME real y Content-Disposition attachment; sin schema JSON de salida. Denegación 403 al auditor con los permisos actuales, 404 al adjunto invisible o de otro caso.
- `TicketAttachments({ numero, estado })` desde components/attachments/TicketAttachments.tsx. QueryBoundary presenta carga/vacío/error/datos; formulario sólo al tener permiso y caso abierto. Descarga por endpoint autorizado del mismo origen.
- Subida incrementa versión bajo bloqueo (sin versión enviada, operación aditiva); hook invalida ticket/operación/adjuntos tras éxito. La lista no revela autor, hash, UUID, ruta ni contenido/id de comentarios.
- Alta inicial pendiente de composición por coordinador: crear ticket primero y subir archivo con el número devuelto. Esta fase sólo integra panel del detalle, conforme propiedad exclusiva. No se promete transacción entre alta de ticket y archivo.

## Archivos
- contracts/attachments.ts: MIME permitido, DTO, listado y schema de formulario.
- API attachments: index, routes, multipart, service, repository, mapper y prueba del servicio.
- infra/storage: local-storage.ts y prueba de integridad/nombre/disposición/raíces.
- web: attachments.api.ts, useTicketAttachments.ts, TicketAttachments.tsx.
- test/attachments-checks.ts: suite exportada de HTTP/BD, sin reconstruir base ni migrar/seed.

La suite HTTP crea almacenamiento temporal propio por prueba, lo elimina verificando ruta y restaura parámetro de tamaño. Construye buildApp sin adjuntos y registra multipart/rutas antes de iniciar; si buildApp registra multipart incondicionalmente, quitar el segundo registro en esta suite. Si buildApp recibe servicio opcional de adjuntos, puede mantenerse la construcción sin dicho servicio y registrar rutas manualmente como ahora.

## Integración coordinadora completada
Migración 015 agrega hash_sha256 y adjunto.maximo_bytes; aplicada en helpdesk y tipos
regenerados. Contratos exportados, multipart registrado al proporcionar el servicio,
rutas y panel del detalle compuestos; cache del ciclo también se invalida al subir.
attachmentsChecks conectado a integración central. pnpm check pasó con 190 pruebas.
Revisión visual pendiente por fallo de inicialización del navegador automatizado.
