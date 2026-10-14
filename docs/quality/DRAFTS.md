# Borrador local de nuevo requerimiento — CU-01

Fecha: 14/10/2026, America/Managua.

CU-01, excepción 5a del DOCX SPEC-TI-2026-002 v2.0, pide conservar el
borrador cuando falla la conexión al guardar. Se leyó por extracción OOXML;
no se acredita revisión de presentación del documento. También se consultaron
AGENTS.md, ER de núcleo, mockup P-03 y ACCEPTANCE/VISUAL/ACCESSIBILITY.
El ER conserva el ticket como registro del servidor: el borrador no añade tablas,
no genera número de ticket y no registra bitácora antes de crear el caso.

## Comportamiento implementado

- Guarda automáticamente las ediciones del formulario en localStorage,
  en una clave versionada por idUsuario de la sesión actual.
- Recupera al recargar o volver a abrir Nuevo requerimiento, incluso campos
  incompletos; el schema local deriva de ticketCreateSchema, conserva sus enums
  y relaja únicamente campos incompletos propios de un borrador.
- Comprueba la identidad de la envoltura, versión, esquema y antigüedad.
  JSON corrupto, versión desconocida, identidad distinta o fecha inválida se
  descartan; el fallo de almacenamiento se informa sin bloquear el formulario.
- Al recuperar, elimina selecciones retiradas o incompatibles de categoría,
  solicitante y activo; un activo de otra sede se elimina. Antes de registrar,
  vuelve a consultar opciones mediante TanStack Query y valida las selecciones.
  Las reglas y permisos del servidor siguen siendo la autoridad final.
- Una referencia de origen explícita en la URL prevalece al recuperar un
  borrador anterior. El número se valida con contracts al enviar.
- Una creación exitosa elimina el borrador. Un error conserva texto y selecciones
  para corregir/reintentar; no hay reintento automático del POST.
- «Descartar borrador y vaciar formulario» elimina la copia y reinicia RHF.
  El botón se deshabilita mientras se registra; su altura mínima es 44 px.
  El aviso es español, utiliza role=status y explica alcance y conservación.
  Errores de selecciones se registran en RHF y se enfoca el primer campo.

## Política local de privacidad y retención

Esta política es una decisión técnica del prototipo, no un requisito institucional
ni un dictamen legal. Un borrador caduca a las 24 horas desde su última edición;
la comprobación y eliminación ocurren al abrir el formulario. No existe un
proceso que borre archivos del navegador mientras la aplicación está cerrada.
El usuario puede eliminarlo inmediatamente con Descartar o con los controles
de almacenamiento del navegador. La copia se elimina tras crear el caso.

Solo se admite el objeto del formulario: no se guardan cookies, tokens CSRF,
contraseñas de sesión ni archivos adjuntos. El texto libre puede contener
información que escriba el usuario: el aviso pide no incluir secretos.
No se copia nombre/correo del solicitante ni datos completos del activo.
localStorage no cifra el contenido ni lo oculta a personas con acceso al perfil
del navegador. La separación por usuario impide recuperación cruzada en la UI;
no constituye aislamiento frente al propietario del equipo o scripts del origen.

Se publica clearTicketDraft(idUsuario) en el index del feature para que Final QA
pueda conectar la limpieza al logout exitoso desde el hook de autenticación,
fuera de la propiedad de esta sesión. La implementación aquí conserva el
borrador del usuario en su clave al salir de sesión hasta caducar/descartar;
otra cuenta no lo recupera. La decisión/integración final corresponde a Final QA.
Las pestañas simultáneas del mismo usuario comparten una única copia; prevalece
la última edición. No se implementa fusión ni control de versiones entre pestañas.

## Evidencia ejecutada y límites

`pnpm exec vitest run apps/web/src/features/tickets/lib/ticketDraftStorage.test.ts
apps/web/src/features/tickets/lib/ticketDraftOptions.test.ts`: código 0,
12 pruebas en dos archivos. Incluyen campos incompletos, identidad cruzada,
envoltura manipulada, JSON/enums corruptos, 24 horas/fecha futura, limpieza,
rechazo de campos ajenos, almacenamiento denegado/cuota, catálogo retirado,
tipo incompatible, activo obligatorio y activo de otra sede.

ESLint focal sobre los archivos TS/TSX propios: código 0.
`pnpm --filter web typecheck`: código 0 después de las correcciones.
La primera corrida encontró errores propios corregidos y archivos de fecha
en edición paralela; la comprobación final ya pasó.

No se ejecutó pnpm test/check global, build, integración de BD, navegador ni
revisión dinámica de teclado/recarga/cerrar-abrir. Las pruebas puras no acreditan
un flujo completo de React, un fallo real de red ni creación HTTP exitosa.
Final QA deberá ejecutar los cuatro controles globales y la sesión de aceptación
deberá comprobar recuperación y envío en navegador. No hay aceptación humana
ni medición visual inventada.

Estado: COMPLETO CON LIMITACIÓN
