using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/seguimiento")]
public class SeguimientoController(AppDbContext db) : ControllerBase
{
    [HttpGet("pedido/{idPedido:int}")]
    [ProducesResponseType(typeof(SeguimientoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByPedido(int idPedido)
    {
        var pedido = await db.Pedidos
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.Cliente)
            .Include(x => x.Detalles).ThenInclude(x => x.Producto)
            .Include(x => x.Cotizaciones).ThenInclude(x => x.OrdenesCompra).ThenInclude(x => x.Cobro)
            .Include(x => x.Cotizaciones).ThenInclude(x => x.OrdenesCompra).ThenInclude(x => x.Remitos).ThenInclude(x => x.Facturas)
            .FirstOrDefaultAsync(x => x.IdPedido == idPedido);

        if (pedido is null) return NotFound(new ErrorResponse("Pedido no encontrado.", 404));

        var items = pedido.Detalles.Select(x => new PedidoItemDto(
            x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
            x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)).ToList();

        var cliente = new ClienteDto(
            pedido.Cliente.IdCliente, pedido.Cliente.RazonSocial, pedido.Cliente.Cuit,
            pedido.Cliente.TipoCliente, pedido.Cliente.EstadoCredito);

        var pedidoDto = new PedidoDto(
            pedido.IdPedido, pedido.IdCliente, pedido.Cliente.RazonSocial, pedido.FechaIngreso,
            pedido.Estado, items.Sum(x => x.Subtotal), items);

        var cotizacion = pedido.Cotizaciones
            .OrderByDescending(x => x.FechaEmision)
            .ThenByDescending(x => x.IdCotizacion)
            .FirstOrDefault();

        CotizacionDto? cotizacionDto = cotizacion is null ? null : new CotizacionDto(
            cotizacion.IdCotizacion, pedido.IdPedido, pedido.IdCliente, cotizacion.FechaEmision,
            cotizacion.MontoTotal, cotizacion.Estado, items);

        var orden = cotizacion?.OrdenesCompra
            .OrderByDescending(x => x.FechaRecepcion)
            .ThenByDescending(x => x.IdOc)
            .FirstOrDefault();

        OrdenCompraDto? ordenDto = orden is null || cotizacion is null ? null : new OrdenCompraDto(
            orden.IdOc, cotizacion.IdCotizacion, pedido.IdPedido, pedido.IdCliente,
            orden.NroOcCliente, orden.FechaRecepcion, orden.Estado, orden.Pago,
            cotizacion.MontoTotal, items);

        CobroDto? cobroDto = orden?.Cobro is null ? null : new CobroDto(
            orden.Cobro.IdCobro, orden.IdOc, orden.Cobro.FechaRegistro,
            orden.Cobro.MedioPago, orden.Cobro.Comprobante, orden.Cobro.Estado);

        var remito = orden?.Remitos
            .OrderByDescending(x => x.FechaEmision)
            .ThenByDescending(x => x.IdRemito)
            .FirstOrDefault();

        RemitoDto? remitoDto = remito is null || orden is null ? null : new RemitoDto(
            remito.IdRemito, orden.IdOc, pedido.IdPedido, pedido.IdCliente,
            remito.FechaEmision, remito.EstadoEntrega,
            remito.FirmaDigitalCliente is null ? null : Convert.ToBase64String(remito.FirmaDigitalCliente), items);

        EntregaDto? entregaDto = remito is null || orden is null || remito.EstadoEntrega != "ENTREGADO"
            ? null
            : new EntregaDto(
                remito.IdRemito, remito.IdRemito, orden.IdOc, orden.Cobro?.IdCobro,
                pedido.IdPedido, pedido.IdCliente, remito.FechaEmision, remito.EstadoEntrega, items);

        var factura = remito?.Facturas
            .OrderByDescending(x => x.FechaEmision)
            .ThenByDescending(x => x.IdFactura)
            .FirstOrDefault();

        FacturaDto? facturaDto = factura is null || remito is null || orden is null ? null : new FacturaDto(
            factura.IdFactura, remito.IdRemito, orden.IdOc, pedido.IdPedido, pedido.IdCliente,
            factura.NroFactura, factura.FechaEmision, factura.Cae, factura.MontoTotal, cliente, items);

        return Ok(new SeguimientoDto(
            pedidoDto, cliente, cotizacionDto, ordenDto, remitoDto, cobroDto, entregaDto, facturaDto));
    }
}
