import { apiRequest } from './api'

const estadoVisible = (estado) => estado ? `${estado.charAt(0)}${estado.slice(1).toLowerCase()}` : ''
const toCotizacion = (dto) => ({
  id: dto.idCotizacion,
  numero: String(dto.idCotizacion).padStart(5, '0'),
  pedidoId: dto.idPedido,
  clienteId: dto.idCliente,
  fecha: dto.fechaEmision.slice(0, 10),
  total: dto.montoTotal,
  estado: estadoVisible(dto.estado),
  items: dto.items.map((item) => ({ id: item.idDetalle, productoId: item.idProducto, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.subtotal })),
})

export async function getCotizaciones() { return (await apiRequest('/cotizaciones')).map(toCotizacion) }
export async function getCotizacionById(id) { return toCotizacion(await apiRequest(`/cotizaciones/${id}`)) }
export async function getCotizacionByPedidoId(pedidoId) { const dto = await apiRequest(`/cotizaciones/pedido/${pedidoId}`); return dto ? toCotizacion(dto) : null }
export async function createCotizacion(cotizacion) { return toCotizacion(await apiRequest(`/cotizaciones/generar/${cotizacion.pedidoId}`, { method: 'POST' })) }
export async function updateEstadoCotizacion(id, estado) { return toCotizacion(await apiRequest(`/cotizaciones/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })) }
