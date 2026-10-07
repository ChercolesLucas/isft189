USE SistemaPedidos;
GO

-- Estados utilizados por la API y el módulo de Cobros:
-- PENDIENTE: todavía no fue evaluado.
-- APROBADO: pago confirmado.
-- RECHAZADO: pago rechazado.

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Ordenes_Pago'
      AND parent_object_id = OBJECT_ID(N'dbo.Ordenes_Compra')
)
BEGIN
    ALTER TABLE dbo.Ordenes_Compra DROP CONSTRAINT CK_Ordenes_Pago;
END;
GO

ALTER TABLE dbo.Ordenes_Compra WITH CHECK
ADD CONSTRAINT CK_Ordenes_Pago
CHECK (pago IN ('PENDIENTE', 'APROBADO', 'RECHAZADO'));
GO

ALTER TABLE dbo.Ordenes_Compra CHECK CONSTRAINT CK_Ordenes_Pago;
GO
