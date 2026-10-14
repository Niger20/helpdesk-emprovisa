# Ejecución del prototipo local

El objetivo vigente es demostrar el flujo en la computadora del usuario.
API Fastify y frontend Vite corren en el host. Se reutiliza el contenedor
Postgre (PostgreSQL 18.1), con helpdesk y helpdesk_test y los tres roles del
proyecto. Las demás bases del usuario se conservan.

## Iniciar en esta máquina

```powershell
docker start Postgre
pnpm install --frozen-lockfile
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm dev
```

Abrir http://127.0.0.1:5173/login. Usar cualquiera de las cuentas locales del
README con EmprovisaDemo!2026. La cookie funciona en HTTP local y la sesión
se conserva al recargar. Cerrar la sesión desde la pantalla principal.

.env contiene PORT, CORS_ORIGINS, las tres conexiones, STORAGE_DIR y
CSRF_SECRET. Está excluido de Git. La API usa pools de aplicación/lectura
de 10/3; migraciones y seed usan el rol migrator. El puerto actual es 3000.

## Base nueva en otra computadora

Copiar los ejemplos de entorno, generar contraseñas para los roles y el
secreto CSRF, y ajustar las conexiones. El Compose de un solo servicio es
una alternativa para iniciar PostgreSQL 15.19 en un puerto disponible:

```sh
docker compose --env-file .env.db up -d postgres
```

El init solo se ejecuta con un directorio de datos vacío. El contenedor
existente de esta máquina ya ocupa 5432; no iniciar allí otro Compose.

## Validar

```powershell
pnpm check
```

Las pruebas recrean exclusivamente public en helpdesk_test, aplican todas
las migraciones y cargan la seed. Si trabajan dos sesiones a la vez,
coordinar las pruebas de integración para no recrear la misma base durante
la corrida de la otra sesión.

Railway queda como posibilidad posterior. Esta etapa no crea recursos ni
publica la aplicación; el trabajo se concentra en completar el flujo local.