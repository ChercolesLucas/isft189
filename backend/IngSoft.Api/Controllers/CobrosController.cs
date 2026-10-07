using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/cobros")]
public class CobrosController(AppDbContext db) : ControllerBase
{
    private static readonly HashSet<string> MediosValidos = ["TRANSFERENCIA", "EFECTIVO", "OTRO"];

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CobroDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll() => Ok((await db.Cobros.AsNoTracking().OrderByDescending(x => x.FechaRegistro).ToListAsync()).Select(ToDto));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(CobroDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var cobro = await db.Cobros.AsNoTracking().FirstOrDefaultAsync(x => x.IdCobro == id);
        return cobro is null ? NotFound(new ErrorResponse("Cobro no encontrado.", 404)) : Ok(ToDto(cobro));
    }

    [HttpGet("orden/{idOc:int}")]
    [ProducesResponseType(typeof(CobroDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> GetByOrden(int idOc)
    {
        var cobro = await db.Cobros.AsNoTracking().FirstOrDefaultAsync(x => x.IdOc == idOc);
        return cobro is null ? NoContent() : Ok(ToDto(cobro));
    }

    [HttpPost]
    [ProducesResponseType(typeof(CobroDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(CobroRequest request)
    {
        var orden = await db.OrdenesCompra.FindAsync(request.IdOc);
        if (orden is null) return NotFound(new ErrorResponse("Orden de compra no encontrada.", 404));
        if (orden.Estado != "VALIDADA") return BadRequest(new ErrorResponse("La orden de compra debe estar validada.", 400));
        if (await db.Cobros.AnyAsync(x => x.IdOc == request.IdOc)) return BadRequest(new ErrorResponse("La orden ya posee un cobro registrado.", 400));

        var medio = request.MedioPago.Trim().ToUpperInvariant();
        if (!MediosValidos.Contains(medio)) return BadRequest(new ErrorResponse("Medio de pago inválido.", 400));
        if (medio is "TRANSFERENCIA" or "OTRO" && string.IsNullOrWhiteSpace(request.Comprobante)) return BadRequest(new ErrorResponse("El comprobante es obligatorio para el medio de pago seleccionado.", 400));

        var cobro = new Cobro { IdOc = request.IdOc, FechaRegistro = DateTime.Now, MedioPago = medio, Comprobante = request.Comprobante, Estado = "PENDIENTE" };
        db.Cobros.Add(cobro);
        orden.Pago = "PENDIENTE";
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = cobro.IdCobro }, ToDto(cobro));
    }

    [HttpPatch("{id:int}/aprobar")]
    [ProducesResponseType(typeof(CobroDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public Task<IActionResult> Aprobar(int id) => CambiarEstado(id, "APROBADO");

    [HttpPatch("{id:int}/rechazar")]
    [ProducesResponseType(typeof(CobroDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public Task<IActionResult> Rechazar(int id) => CambiarEstado(id, "RECHAZADO");

    private async Task<IActionResult> CambiarEstado(int id, string estado)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var cobro = await db.Cobros.Include(x => x.OrdenCompra).FirstOrDefaultAsync(x => x.IdCobro == id);
        if (cobro is null) return NotFound(new ErrorResponse("Cobro no encontrado.", 404));
        if (cobro.Estado != "PENDIENTE") return BadRequest(new ErrorResponse("Solo puede modificarse un cobro pendiente.", 400));
        cobro.Estado = estado;
        cobro.OrdenCompra.Pago = estado;
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(ToDto(cobro));
    }

    private static CobroDto ToDto(Cobro cobro) => new(cobro.IdCobro, cobro.IdOc, cobro.FechaRegistro, cobro.MedioPago, cobro.Comprobante, cobro.Estado);
}
