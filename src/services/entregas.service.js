import { apiRequest } from './api'

const toEntrega = (dto) => ({
  id: dto.idEntrega,
  numero: `E-${String(dto.idEntrega).padStart(3, '0')}`,
  ordenCompraId: dto.idOc,
  remitoId: dto.idRemito,
  cobroId: dto.idCobro,
  pedidoId: dto.idPedido,
  clienteId: dto.idCliente,
  fecha: dto.fechaEntrega.slice(0, 10),
  estado: dto.estado === 'ENTREGADO' ? 'Entregada' : dto.estado,
  items: dto.items.map((item) => ({ id: item.idDetalle, productoId: item.idProducto, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.subtotal })),
})

export async function getEntregas() { return (await apiRequest('/entregas')).map(toEntrega) }
export async function getEntregaById(id) { return toEntrega(await apiRequest(`/entregas/${Number(id)}`)) }
export async function getEntregaByOrdenCompraId(ordenCompraId) { const dto = await apiRequest(`/entregas/orden/${Number(ordenCompraId)}`); return dto ? toEntrega(dto) : null }
export async function createEntrega(data) { return toEntrega(await apiRequest('/entregas/confirmar', { method: 'POST', body: JSON.stringify({ idOc: Number(data.ordenCompraId), firmaDigitalCliente: data.firmaDigitalCliente || null }) })) }
