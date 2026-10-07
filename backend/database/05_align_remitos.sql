USE SistemaPedidos;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Remitos')
      AND name = N'UQ_Remitos_IdOc'
)
BEGIN
    CREATE UNIQUE INDEX UQ_Remitos_IdOc ON dbo.Remitos(id_oc);
END;
GO
