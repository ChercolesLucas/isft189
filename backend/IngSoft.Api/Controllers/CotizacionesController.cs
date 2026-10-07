using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/cotizaciones")]
public class CotizacionesController(AppDbContext db) : ControllerBase
{
    private static readonly HashSet<string> EstadosValidos = ["GENERADA", "ENVIADA", "APROBADA", "RECHAZADA"];

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CotizacionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var cotizaciones = await Query().OrderByDescending(x => x.FechaEmision).ToListAsync();
        return Ok(cotizaciones.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CotizacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var cotizacion = await Query().FirstOrDefaultAsync(x => x.IdCotizacion == id);
        return cotizacion is null
            ? NotFound(new ErrorResponse("Cotización no encontrada.", 404))
            : Ok(ToDto(cotizacion));
    }

    [HttpGet("pedido/{idPedido:int}")]
    [ProducesResponseType(typeof(CotizacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetByPedido(int idPedido)
    {
        var cotizacion = await Query().FirstOrDefaultAsync(x => x.IdPedido == idPedido);
        return cotizacion is null ? NoContent() : Ok(ToDto(cotizacion));
    }

    [HttpPost("generar/{idPedido:int}")]
    [ProducesResponseType(typeof(CotizacionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Generate(int idPedido)
    {
        var pedido = await db.Pedidos.Include(x => x.Detalles).FirstOrDefaultAsync(x => x.IdPedido == idPedido);
        if (pedido is null) return NotFound(new ErrorResponse("Pedido no encontrado.", 404));
        if (pedido.Detalles.Count == 0) return BadRequest(new ErrorResponse("El pedido no contiene productos.", 400));
        if (await db.Cotizaciones.AnyAsync(x => x.IdPedido == idPedido)) return BadRequest(new ErrorResponse("El pedido ya posee una cotización.", 400));

        var cotizacion = new Cotizacion
        {
            IdPedido = idPedido,
            FechaEmision = DateTime.Now,
            MontoTotal = pedido.Detalles.Sum(x => x.Cantidad * x.PrecioUnitario),
            Estado = "GENERADA"
        };
        db.Cotizaciones.Add(cotizacion);
        pedido.Estado = "COTIZADO";
        await db.SaveChangesAsync();

        var creada = await Query().SingleAsync(x => x.IdCotizacion == cotizacion.IdCotizacion);
        return CreatedAtAction(nameof(GetById), new { id = cotizacion.IdCotizacion }, ToDto(creada));
    }

    [HttpPatch("{id:int}/estado")]
    [ProducesResponseType(typeof(CotizacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEstado(int id, CotizacionEstadoRequest request)
    {
        var estado = request.Estado.Trim().ToUpperInvariant();
        if (!EstadosValidos.Contains(estado)) return BadRequest(new ErrorResponse("Estado de cotización inválido.", 400));
        var cotizacion = await db.Cotizaciones.FindAsync(id);
        if (cotizacion is null) return NotFound(new ErrorResponse("Cotización no encontrada.", 404));
        cotizacion.Estado = estado;
        await db.SaveChangesAsync();
        var actualizada = await Query().SingleAsync(x => x.IdCotizacion == id);
        return Ok(ToDto(actualizada));
    }

    private IQueryable<Cotizacion> Query() => db.Cotizaciones.AsNoTracking()
        .Include(x => x.Pedido)
        .ThenInclude(x => x.Detalles)
        .ThenInclude(x => x.Producto);

    private static CotizacionDto ToDto(Cotizacion cotizacion) => new(
        cotizacion.IdCotizacion,
        cotizacion.IdPedido,
        cotizacion.Pedido.IdCliente,
        cotizacion.FechaEmision,
        cotizacion.MontoTotal,
        cotizacion.Estado,
        cotizacion.Pedido.Detalles.Select(x => new PedidoItemDto(
            x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
            x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)));
}
