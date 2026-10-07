USE SistemaPedidos;
GO

CREATE OR ALTER VIEW dbo.vw_DashboardResumen
AS
SELECT
    (SELECT COUNT(*) FROM dbo.Pedidos WHERE estado = 'PENDIENTE') AS pedidosPendientes,
    (SELECT COUNT(*) FROM dbo.Cotizaciones WHERE estado IN ('GENERADA', 'ENVIADA', 'APROBADA')) AS cotizaciones,
    (SELECT COUNT(*) FROM dbo.Ordenes_Compra WHERE estado IN ('PENDIENTE', 'VALIDADA', 'DESPACHADA')) AS ordenesCompra,
    (SELECT COUNT(*) FROM dbo.Ordenes_Compra WHERE pago = 'PENDIENTE') AS pagosPendientes,
    (SELECT COUNT(*) FROM dbo.Remitos r INNER JOIN dbo.Ordenes_Compra oc ON oc.id_oc = r.id_oc WHERE r.estado_entrega = 'EMITIDO' AND oc.pago = 'APROBADO') AS listosParaRetirar,
    (SELECT COUNT(*) FROM dbo.Facturas) AS facturasEmitidas;
GO
