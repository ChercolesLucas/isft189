import { apiRequest } from './api'

// El tratamiento fiscal real deberá resolverse desde backend/configuración tributaria en una futura implementación.
export const CONDICION_IVA = 'Consumidor Final'
export const IVA_FACTURA = 0

const toFactura = (dto) => ({
  id: dto.idFactura,
  numero: dto.nroFactura,
  entregaId: dto.idRemito,
  remitoId: dto.idRemito,
  ordenCompraId: dto.idOc,
  pedidoId: dto.idPedido,
  clienteId: dto.idCliente,
  fecha: dto.fechaEmision.slice(0, 10),
  cae: dto.cae,
  estado: 'Emitida',
  cliente: { id: dto.cliente.idCliente, razonSocial: dto.cliente.razonSocial, cuit: dto.cliente.cuit, tipoCliente: dto.cliente.tipoCliente },
  items: dto.items.map((item) => ({ id: item.idDetalle, productoId: item.idProducto, descripcion: item.producto, cantidad: item.cantidad, precioUnitario: item.precioUnitario, subtotal: item.subtotal })),
  subtotal: dto.montoTotal,
  iva: IVA_FACTURA,
  total: dto.montoTotal + IVA_FACTURA,
})

export async function getFacturas() { return (await apiRequest('/facturas')).map(toFactura) }
export async function getFacturaById(id) { return toFactura(await apiRequest(`/facturas/${Number(id)}`)) }
export async function getFacturaByEntregaId(entregaId) { const dto = await apiRequest(`/facturas/remito/${Number(entregaId)}`); return dto ? toFactura(dto) : null }
export async function createFactura(data) { return toFactura(await apiRequest('/facturas/generar', { method: 'POST', body: JSON.stringify({ idRemito: Number(data.entregaId) }) })) }
