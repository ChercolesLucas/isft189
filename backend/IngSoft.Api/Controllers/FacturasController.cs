using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/facturas")]
public class FacturasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<FacturaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var facturas = await Query().OrderByDescending(x => x.FechaEmision).ToListAsync();
        return Ok(facturas.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(FacturaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var factura = await Query().FirstOrDefaultAsync(x => x.IdFactura == id);
        return factura is null ? NotFound(new ErrorResponse("Factura no encontrada.", 404)) : Ok(ToDto(factura));
    }

    [HttpGet("remito/{idRemito:int}")]
    [ProducesResponseType(typeof(FacturaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetByRemito(int idRemito)
    {
        var factura = await Query().FirstOrDefaultAsync(x => x.IdRemito == idRemito);
        return factura is null ? NoContent() : Ok(ToDto(factura));
    }

    [HttpPost("generar")]
    [ProducesResponseType(typeof(FacturaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Generate(FacturaRequest request)
    {
        var remito = await db.Remitos
            .Include(x => x.OrdenCompra).ThenInclude(x => x.Cobro)
            .Include(x => x.OrdenCompra).ThenInclude(x => x.Cotizacion)
            .FirstOrDefaultAsync(x => x.IdRemito == request.IdRemito);

        if (remito is null) return NotFound(new ErrorResponse("Remito no encontrado.", 404));
        if (remito.EstadoEntrega != "ENTREGADO") return BadRequest(new ErrorResponse("La mercadería debe estar entregada antes de facturar.", 400));
        if (remito.OrdenCompra.Estado != "DESPACHADA") return BadRequest(new ErrorResponse("La orden de compra no está despachada.", 400));
        if (remito.OrdenCompra.Pago != "APROBADO" || remito.OrdenCompra.Cobro?.Estado != "APROBADO") return BadRequest(new ErrorResponse("El pago debe estar aprobado.", 400));
        if (await db.Facturas.AnyAsync(x => x.IdRemito == request.IdRemito)) return BadRequest(new ErrorResponse("El remito ya está facturado.", 400));

        var factura = new Factura
        {
            IdRemito = request.IdRemito,
            NroFactura = string.IsNullOrWhiteSpace(request.NroFactura) ? $"F-{DateTime.Now:yyyyMMddHHmmssfff}" : request.NroFactura.Trim(),
            FechaEmision = DateTime.Now,
            Cae = $"CAE-{Guid.NewGuid():N}",
            MontoTotal = remito.OrdenCompra.Cotizacion.MontoTotal
        };
        db.Facturas.Add(factura);
        await db.SaveChangesAsync();
        var creada = await Query().SingleAsync(x => x.IdFactura == factura.IdFactura);
        return CreatedAtAction(nameof(GetById), new { id = factura.IdFactura }, ToDto(creada));
    }

    private IQueryable<Factura> Query() => db.Facturas.AsNoTracking()
        .Include(x => x.Remito)
        .ThenInclude(x => x.OrdenCompra)
        .ThenInclude(x => x.Cotizacion)
        .ThenInclude(x => x.Pedido)
        .ThenInclude(x => x.Cliente)
        .Include(x => x.Remito)
        .ThenInclude(x => x.OrdenCompra)
        .ThenInclude(x => x.Cotizacion)
        .ThenInclude(x => x.Pedido)
        .ThenInclude(x => x.Detalles)
        .ThenInclude(x => x.Producto);

    private static FacturaDto ToDto(Factura factura)
    {
        var orden = factura.Remito.OrdenCompra;
        var pedido = orden.Cotizacion.Pedido;
        var cliente = pedido.Cliente;
        return new FacturaDto(
            factura.IdFactura,
            factura.IdRemito,
            orden.IdOc,
            pedido.IdPedido,
            cliente.IdCliente,
            factura.NroFactura,
            factura.FechaEmision,
            factura.Cae,
            factura.MontoTotal,
            new ClienteDto(cliente.IdCliente, cliente.RazonSocial, cliente.Cuit, cliente.TipoCliente, cliente.EstadoCredito),
            pedido.Detalles.Select(x => new PedidoItemDto(
                x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
                x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)));
    }
}
