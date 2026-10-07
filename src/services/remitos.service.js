import { apiRequest } from './api'

const estadoVisible = (estado) => estado === 'EMITIDO' ? 'Validado' : estado ? `${estado.charAt(0)}${estado.slice(1).toLowerCase()}` : ''
const toRemito = (dto) => ({
  id: dto.idRemito,
  numero: `R-${String(dto.idRemito).padStart(3, '0')}`,
  ordenCompraId: dto.idOc,
  pedidoId: dto.idPedido,
  clienteId: dto.idCliente,
  fecha: dto.fechaEmision.slice(0, 10),
  estado: estadoVisible(dto.estadoEntrega),
  firmaDigitalCliente: dto.firmaDigitalCliente,
  items: dto.items.map((item) => ({ id: item.idDetalle, productoId: item.idProducto, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.subtotal })),
})

export async function getRemitos() { return (await apiRequest('/remitos')).map(toRemito) }
export async function getRemitoById(id) { return toRemito(await apiRequest(`/remitos/${Number(id)}`)) }
export async function getRemitoByOrdenCompraId(ordenCompraId) { const dto = await apiRequest(`/remitos/orden/${Number(ordenCompraId)}`); return dto ? toRemito(dto) : null }
export async function createRemito(data) {
  try { return toRemito(await apiRequest('/remitos/generar', { method: 'POST', body: JSON.stringify({ idOc: Number(data.ordenCompraId) }) })) }
  catch (error) { if (error.message.toLowerCase().includes('stock insuficiente')) throw new Error('STOCK_INSUFICIENTE'); throw error }
}
