namespace IngSoft.Api.Entities;

public class DashboardResumen
{
    public int PedidosPendientes { get; set; }
    public int Cotizaciones { get; set; }
    public int OrdenesCompra { get; set; }
    public int PagosPendientes { get; set; }
    public int ListosParaRetirar { get; set; }
    public int FacturasEmitidas { get; set; }
}
