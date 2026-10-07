using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/remitos")]
public class RemitosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RemitoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var remitos = await Query().OrderByDescending(x => x.FechaEmision).ToListAsync();
        return Ok(remitos.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RemitoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var remito = await Query().FirstOrDefaultAsync(x => x.IdRemito == id);
        return remito is null ? NotFound(new ErrorResponse("Remito no encontrado.", 404)) : Ok(ToDto(remito));
    }

    [HttpGet("orden/{idOc:int}")]
    [ProducesResponseType(typeof(RemitoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetByOrden(int idOc)
    {
        var remito = await Query().FirstOrDefaultAsync(x => x.IdOc == idOc);
        return remito is null ? NoContent() : Ok(ToDto(remito));
    }

    [HttpPost("generar")]
    [ProducesResponseType(typeof(RemitoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Generate(RemitoRequest request)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var orden = await db.OrdenesCompra
            .Include(x => x.Remitos)
            .Include(x => x.Cotizacion)
            .ThenInclude(x => x.Pedido)
            .ThenInclude(x => x.Detalles)
            .FirstOrDefaultAsync(x => x.IdOc == request.IdOc);

        if (orden is null) return NotFound(new ErrorResponse("Orden de compra no encontrada.", 404));
        if (orden.Estado != "VALIDADA") return BadRequest(new ErrorResponse("La orden de compra debe estar validada.", 400));
        if (orden.Remitos.Count != 0) return BadRequest(new ErrorResponse("La orden ya posee un remito.", 400));
        if (orden.Cotizacion.Pedido.Detalles.Count == 0) return BadRequest(new ErrorResponse("La orden no contiene productos.", 400));

        foreach (var detalle in orden.Cotizacion.Pedido.Detalles)
        {
            var updated = await db.Productos
                .Where(x => x.IdProducto == detalle.IdProducto && x.StockActual >= detalle.Cantidad)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.StockActual, x => x.StockActual - detalle.Cantidad));
            if (updated == 0)
            {
                await transaction.RollbackAsync();
                return BadRequest(new ErrorResponse($"Stock insuficiente para el producto {detalle.IdProducto}.", 400));
            }
        }

        var remito = new Remito
        {
            IdOc = orden.IdOc,
            FechaEmision = DateTime.Now,
            EstadoEntrega = "EMITIDO",
            FirmaDigitalCliente = DecodeFirma(request.FirmaDigitalCliente)
        };
        db.Remitos.Add(remito);
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        var creado = await Query().SingleAsync(x => x.IdRemito == remito.IdRemito);
        return CreatedAtAction(nameof(GetById), new { id = remito.IdRemito }, ToDto(creado));
    }

    private IQueryable<Remito> Query() => db.Remitos.AsNoTracking()
        .Include(x => x.OrdenCompra)
        .ThenInclude(x => x.Cotizacion)
        .ThenInclude(x => x.Pedido)
        .ThenInclude(x => x.Detalles)
        .ThenInclude(x => x.Producto);

    private static RemitoDto ToDto(Remito remito) => new(
        remito.IdRemito,
        remito.IdOc,
        remito.OrdenCompra.Cotizacion.IdPedido,
        remito.OrdenCompra.Cotizacion.Pedido.IdCliente,
        remito.FechaEmision,
        remito.EstadoEntrega,
        remito.FirmaDigitalCliente is null ? null : Convert.ToBase64String(remito.FirmaDigitalCliente),
        remito.OrdenCompra.Cotizacion.Pedido.Detalles.Select(x => new PedidoItemDto(
            x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
            x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)));

    private static byte[]? DecodeFirma(string? firma)
    {
        if (string.IsNullOrWhiteSpace(firma)) return null;
        try { return Convert.FromBase64String(firma); }
        catch (FormatException) { return System.Text.Encoding.UTF8.GetBytes(firma); }
    }
}
