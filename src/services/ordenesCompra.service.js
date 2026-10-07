import { apiRequest } from './api'

const estadoVisible = (estado) => estado ? `${estado.charAt(0)}${estado.slice(1).toLowerCase()}` : ''
const toOrdenCompra = (dto) => ({
  id: dto.idOc,
  numero: dto.nroOcCliente,
  cotizacionId: dto.idCotizacion,
  pedidoId: dto.idPedido,
  clienteId: dto.idCliente,
  fecha: dto.fechaRecepcion.slice(0, 10),
  estado: estadoVisible(dto.estado),
  pago: estadoVisible(dto.pago),
  total: dto.montoTotal,
  items: dto.items.map((item) => ({ id: item.idDetalle, productoId: item.idProducto, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.subtotal })),
})

export async function getOrdenesCompra() { return (await apiRequest('/ordenes-compra')).map(toOrdenCompra) }
export async function getOrdenCompraById(id) { return toOrdenCompra(await apiRequest(`/ordenes-compra/${Number(id)}`)) }
export async function getOrdenCompraByCotizacionId(cotizacionId) { const dto = await apiRequest(`/ordenes-compra/cotizacion/${Number(cotizacionId)}`); return dto ? toOrdenCompra(dto) : null }
export async function createOrdenCompra(datos) { return toOrdenCompra(await apiRequest('/ordenes-compra', { method: 'POST', body: JSON.stringify({ idCotizacion: datos.cotizacionId, nroOcCliente: `OC-${String(datos.cotizacionId).padStart(5, '0')}`, pago: 'PENDIENTE' }) })) }
export async function validarOrdenCompra(id) { return toOrdenCompra(await apiRequest(`/ordenes-compra/${id}/validar`, { method: 'PATCH' })) }
export async function cancelarOrdenCompra(id) { return toOrdenCompra(await apiRequest(`/ordenes-compra/${id}/cancelar`, { method: 'PATCH' })) }
