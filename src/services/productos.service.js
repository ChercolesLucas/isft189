import { apiRequest } from './api'
export function codigoProducto(id) { return id ? `PRD-${String(id).padStart(5, '0')}` : '' }
function toProducto(dto) { return { id: dto.idProducto, descripcion: dto.descripcion, precioMinorista: dto.precioMinorista, stockDisponible: dto.stockActual, stockMinimo: dto.stockMinimo, stockBajo: dto.stockBajo, codigo: codigoProducto(dto.idProducto) } }
function toPayload(producto, id) { return { idProducto: id, descripcion: producto.descripcion, precioMinorista: Number(producto.precioMinorista), stockActual: Number(producto.stockDisponible ?? producto.stockActual), stockMinimo: Number(producto.stockMinimo ?? 0) } }
export async function getProductos() { return (await apiRequest('/productos')).map(toProducto) }
export async function getProductoById(id) { return toProducto(await apiRequest(`/productos/${id}`)) }
export async function createProducto(producto) { return toProducto(await apiRequest('/productos', { method: 'POST', body: JSON.stringify(toPayload(producto)) })) }
export async function updateProducto(id, producto) { return toProducto(await apiRequest('/productos', { method: 'POST', body: JSON.stringify(toPayload(producto, id)) })) }
export async function deleteProducto(id) { await apiRequest(`/productos/${id}`, { method: 'DELETE' }) }
export async function descontarStockProductos() { return getProductos() }
