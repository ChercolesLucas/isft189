USE SistemaPedidos;
GO

IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        id_usuario INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuarios PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(150) NOT NULL,
        contrasena VARCHAR(100) NOT NULL,
        CONSTRAINT UQ_Usuarios_Correo UNIQUE (correo)
    );
END;
GO

-- Ejemplo para agregar un usuario manualmente:
-- INSERT INTO dbo.Usuarios (nombre, correo, contrasena)
-- VALUES ('Usuario Ventas', 'ventas@sistema.com', '1234');
