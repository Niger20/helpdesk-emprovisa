# Protocolo de aceptación por usuarios

Preparado el 14/10/2026, America/Managua. **Pendiente de ejecución humana.**
Basado en la sección 5.5 de SPEC-TI-2026-002 y adaptado al prototipo LOCAL
autorizado. Las pruebas técnicas no completan este registro.

## Preparación del observador

Usar datos ficticios, API y web locales, PostgreSQL existente y las cuentas
del [README](../../README.md). No recrear helpdesk ni restaurar la seed para
ocultar resultados. Seguir [demostración](demostracion.md) y consultar
[aceptación técnica](../quality/ACCEPTANCE.md) antes de empezar.
Registrar navegador y versión, ancho, zoom, fecha/hora y commit probado.
El correo se demuestra como aviso simulado; la VPN y producción están fuera
del alcance. No guardar cookies, tokens, contraseñas ni datos reales en el acta.

Participantes: dos solicitantes, dos analistas y el jefe de TI. Cada uno
ejecuta cuatro tareas sin ayuda. El observador anota dudas y dificultades,
sin indicar dónde hacer clic; cualquier ayuda se registra como tal.
Los números de ticket se anotan después de crearlos, sin asumir una secuencia.

## Tareas por perfil

| Perfil | Tarea 1 | Tarea 2 | Tarea 3 | Tarea 4 |
|---|---|---|---|---|
| Solicitante A | Crear un incidente de correo y explicar prioridad/plazos | Buscarlo y agregar respuesta pública/adjunto ficticio | Revisar solución y confirmar cierre | Abrir invitación válida y responder CSAT |
| Solicitante B | Crear hardware eligiendo activo de su sede | Recuperar/descartar un borrador tras recarga | Consultar artículo público y votar utilidad | Encontrar sus avisos y comprobar acceso solo a sus casos |
| Analista A, N1 | Ubicar/tomar caso elegible e iniciar atención | Registrar respuesta pública y nota interna | Registrar por teléfono a nombre de otro solicitante de su sede | Escalar un caso con grupo y motivo |
| Analista B, N2 | Tomar/atender el caso escalado elegible | Pausar por repuestos y reanudar con motivo | Registrar solución sin resolver un caso propio | Consultar activo, historial y conocimiento vinculado |
| Jefe de TI | Consultar/reasignar un caso a candidato elegible | Consultar matriz/plazos y explicar valores normativos fijos | Filtrar reportes y exportar cohorte | Consultar/verificar cadenas de auditoría |

Preparar los estados previos mediante acciones normales y los escenarios
ficticios existentes. Las tareas de solución/cierre requieren cuentas distintas
del solicitante técnico por RN-05. El escenario N2 usa una cuenta autorizada
del grupo escalado. No forzar estados por SQL ni cambiar el reloj.
Para comprobar teclado, realizar un recorrido completo con Tab, Mayús+Tab,
Enter, Espacio y flechas; registrar ayudas y fallos de foco. Repetir tareas
relevantes a 360 px y con zoom; registrar por separado lector de pantalla real
cuando esté disponible, sin inferir anuncios desde el DOM.

## Hoja de resultados, una por participante

Identificador ficticio del participante: ______. Perfil: ______.
Fecha/hora Managua: ______. Observador: ______. Commit: ______.
Navegador/versión: ______. Ancho/zoom: ______. Método de entrada: ______.

| Tarea | Inicio | Fin | Duración | Resultado | Duda, ayuda o hallazgo | Ticket/evidencia |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

Resultado: completó / completó con dificultad / no completó.
Clasificación del hallazgo: bloqueante / importante / menor.
Registrar reproducción, resultado esperado, observado y responsable; los
bloqueantes requieren corrección y repetición antes de aceptar la capacidad.
Las otras diferencias quedan explícitas en el backlog o acta de alcance.

## Acta de decisión, sin completar por el agente

Cinco hojas adjuntas: ______. Hallazgos corregidos y repetidos: ______.
Hallazgos pendientes y efecto en la demostración: ______.
Diferencias de alcance aceptadas por el responsable: ______.
Decisión: pendiente / aceptado con reservas / aceptado / rechazado.
Product Owner o responsable autorizado, fecha y firma: ______.

RF-19 conserva matriz/plazos por AGENTS; CU-01 exige activo del catálogo,
sin regularización patrimonial por texto libre. Los demás límites exactos
se toman de ACCEPTANCE.md vigente. Una decisión humana puede registrar esas
reservas; este protocolo preparado no declara que hayan sido aceptadas.
