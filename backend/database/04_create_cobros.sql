USE SistemaPedidos;
GO

IF OBJECT_ID(N'dbo.Cobros', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cobros (
        id_cobro INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Cobros PRIMARY KEY,
        id_oc INT NOT NULL,
        fecha_registro DATETIME NOT NULL,
        medio_pago VARCHAR(50) NOT NULL,
        comprobante VARCHAR(260) NULL,
        estado VARCHAR(50) NOT NULL,
        CONSTRAINT UQ_Cobros_IdOc UNIQUE (id_oc),
        CONSTRAINT FK_Cobros_OrdenesCompra FOREIGN KEY (id_oc) REFERENCES dbo.Ordenes_Compra(id_oc),
        CONSTRAINT CK_Cobros_Estado CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
        CONSTRAINT CK_Cobros_MedioPago CHECK (medio_pago IN ('TRANSFERENCIA', 'EFECTIVO', 'OTRO'))
    );
END;
GO
