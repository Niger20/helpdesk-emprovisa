# Ejecución del prototipo local

Revisión: 14/10/2026. El objetivo vigente es demostrar el flujo en la computadora del usuario.
API Fastify y frontend Vite corren en el host. Se reutiliza el contenedor
Postgre (PostgreSQL 18.1), con helpdesk y helpdesk_test y los tres roles del
proyecto. Las demás bases del usuario se conservan.

## Iniciar en esta máquina

```powershell
# Solo si el contenedor existente está detenido:
docker start Postgre
pnpm install --frozen-lockfile
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev
```

Abrir http://127.0.0.1:5173/login. Usar cualquiera de las cuentas locales del
README. La cookie funciona en HTTP local y la sesión
se conserva al recargar. Cerrar la sesión desde la pantalla principal.

.env contiene PORT, CORS_ORIGINS, las tres conexiones, STORAGE_DIR y
CSRF_SECRET. Está excluido de Git. La API usa pools de aplicación/lectura
de 10/3; migraciones y seed usan el rol migrator. El puerto actual es 3000.

Node.js 24.21.0 y pnpm 11.25.0 están fijados. Vite hace proxy de /api y /health;
al cambiar PORT, ajustá también apps/web/vite.config.ts y CORS_ORIGINS.
STORAGE_DIR debe quedar fuera de la raíz web; preferí una ruta absoluta.
Para detener desarrollo, Ctrl+C. Tras actualizar, aplicá migraciones y reiniciá.
La seed no reemplaza datos ni restaura los escenarios de una demo ya ejecutada.

## Base nueva en otra computadora

Copiar .env.example y .env.db.example a sus archivos locales, generar contraseñas
propias para los roles y el secreto CSRF, ajustar las conexiones y elegir
DB_DATA_DIR vacío. El Compose de un solo servicio es
una alternativa para iniciar PostgreSQL 15.19 en un puerto disponible:

```sh
docker compose --env-file .env.db up -d postgres
```

El init solo se ejecuta con un directorio de datos vacío. El contenedor
existente de esta máquina ya ocupa 5432; no iniciar allí otro Compose.
Esta alternativa no reemplaza el PostgreSQL 18.1 autorizado. API y web siguen
en el host; no uses un superusuario para sus conexiones.

## Validar

```powershell
pnpm check
```

Las pruebas recrean exclusivamente public y helpdesk_queue en helpdesk_test, aplican todas
las migraciones y cargan la seed. Si trabajan dos sesiones a la vez,
coordinar las pruebas de integración para no recrear la misma base durante
la corrida de la otra sesión.

Durante el cierre coordinado solo Aceptación final ejecuta controles globales
y commits. Tampoco ejecutar integración junto con k6, que usa helpdesk_test.
Esta guía no afirma que la aceptación final haya pasado.

Consultar [manuales](manuals/README.md), [operación/desarrollo](manuals/operacion-local.md),
[demostración](manuals/demostracion.md) y [seguridad/limitaciones](manuals/seguridad-limitaciones.md).

Railway queda como posibilidad posterior. Esta etapa no crea recursos ni
publica la aplicación; el trabajo se concentra en completar el flujo local.
Correo e integraciones se simulan; no se requieren LDAP/AD, SMTP/IMAP,
nginx, systemd, NAS ni infraestructura institucional para demostrar.
