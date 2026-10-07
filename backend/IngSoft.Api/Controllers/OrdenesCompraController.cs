using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/ordenes-compra")]
public class OrdenesCompraController(AppDbContext db) : ControllerBase
{
    private static readonly HashSet<string> PagosValidos = ["PENDIENTE", "APROBADO", "RECHAZADO"];

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<OrdenCompraDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var ordenes = await Query().OrderByDescending(x => x.FechaRecepcion).ToListAsync();
        return Ok(ordenes.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(OrdenCompraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var orden = await Query().FirstOrDefaultAsync(x => x.IdOc == id);
        return orden is null ? NotFound(new ErrorResponse("Orden de compra no encontrada.", 404)) : Ok(ToDto(orden));
    }

    [HttpGet("cotizacion/{idCotizacion:int}")]
    [ProducesResponseType(typeof(OrdenCompraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetByCotizacion(int idCotizacion)
    {
        var orden = await Query().FirstOrDefaultAsync(x => x.IdCotizacion == idCotizacion);
        return orden is null ? NoContent() : Ok(ToDto(orden));
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrdenCompraDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(OrdenCompraRequest request)
    {
        var pago = request.Pago.Trim().ToUpperInvariant();
        if (!PagosValidos.Contains(pago)) return BadRequest(new ErrorResponse("Estado de pago inválido.", 400));
        var cotizacion = await db.Cotizaciones.FindAsync(request.IdCotizacion);
        if (cotizacion is null) return NotFound(new ErrorResponse("Cotización no encontrada.", 404));
        if (cotizacion.Estado is not ("ENVIADA" or "APROBADA")) return BadRequest(new ErrorResponse("La cotización debe estar enviada o aprobada.", 400));
        if (await db.OrdenesCompra.AnyAsync(x => x.IdCotizacion == request.IdCotizacion)) return BadRequest(new ErrorResponse("La cotización ya posee una orden de compra.", 400));

        var orden = new OrdenCompra
        {
            IdCotizacion = cotizacion.IdCotizacion,
            NroOcCliente = request.NroOcCliente,
            FechaRecepcion = DateTime.Now,
            Estado = "PENDIENTE",
            Pago = pago
        };
        db.OrdenesCompra.Add(orden);
        await db.SaveChangesAsync();
        var creada = await Query().SingleAsync(x => x.IdOc == orden.IdOc);
        return CreatedAtAction(nameof(GetById), new { id = orden.IdOc }, ToDto(creada));
    }

    [HttpPatch("{id:int}/validar")]
    [ProducesResponseType(typeof(OrdenCompraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Validar(int id)
    {
        var orden = await db.OrdenesCompra.Include(x => x.Cotizacion).FirstOrDefaultAsync(x => x.IdOc == id);
        if (orden is null) return NotFound(new ErrorResponse("Orden de compra no encontrada.", 404));
        if (orden.Estado != "PENDIENTE") return BadRequest(new ErrorResponse("Solo puede validarse una orden pendiente.", 400));
        orden.Estado = "VALIDADA";
        orden.Cotizacion.Estado = "APROBADA";
        await db.SaveChangesAsync();
        return Ok(ToDto(await Query().SingleAsync(x => x.IdOc == id)));
    }

    [HttpPatch("{id:int}/cancelar")]
    [ProducesResponseType(typeof(OrdenCompraDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancelar(int id)
    {
        var orden = await db.OrdenesCompra.FindAsync(id);
        if (orden is null) return NotFound(new ErrorResponse("Orden de compra no encontrada.", 404));
        if (orden.Estado != "PENDIENTE") return BadRequest(new ErrorResponse("Solo puede cancelarse una orden pendiente.", 400));
        orden.Estado = "CANCELADA";
        await db.SaveChangesAsync();
        return Ok(ToDto(await Query().SingleAsync(x => x.IdOc == id)));
    }

    private IQueryable<OrdenCompra> Query() => db.OrdenesCompra.AsNoTracking()
        .Include(x => x.Cotizacion)
        .ThenInclude(x => x.Pedido)
        .ThenInclude(x => x.Detalles)
        .ThenInclude(x => x.Producto);

    private static OrdenCompraDto ToDto(OrdenCompra orden) => new(
        orden.IdOc,
        orden.IdCotizacion,
        orden.Cotizacion.IdPedido,
        orden.Cotizacion.Pedido.IdCliente,
        orden.NroOcCliente,
        orden.FechaRecepcion,
        orden.Estado,
        orden.Pago,
        orden.Cotizacion.MontoTotal,
        orden.Cotizacion.Pedido.Detalles.Select(x => new PedidoItemDto(
            x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
            x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)));
}
