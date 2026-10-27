using System.ComponentModel.DataAnnotations;

namespace IngSoft.Api.DTOs;
public record ErrorResponse(string Error, int StatusCode);
public record ServerStatusResponse(string Status);
public record ServerDateResponse(string ServerDate);
public class LoginRequest { [Required, EmailAddress, MaxLength(150)] public string Correo { get; set; } = string.Empty; [Required, MaxLength(100)] public string Contrasena { get; set; } = string.Empty; }
public record LoginResponse(int IdUsuario, string Nombre, string Correo);
public record DashboardResumenDto(int PedidosPendientes, int Cotizaciones, int OrdenesCompra, int PagosPendientes, int ListosParaRetirar, int FacturasEmitidas);
public record ClienteDto(int IdCliente, string RazonSocial, string Cuit, string TipoCliente, string EstadoCredito);
public class ClienteRequest { public int? IdCliente { get; set; } [Required, MaxLength(150)] public string RazonSocial { get; set; } = string.Empty; [Required, MaxLength(20)] public string Cuit { get; set; } = string.Empty; [Required, MaxLength(50)] public string TipoCliente { get; set; } = string.Empty; [Required, MaxLength(50)] public string EstadoCredito { get; set; } = string.Empty; }
public record ProductoDto(int IdProducto, string Descripcion, decimal PrecioMinorista, int StockActual, int StockMinimo, bool StockBajo);
public class ProductoRequest { public int? IdProducto { get; set; } [Required, MaxLength(200)] public string Descripcion { get; set; } = string.Empty; [Range(0, double.MaxValue)] public decimal PrecioMinorista { get; set; } [Range(0, int.MaxValue)] public int StockActual { get; set; } [Range(0, int.MaxValue)] public int StockMinimo { get; set; } }
public class PedidoRequest { [Range(1, int.MaxValue)] public int IdCliente { get; set; } public DateTime? FechaIngreso { get; set; } [Required, MinLength(1)] public List<PedidoItemRequest> Items { get; set; } = []; }
public class PedidoItemRequest { [Range(1, int.MaxValue)] public int IdProducto { get; set; } [Range(1, int.MaxValue)] public int Cantidad { get; set; } }
public record PedidoItemDto(int IdDetalle, int IdProducto, string Producto, int Cantidad, decimal PrecioUnitario, decimal Subtotal);
public record PedidoDto(int IdPedido, int IdCliente, string Cliente, DateTime FechaIngreso, string Estado, decimal Total, IEnumerable<PedidoItemDto> Items);
public record CotizacionDto(int IdCotizacion, int IdPedido, int IdCliente, DateTime FechaEmision, decimal MontoTotal, string Estado, IEnumerable<PedidoItemDto> Items);
public class CotizacionEstadoRequest { [Required, MaxLength(50)] public string Estado { get; set; } = string.Empty; }
public record OrdenCompraDto(int IdOc, int IdCotizacion, int IdPedido, int IdCliente, string NroOcCliente, DateTime FechaRecepcion, string Estado, string Pago, decimal MontoTotal, IEnumerable<PedidoItemDto> Items);
public class OrdenCompraRequest { [Range(1, int.MaxValue)] public int IdCotizacion { get; set; } [Required, MaxLength(50)] public string NroOcCliente { get; set; } = string.Empty; public string Pago { get; set; } = "PENDIENTE"; }
public record CobroDto(int IdCobro, int IdOc, DateTime FechaRegistro, string MedioPago, string? Comprobante, string Estado);
public class CobroRequest { [Range(1, int.MaxValue)] public int IdOc { get; set; } [Required, MaxLength(50)] public string MedioPago { get; set; } = string.Empty; [MaxLength(260)] public string? Comprobante { get; set; } }
public record RemitoDto(int IdRemito, int IdOc, int IdPedido, int IdCliente, DateTime FechaEmision, string EstadoEntrega, string? FirmaDigitalCliente, IEnumerable<PedidoItemDto> Items);
public class RemitoRequest { [Range(1, int.MaxValue)] public int IdOc { get; set; } public string? FirmaDigitalCliente { get; set; } }
public record EntregaDto(int IdEntrega, int IdRemito, int IdOc, int? IdCobro, int IdPedido, int IdCliente, DateTime FechaEntrega, string Estado, IEnumerable<PedidoItemDto> Items);
public class EntregaRequest { [Range(1, int.MaxValue)] public int IdOc { get; set; } public string? FirmaDigitalCliente { get; set; } }
public record FacturaDto(int IdFactura, int IdRemito, int IdOc, int IdPedido, int IdCliente, string NroFactura, DateTime FechaEmision, string Cae, decimal MontoTotal, string Estado, ClienteDto Cliente, IEnumerable<PedidoItemDto> Items);
public class FacturaRequest { [Range(1, int.MaxValue)] public int IdRemito { get; set; } public string? NroFactura { get; set; } }
public record SeguimientoDto(PedidoDto Pedido, ClienteDto Cliente, CotizacionDto? Cotizacion, OrdenCompraDto? OrdenCompra, RemitoDto? Remito, CobroDto? Cobro, EntregaDto? Entrega, FacturaDto? Factura);
