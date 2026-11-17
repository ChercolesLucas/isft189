using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/productos")]
public class ProductosController(AppDbContext db, ILogger<ProductosController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProductoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        var productos = await db.Productos.AsNoTracking()
            .Select(x => new ProductoDto(x.IdProducto, x.Descripcion, x.PrecioMinorista, x.StockActual, x.StockMinimo, x.StockActual <= x.StockMinimo))
            .ToListAsync();
        logger.LogInformation("Catálogo de productos consultado. Cantidad: {ProductCount}", productos.Count);
        return Ok(productos);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProductoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id)
    {
        var producto = await db.Productos.AsNoTracking().FirstOrDefaultAsync(x => x.IdProducto == id);
        return producto is null
            ? NotFound(new ErrorResponse("Producto no encontrado.", 404))
            : Ok(new ProductoDto(producto.IdProducto, producto.Descripcion, producto.PrecioMinorista, producto.StockActual, producto.StockMinimo, producto.StockActual <= producto.StockMinimo));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProductoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProductoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Save(ProductoRequest request)
    {
        Producto producto;
        var created = request.IdProducto is null;
        if (request.IdProducto is int id)
        {
            producto = await db.Productos.FindAsync(id) ?? null!;
            if (producto is null) return NotFound(new ErrorResponse("Producto no encontrado.", 404));
        }
        else
        {
            producto = new Producto();
            db.Productos.Add(producto);
        }

        producto.Descripcion = request.Descripcion;
        producto.PrecioMinorista = request.PrecioMinorista;
        producto.StockActual = request.StockActual;
        producto.StockMinimo = request.StockMinimo;
        await db.SaveChangesAsync();

        logger.LogInformation("Producto {Operation} correctamente. ProductoId: {ProductoId}", created ? "creado" : "actualizado", producto.IdProducto);
        var dto = new ProductoDto(producto.IdProducto, producto.Descripcion, producto.PrecioMinorista, producto.StockActual, producto.StockMinimo, producto.StockActual <= producto.StockMinimo);
        return created ? CreatedAtAction(nameof(Get), new { id = producto.IdProducto }, dto) : Ok(dto);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(int id)
    {
        var producto = await db.Productos.FindAsync(id);
        if (producto is null) return NotFound(new ErrorResponse("Producto no encontrado.", 404));
        if (await db.DetallesItems.AnyAsync(x => x.IdProducto == id))
            return BadRequest(new ErrorResponse("No se puede eliminar un producto utilizado en pedidos.", 400));

        db.Productos.Remove(producto);
        await db.SaveChangesAsync();
        logger.LogInformation("Producto eliminado correctamente. ProductoId: {ProductoId}", id);
        return NoContent();
    }
}
