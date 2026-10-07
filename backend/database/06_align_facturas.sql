USE SistemaPedidos;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Facturas')
      AND name = N'UQ_Facturas_IdRemito'
)
BEGIN
    CREATE UNIQUE INDEX UQ_Facturas_IdRemito ON dbo.Facturas(id_remito);
END;
GO
