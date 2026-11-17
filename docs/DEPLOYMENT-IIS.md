# Despliegue de IngSoft.Api en IIS

Esta guía prepara la API para publicarse como una aplicación IIS llamada `/api`. No ejecuta el despliegue ni modifica SQL Server, IIS, Cloudflare o el frontend.

## Modelo de rutas

Los controladores conservan sus rutas de código `api/...`. En desarrollo local la opción `Routing:StripApiPrefixWhenHostedUnderApi` permanece en `false`, por lo que las rutas públicas son:

- `http://localhost:<puerto>/api/server/status`
- `http://localhost:<puerto>/api/clientes`
- `http://localhost:<puerto>/swagger/index.html`

Cuando IIS aloja el proyecto como aplicación `/api`, IIS aporta `PathBase=/api` y `web.config` activa `Routing__StripApiPrefixWhenHostedUnderApi=true`. La convención MVC elimina solamente el primer segmento interno `api`; así, las rutas públicas siguen siendo:

- `https://<dominio>/api/server/status`
- `https://<dominio>/api/clientes`
- `https://<dominio>/api/swagger/index.html`

No se debe agregar `UsePathBase("/api")` a `Program.cs` ni configurar la aplicación IIS en la raíz con esa opción activa. Cualquiera de esas combinaciones duplicaría o desplazaría el prefijo.

## Requisitos del servidor

1. Instalar el Hosting Bundle de .NET 8 para IIS.
2. Crear un Application Pool dedicado con:
   - `.NET CLR version`: `No Managed Code`.
   - Pipeline: `Integrated`.
   - Identidad con permisos de lectura y ejecución sobre la publicación.
3. Crear en IIS una aplicación con alias `api`, asociada al Application Pool anterior.
4. Conceder a la identidad del Application Pool permiso de modificación sobre `C:\WebApps\Seminario\Logs`.
5. Confirmar conectividad TCP y credenciales desde el servidor IIS hacia SQL Server. Si SQL Server está en Ubuntu/SQL Server Express, debe aceptar conexiones remotas en su puerto configurado y el firewall debe permitir únicamente al servidor necesario.

## Publicación

Desde la raíz del repositorio:

```powershell
dotnet restore backend\IngSoft.sln
dotnet test backend\IngSoft.sln -c Release --no-restore
dotnet publish backend\IngSoft.Api\IngSoft.Api.csproj -c Release --no-restore -o C:\Publicaciones\IngSoft.Api
```

Copiar el contenido publicado a una carpeta versionada, por ejemplo `C:\WebApps\Seminario\Api\releases\20261117-01`, y apuntar la aplicación IIS a esa carpeta. Conservar la versión anterior para rollback.

El `web.config` incluido usa ASP.NET Core Module en modo `inprocess`, activa el comportamiento de subaplicación `/api` y establece el directorio de logs de IIS.

## Configuración de producción

Configurar secretos y valores propios del ambiente mediante variables de entorno del Application Pool, IIS Configuration Editor o un mecanismo seguro. No guardar credenciales reales en Git.

| Variable | Valor orientativo |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `Routing__StripApiPrefixWhenHostedUnderApi` | `true` |
| `InternalLogging__Directory` | `C:\WebApps\Seminario\Logs` |
| `InternalLogging__RetentionDays` | `30` |
| `InternalLogging__FileSizeLimitBytes` | `10485760` |
| `InternalLogging__MinimumLevel` | `Information` |
| `ConnectionStrings__DefaultConnection` | Cadena de SQL Server del ambiente, sin publicarla |
| `AllowedOrigins__0` | URL HTTPS real del frontend |

Se pueden agregar más orígenes como `AllowedOrigins__1`, `AllowedOrigins__2`, etc. En producción no deben conservarse orígenes que no sean necesarios.

Para Vite, construir el frontend con:

```dotenv
VITE_API_URL=/api
```

No es necesario modificar los servicios JavaScript: el navegador conservará el dominio público y antepondrá `/api`.

## Logging

La aplicación escribe mediante `ILogger<T>` y Serilog:

- Actividad y validaciones: `C:\WebApps\Seminario\Logs\IngSoft_Log_yyyyMMdd.log`.
- Excepciones: `C:\WebApps\Seminario\Logs\IngSoft_Error_yyyyMMdd.err`.

Los archivos rotan diariamente y también al superar el tamaño configurado, conservan 30 días y permiten escritura compartida. Cada solicitud registra fecha/hora UTC, método, endpoint, estado HTTP, duración, rutina y `TraceId`. No se registran cuerpos, contraseñas, tokens ni cadenas de conexión.

Un error de escritura del sink no debe interrumpir la operación de negocio. Aun así, conviene monitorear permisos y espacio libre porque un fallo de disco podría impedir conservar evidencia diagnóstica.

`stdoutLogEnabled` queda en `false`. Para diagnosticar exclusivamente un fallo de arranque puede activarse temporalmente, crear la carpeta indicada, reproducir el problema y volver a desactivarlo.

## Validación posterior

Después de reciclar el Application Pool, comprobar:

```text
GET https://<dominio>/api/server/status
GET https://<dominio>/api/server/date
GET https://<dominio>/api/swagger/index.html
GET https://<dominio>/api/swagger/v1/swagger.json
```

Resultados esperados:

- Las dos rutas de servidor responden `200`.
- Swagger UI y su JSON responden `200` bajo `/api`.
- `/api/api/server/status` responde `404`.
- Una petición produce una entrada en el log de actividad con su `TraceId`.
- Una excepción controlada de prueba produce una entrada correlacionada en el archivo `.err` sin exponer el body.
- El frontend puede consultar la API sin errores CORS.

Si existe un proxy o Cloudflare por delante, validar el resultado mediante el dominio público y también directamente contra IIS. La aplicación no confía actualmente en encabezados reenviados para tomar decisiones de rutas o seguridad.

## Rollback

1. Detener o poner fuera de línea únicamente la aplicación `/api`.
2. Volver a seleccionar como ruta física la carpeta de la publicación anterior.
3. Restaurar las variables de entorno de esa versión si cambiaron.
4. Iniciar o reciclar el Application Pool.
5. Repetir las comprobaciones de estado y Swagger.

Este rollback afecta solamente los binarios y la configuración de la API. No ejecutar migraciones ni revertir datos como parte de este procedimiento; esta preparación no modifica el esquema de la base de datos.
