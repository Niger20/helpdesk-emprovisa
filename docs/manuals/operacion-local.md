# Operación y desarrollo local

Revisión: 14/10/2026. Ejecutá los comandos desde la raíz del repositorio.
Node.js 24.21.0 y pnpm 11.25.0 están fijados en `package.json` y lockfile;
pnpm obtiene el runtime del proyecto sin reemplazar el Node global.
Fastify y Vite corren en el host. La computadora reutiliza el contenedor
**Postgre**, PostgreSQL 18.1, con `helpdesk` y `helpdesk_test`.

## Preparación y arranque

1. Comprobá que el contenedor Postgre existente está en ejecución. Si está detenido,
   `docker start Postgre` lo inicia. No reemplaces el contenedor ni otras bases.
2. Conservá el `.env` local existente. En una instalación nueva, copiá `.env.example`
   a `.env` y completá las tres conexiones y CSRF_SECRET con valores propios;
   nunca publiques ni copies las credenciales de esta máquina al manual.
3. Usá `helpdesk_app`, `helpdesk_readonly` y `helpdesk_migrator`, todos en la misma
   base `helpdesk` y servidor. Esas bases y roles deben existir previamente.
4. Configurá STORAGE_DIR fuera de `apps/web/public` y de toda raíz estática.
   Una ruta relativa como `.data/uploads` se resuelve desde el directorio de trabajo
   del proceso API; preferí una ruta absoluta para ubicarla sin ambigüedad.
5. Instalá dependencias, aplicá migraciones y cargá los datos ficticios:

```powershell
pnpm install --frozen-lockfile
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev
```

Abrí `http://127.0.0.1:5173/login`. API: `http://127.0.0.1:3000`;
`/health` comprueba los pools de aplicación y lectura. `/disponibilidad`
ofrece consulta desde la aplicación autenticada. `pnpm dev` compila contracts
y levanta API/Vite; mantené esa terminal abierta. Para detenerlos, usá Ctrl+C.
pg-boss arranca con la API, usando el esquema `helpdesk_queue` y las tareas activas.

La seed es local e idempotente: no reinicia la demostración, cambia contraseñas
ni reemplaza datos anteriores. Repetirla no devuelve los tickets a sus estados
iniciales. No borres la base para repetir un recorrido: creá otro caso ficticio.

## Actualizar y comprobar

Después de actualizar código, detené `pnpm dev`, instalá si cambió el lockfile,
aplicá `db:migrate` y reiniciá. Los cambios de contracts requieren recompilación;
el nuevo arranque la hace. `pnpm --filter api db:codegen` regenera los tipos de BD
para desarrollo; revisá sus cambios antes de incorporarlos a Git.

Los cuatro controles oficiales son:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` los ejecuta en ese orden. **Las pruebas de integración recrean public
y helpdesk_queue en helpdesk_test**, aplican migraciones y seed. Leen `.env` y
cambian únicamente el nombre de base de las tres conexiones a `helpdesk_test`.
Verifican la base antes de borrar esquemas; no reutilices helpdesk_test para datos
que quieras conservar. No ejecutes integración en paralelo con carga o con otra sesión.
Durante el cierre coordinado, solo el chat de Aceptación final ejecuta estos controles;
este manual no constituye evidencia de haberlos ejecutado.

`pnpm build` genera artefactos y verifica el presupuesto de tamaño; no publica
la aplicación. Para carga local usá el [procedimiento k6](../../ops/perf/README.md)
y sus límites; también utiliza helpdesk_test y requiere ejecución exclusiva.

## Configuración y diagnóstico

| Situación | Comprobación y acción |
| --- | --- |
| Configuración inválida al arrancar | Revisá los nombres de campos informados y `.env.example`; las URL deben usar el rol y la base correctos |
| `/health` falla | Revisá contenedor, puerto, base y acceso de app/readonly; no sustituyas las URL por un superusuario |
| API no responde o puerto ocupado | Revisá la terminal de desarrollo; evitá dos API en el mismo puerto |
| Cambiaste PORT | Actualizá también el proxy `/api` y `/health` en `apps/web/vite.config.ts`, CORS_ORIGINS y reiniciá |
| Login bloqueado | Esperá la duración configurada tras cinco fallos; no alteres intentos_login para una demo |
| Guardado rechazado por CSRF | Recargá/iniciá sesión; no desactives el plugin ni pegues tokens en Git |
| Adjunto rechazado | Usá JPG/PNG/PDF real, dentro del máximo vigente; verificá permisos de escritura de STORAGE_DIR |
| Job en ERROR o PARCIAL | Jefatura/auditor consultan `/avisos`; revisá logs JSON y destino elegible, sin cambiar bitácora |

HOST admite `127.0.0.1`; CORS_ORIGINS usa orígenes exactos separados por comas,
sin rutas ni comodines. Usá consistentemente el mismo origen del navegador.
Las tres conexiones no deben apuntar a servidores o bases diferentes.
Pools de aplicación y lectura: 10 y 3; la cola posee su conexión propia.

La alternativa para una base nueva está en [docs/deploy.md](../deploy.md).
No hay servicios del sistema, servidor web frontal ni despliegue externo en esta etapa.
