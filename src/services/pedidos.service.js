import { apiRequest } from './api'
function toPedido(dto) { return { id: dto.idPedido, numero: dto.idPedido, clienteId: dto.idCliente, cliente: dto.cliente, fecha: dto.fechaIngreso.slice(0, 10), estado: dto.estado, total: dto.total, items: dto.items.map((item) => ({ id: item.idDetalle, productoId: item.idProducto, producto: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.subtotal })) } }
function toPayload(pedido) { return { idCliente: Number(pedido.clienteId), fechaIngreso: pedido.fecha, items: pedido.items.map((item) => ({ idProducto: item.productoId, cantidad: item.cantidad })) } }
export async function getPedidos() { return (await apiRequest('/pedidos')).map(toPedido) }
export async function getPedidoById(id) { return toPedido(await apiRequest(`/pedidos/${id}`)) }
export async function createPedido(pedido) { return toPedido(await apiRequest('/pedidos', { method: 'POST', body: JSON.stringify(toPayload(pedido)) })) }
export async function updatePedido(id, pedido) { return toPedido(await apiRequest(`/pedidos/${Number(id)}`, { method: 'PUT', body: JSON.stringify(toPayload(pedido)) })) }
export async function deletePedido(id) { await apiRequest(`/pedidos/${Number(id)}`, { method: 'DELETE' }) }
