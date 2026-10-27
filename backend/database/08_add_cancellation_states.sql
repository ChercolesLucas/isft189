USE SistemaPedidos;
GO

IF COL_LENGTH('dbo.Facturas', 'estado') IS NULL
BEGIN
    ALTER TABLE dbo.Facturas ADD estado VARCHAR(50) NOT NULL CONSTRAINT DF_Facturas_Estado DEFAULT 'EMITIDA';
END;
GO
