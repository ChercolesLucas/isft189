# IngSoft API

API REST ASP.NET Core .NET 8 para IIS y SQL Server.

1. La configuración actual usa `(localdb)\\MSSQLLocalDB`, autenticación Windows y la base `SistemaPedidos`.
2. Si la base todavía no existe, ejecutar `database/01_create_database.sql` en SQL Server.
3. Desde `backend/IngSoft.Api`, ejecutar `dotnet restore` y `dotnet run`.
4. Abrir `http://localhost:5080/swagger`.

## Login simple

Ejecutar `database/07_create_usuarios.sql` sobre `SistemaPedidos` y agregar un usuario desde SSMS:

```sql
INSERT INTO dbo.Usuarios (nombre, correo, contrasena)
VALUES ('Usuario Ventas', 'ventas@sistema.com', '1234');
```

El inicio de sesión utiliza `POST /api/auth/login`. Está pensado únicamente para la demostración institucional: la contraseña se guarda en texto plano y no se utiliza JWT.

Para producción, agregar los dominios permitidos en `AllowedOrigins`.

## Logging de la API

La API genera dos archivos diarios, sin exponerlos mediante endpoints:

- `IngSoft_Api_Log_yyyyMMdd.log`: solicitudes HTTP, nivel, rutina, método, endpoint, estado, duración y `TraceId`.
- `IngSoft_Api_Error_yyyyMMdd.err`: excepciones no controladas con su `TraceId` y detalle técnico.

La configuración se encuentra en `appsettings.json` y puede sobrescribirse mediante `appsettings.Development.json` o variables de entorno:

```json
"FileLogging": {
  "Enabled": true,
  "Directory": "logs",
  "RetentionDays": 30,
  "FileSizeLimitBytes": 10485760
}
```

Una ruta relativa se resuelve junto a la aplicación publicada. Para IIS se recomienda configurar una ruta externa, por ejemplo `D:\\IngSoft\\Logs`, y otorgar permisos de escritura/modificación a la identidad del Application Pool que ejecuta la API. Si no puede escribirse un archivo, la API continúa funcionando y solo informa el fallo mediante `ILogger`.

El middleware no registra cuerpos de requests, respuestas, contraseñas, tokens, cookies, encabezados `Authorization` ni cadenas de conexión. Las fechas de los archivos se generan en UTC. La ruta registrada no incluye la query string, evitando filtrar parámetros sensibles.
