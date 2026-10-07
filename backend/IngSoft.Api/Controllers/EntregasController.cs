using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/entregas")]
public class EntregasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EntregaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var entregas = await Query().Where(x => x.EstadoEntrega == "ENTREGADO").OrderByDescending(x => x.FechaEmision).ToListAsync();
        return Ok(entregas.Select(ToDto));
    }

    [HttpGet("{idRemito:int}")]
    [ProducesResponseType(typeof(EntregaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int idRemito)
    {
        var entrega = await Query().FirstOrDefaultAsync(x => x.IdRemito == idRemito && x.EstadoEntrega == "ENTREGADO");
        return entrega is null ? NotFound(new ErrorResponse("Entrega no encontrada.", 404)) : Ok(ToDto(entrega));
    }

    [HttpGet("orden/{idOc:int}")]
    [ProducesResponseType(typeof(EntregaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetByOrden(int idOc)
    {
        var entrega = await Query().FirstOrDefaultAsync(x => x.IdOc == idOc && x.EstadoEntrega == "ENTREGADO");
        return entrega is null ? NoContent() : Ok(ToDto(entrega));
    }

    [HttpPost("confirmar")]
    [ProducesResponseType(typeof(EntregaDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Confirmar(EntregaRequest request)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var orden = await db.OrdenesCompra
            .Include(x => x.Cobro)
            .Include(x => x.Remitos)
            .Include(x => x.Cotizacion)
            .ThenInclude(x => x.Pedido)
            .FirstOrDefaultAsync(x => x.IdOc == request.IdOc);

        if (orden is null) return NotFound(new ErrorResponse("Orden de compra no encontrada.", 404));
        if (orden.Estado != "VALIDADA") return BadRequest(new ErrorResponse("La orden de compra debe estar validada.", 400));
        if (orden.Pago != "APROBADO" || orden.Cobro?.Estado != "APROBADO") return BadRequest(new ErrorResponse("El pago debe estar aprobado.", 400));

        var remito = orden.Remitos.SingleOrDefault();
        if (remito is null) return BadRequest(new ErrorResponse("La orden no posee un remito.", 400));
        if (remito.EstadoEntrega == "ENTREGADO") return BadRequest(new ErrorResponse("La mercadería ya fue entregada.", 400));
        if (remito.EstadoEntrega != "EMITIDO") return BadRequest(new ErrorResponse("El remito no está disponible para entregar.", 400));

        remito.EstadoEntrega = "ENTREGADO";
        if (!string.IsNullOrWhiteSpace(request.FirmaDigitalCliente)) remito.FirmaDigitalCliente = DecodeFirma(request.FirmaDigitalCliente);
        orden.Estado = "DESPACHADA";
        orden.Cotizacion.Pedido.Estado = "ENTREGADO";
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        var entrega = await Query().SingleAsync(x => x.IdRemito == remito.IdRemito);
        return Ok(ToDto(entrega));
    }

    private IQueryable<Remito> Query() => db.Remitos.AsNoTracking()
        .Include(x => x.OrdenCompra).ThenInclude(x => x.Cobro)
        .Include(x => x.OrdenCompra).ThenInclude(x => x.Cotizacion).ThenInclude(x => x.Pedido).ThenInclude(x => x.Detalles).ThenInclude(x => x.Producto);

    private static EntregaDto ToDto(Remito remito) => new(
        remito.IdRemito,
        remito.IdRemito,
        remito.IdOc,
        remito.OrdenCompra.Cobro?.IdCobro,
        remito.OrdenCompra.Cotizacion.IdPedido,
        remito.OrdenCompra.Cotizacion.Pedido.IdCliente,
        remito.FechaEmision,
        remito.EstadoEntrega,
        remito.OrdenCompra.Cotizacion.Pedido.Detalles.Select(x => new PedidoItemDto(
            x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
            x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)));

    private static byte[] DecodeFirma(string firma)
    {
        try { return Convert.FromBase64String(firma); }
        catch (FormatException) { return System.Text.Encoding.UTF8.GetBytes(firma); }
    }
}
