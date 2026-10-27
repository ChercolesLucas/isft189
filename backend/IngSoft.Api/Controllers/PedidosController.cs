using IngSoft.Api.Data;
using IngSoft.Api.DTOs;
using IngSoft.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IngSoft.Api.Controllers;

[ApiController, Route("api/pedidos")]
public class PedidosController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PedidoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var pedidos = await Query().OrderByDescending(x => x.FechaIngreso).ThenByDescending(x => x.IdPedido).ToListAsync();
        return Ok(pedidos.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PedidoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(int id)
    {
        var pedido = await Query().FirstOrDefaultAsync(x => x.IdPedido == id);
        return pedido is null ? NotFound(new ErrorResponse("Pedido no encontrado.", 404)) : Ok(ToDto(pedido));
    }

    [HttpPost]
    [ProducesResponseType(typeof(PedidoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(PedidoRequest request)
    {
        var validation = await ValidateRequest(request);
        if (validation.Error is not null) return validation.Error;

        var pedido = new Pedido
        {
            IdCliente = request.IdCliente,
            FechaIngreso = request.FechaIngreso?.Date ?? DateTime.Now,
            Estado = "PENDIENTE"
        };
        AddItems(pedido, request.Items, validation.Products!);
        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync();

        var creado = await Query().SingleAsync(x => x.IdPedido == pedido.IdPedido);
        return CreatedAtAction(nameof(Get), new { id = pedido.IdPedido }, ToDto(creado));
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(PedidoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, PedidoRequest request)
    {
        var pedido = await db.Pedidos
            .Include(x => x.Detalles)
            .Include(x => x.Cotizaciones)
            .FirstOrDefaultAsync(x => x.IdPedido == id);

        if (pedido is null) return NotFound(new ErrorResponse("Pedido no encontrado.", 404));
        if (pedido.Estado != "PENDIENTE" || pedido.Cotizaciones.Count != 0)
            return BadRequest(new ErrorResponse("Solo se pueden modificar pedidos pendientes sin cotización.", 400));

        var validation = await ValidateRequest(request);
        if (validation.Error is not null) return validation.Error;

        pedido.IdCliente = request.IdCliente;
        if (request.FechaIngreso.HasValue) pedido.FechaIngreso = request.FechaIngreso.Value.Date;
        db.DetallesItems.RemoveRange(pedido.Detalles);
        pedido.Detalles.Clear();
        AddItems(pedido, request.Items, validation.Products!);
        await db.SaveChangesAsync();

        var actualizado = await Query().SingleAsync(x => x.IdPedido == id);
        return Ok(ToDto(actualizado));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var pedido = await db.Pedidos
            .Include(x => x.Detalles)
            .Include(x => x.Cotizaciones)
            .FirstOrDefaultAsync(x => x.IdPedido == id);

        if (pedido is null) return NotFound(new ErrorResponse("Pedido no encontrado.", 404));
        return BadRequest(new ErrorResponse("Los pedidos no se eliminan. Utilice la operación de anulación.", 400));
    }

    [HttpPost("{id:int}/anular")]
    public async Task<IActionResult> Cancel(int id)
    {
        var pedido = await db.Pedidos.FirstOrDefaultAsync(x => x.IdPedido == id);
        if (pedido is null) return NotFound(new ErrorResponse("Pedido no encontrado.", 404));
        if (pedido.Estado != "PENDIENTE") return BadRequest(new ErrorResponse("Solo se pueden anular pedidos pendientes.", 400));
        pedido.Estado = "ANULADA";
        await db.SaveChangesAsync();
        var actualizado = await Query().SingleAsync(x => x.IdPedido == id);
        return Ok(ToDto(actualizado));
    }

    private async Task<(Dictionary<int, Producto>? Products, IActionResult? Error)> ValidateRequest(PedidoRequest request)
    {
        if (!await db.Clientes.AnyAsync(x => x.IdCliente == request.IdCliente))
            return (null, NotFound(new ErrorResponse("Cliente no encontrado.", 404)));

        var ids = request.Items.Select(x => x.IdProducto).Distinct().ToList();
        if (ids.Count != request.Items.Count)
            return (null, BadRequest(new ErrorResponse("No se puede repetir un producto en el pedido.", 400)));

        var products = await db.Productos.Where(x => ids.Contains(x.IdProducto)).ToDictionaryAsync(x => x.IdProducto);
        if (products.Count != ids.Count)
            return (null, NotFound(new ErrorResponse("Uno o más productos no existen.", 404)));

        foreach (var item in request.Items)
            if (item.Cantidad > products[item.IdProducto].StockActual)
                return (null, BadRequest(new ErrorResponse($"Stock insuficiente para {products[item.IdProducto].Descripcion}.", 400)));

        return (products, null);
    }

    private static void AddItems(Pedido pedido, IEnumerable<PedidoItemRequest> items, IReadOnlyDictionary<int, Producto> products)
    {
        foreach (var item in items)
            pedido.Detalles.Add(new DetalleItem
            {
                IdProducto = item.IdProducto,
                Cantidad = item.Cantidad,
                PrecioUnitario = products[item.IdProducto].PrecioMinorista
            });
    }

    private IQueryable<Pedido> Query() => db.Pedidos.AsNoTracking()
        .Include(x => x.Cliente)
        .Include(x => x.Detalles)
        .ThenInclude(x => x.Producto);

    private static PedidoDto ToDto(Pedido pedido)
    {
        var items = pedido.Detalles.Select(x => new PedidoItemDto(
            x.IdDetalle, x.IdProducto, x.Producto.Descripcion, x.Cantidad,
            x.PrecioUnitario, x.Cantidad * x.PrecioUnitario)).ToList();
        return new PedidoDto(
            pedido.IdPedido, pedido.IdCliente, pedido.Cliente.RazonSocial,
            pedido.FechaIngreso, pedido.Estado, items.Sum(x => x.Subtotal), items);
    }
}
