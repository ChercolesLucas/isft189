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

Los logs se escriben en `logs/requests_yyyyMMdd.log` y `logs/errors_yyyyMMdd.log`. Para producción, agregar los dominios permitidos en `AllowedOrigins`.
