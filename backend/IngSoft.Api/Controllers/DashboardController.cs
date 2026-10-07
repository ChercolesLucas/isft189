using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/dashboard")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("resumen")]
    [ProducesResponseType(typeof(DashboardResumenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<DashboardResumenDto>> GetResumen()
    {
        var resumen = await db.DashboardResumen.AsNoTracking().SingleAsync();
        return Ok(new DashboardResumenDto(
            resumen.PedidosPendientes,
            resumen.Cotizaciones,
            resumen.OrdenesCompra,
            resumen.PagosPendientes,
            resumen.ListosParaRetirar,
            resumen.FacturasEmitidas));
    }
}
