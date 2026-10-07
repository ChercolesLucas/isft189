# Sistema de Gestión Comercial

Proyecto institucional desarrollado con React, Vite, ASP.NET Core .NET 8 y SQL Server.

## Tecnologías

- React + Vite
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- SQL Server / LocalDB
- Swagger / OpenAPI

## Ejecución local

### Base de datos

Ejecutar los scripts de `backend/database` sobre SQL Server en este orden:

1. `01_create_database.sql`
2. `02_create_dashboard_view.sql`
3. `03_align_order_payment_constraint.sql`
4. `04_create_cobros.sql`
5. `05_align_remitos.sql`
6. `06_align_facturas.sql`
7. `07_create_usuarios.sql`

La configuración actual utiliza la base `SistemaPedidos` en `(localdb)\MSSQLLocalDB`.

### API

```bash
cd backend/IngSoft.Api
dotnet restore
dotnet run
```

Swagger: `http://localhost:5080/swagger`

### Frontend

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Usuario de demostración

Los usuarios se agregan manualmente desde SQL Server:

```sql
INSERT INTO dbo.Usuarios (nombre, correo, contrasena)
VALUES ('Usuario Ventas', 'ventas@sistema.com', '1234');
```

El login es una implementación académica simple, sin JWT ni cifrado de contraseñas.

## Flujo principal

```text
Pedido → Cotización → Orden de compra → Cobro/Remito → Entrega → Factura
```
