import { apiRequest } from './api'

const valorVisible = (valor) => valor ? `${valor.charAt(0)}${valor.slice(1).toLowerCase()}` : ''
const fecha = (valor) => valor?.slice(0, 10) ?? null
const items = (lista = []) => lista.map((item) => ({
  id: item.idDetalle,
  productoId: item.idProducto,
  producto: item.producto,
  cantidad: item.cantidad,
  precioUnitario: item.precioUnitario,
  subtotal: item.subtotal,
}))

function toSeguimiento(dto) {
  const pedido = {
    id: dto.pedido.idPedido,
    numero: dto.pedido.idPedido,
    clienteId: dto.pedido.idCliente,
    cliente: dto.pedido.cliente,
    fecha: fecha(dto.pedido.fechaIngreso),
    estado: valorVisible(dto.pedido.estado),
    total: dto.pedido.total,
    items: items(dto.pedido.items),
  }
  const cliente = {
    id: dto.cliente.idCliente,
    razonSocial: dto.cliente.razonSocial,
    cuit: dto.cliente.cuit,
    tipoCliente: dto.cliente.tipoCliente,
    estadoCredito: dto.cliente.estadoCredito,
  }
  const cotizacion = dto.cotizacion ? {
    id: dto.cotizacion.idCotizacion,
    numero: String(dto.cotizacion.idCotizacion).padStart(5, '0'),
    pedidoId: dto.cotizacion.idPedido,
    fecha: fecha(dto.cotizacion.fechaEmision),
    estado: valorVisible(dto.cotizacion.estado),
    total: dto.cotizacion.montoTotal,
  } : null
  const ordenCompra = dto.ordenCompra ? {
    id: dto.ordenCompra.idOc,
    numero: dto.ordenCompra.nroOcCliente,
    cotizacionId: dto.ordenCompra.idCotizacion,
    fecha: fecha(dto.ordenCompra.fechaRecepcion),
    estado: valorVisible(dto.ordenCompra.estado),
    pago: valorVisible(dto.ordenCompra.pago),
    total: dto.ordenCompra.montoTotal,
  } : null
  const cobro = dto.cobro ? {
    id: dto.cobro.idCobro,
    ordenCompraId: dto.cobro.idOc,
    fecha: fecha(dto.cobro.fechaRegistro),
    medioPago: valorVisible(dto.cobro.medioPago),
    comprobante: dto.cobro.comprobante ?? '',
    estado: valorVisible(dto.cobro.estado),
  } : null
  const remito = dto.remito ? {
    id: dto.remito.idRemito,
    numero: `R-${String(dto.remito.idRemito).padStart(3, '0')}`,
    ordenCompraId: dto.remito.idOc,
    fecha: fecha(dto.remito.fechaEmision),
    estado: dto.remito.estadoEntrega === 'EMITIDO' ? 'Validado' : valorVisible(dto.remito.estadoEntrega),
  } : null
  const entrega = dto.entrega ? {
    id: dto.entrega.idEntrega,
    numero: `E-${String(dto.entrega.idEntrega).padStart(3, '0')}`,
    remitoId: dto.entrega.idRemito,
    fecha: fecha(dto.entrega.fechaEntrega),
    estado: dto.entrega.estado === 'ENTREGADO' ? 'Entregada' : valorVisible(dto.entrega.estado),
  } : null
  const factura = dto.factura ? {
    id: dto.factura.idFactura,
    numero: dto.factura.nroFactura,
    fecha: fecha(dto.factura.fechaEmision),
    estado: 'Emitida',
    cae: dto.factura.cae,
    total: dto.factura.montoTotal,
  } : null
  return { pedido, cliente, cotizacion, ordenCompra, remito, cobro, entrega, factura }
}

export async function getSeguimientoByPedidoId(pedidoId) {
  return toSeguimiento(await apiRequest(`/seguimiento/pedido/${Number(pedidoId)}`))
}

export function obtenerEstadoGeneral(datos) {
  if (!datos) return { label: 'Sin operación', tone: 'neutral', description: 'Seleccioná un pedido para comenzar.' }
  if (datos.ordenCompra?.estado === 'Cancelada') return { label: 'Operación cancelada', tone: 'danger', description: 'La orden de compra fue cancelada.' }
  if (datos.cotizacion?.estado === 'Rechazada') return { label: 'Cotización rechazada', tone: 'danger', description: 'La cotización asociada al pedido fue rechazada.' }
  if (datos.cobro?.estado === 'Rechazado') return { label: 'Pago rechazado', tone: 'danger', description: 'El pago asociado a la orden fue rechazado.' }
  if (datos.factura) return { label: 'Completada', tone: 'success', description: 'La operación comercial finalizó correctamente.' }
  if (datos.entrega) return { label: 'Mercadería entregada', tone: 'success', description: 'La mercadería fue entregada y queda pendiente la facturación.' }
  if (datos.remito && datos.cobro?.estado === 'Aprobado') return { label: 'Lista para entrega', tone: 'info', description: 'La operación cuenta con remito y pago aprobado.' }
  if (datos.remito && datos.cobro?.estado !== 'Aprobado') return { label: 'Pago pendiente', tone: 'warning', description: 'El remito fue emitido y resta aprobar el pago.' }
  if (datos.ordenCompra?.estado === 'Validada') return { label: 'Orden validada', tone: 'info', description: 'La orden fue validada y queda pendiente emitir el remito.' }
  if (datos.ordenCompra?.estado === 'Pendiente') return { label: 'OC pendiente', tone: 'warning', description: 'La orden de compra todavía no fue validada.' }
  if (datos.cotizacion?.estado === 'Enviada' || datos.cotizacion?.estado === 'Aprobada') return { label: 'Cotización enviada', tone: 'info', description: 'La cotización espera el registro de la orden de compra.' }
  if (datos.cotizacion) return { label: 'Cotización generada', tone: 'info', description: 'La cotización fue generada y aún no fue enviada.' }
  return { label: 'Pedido registrado', tone: 'info', description: 'Aún no se generó una cotización para este pedido.' }
}

export function obtenerTotalComercial(datos) {
  return datos?.factura?.total ?? datos?.ordenCompra?.total ?? datos?.cotizacion?.total ?? datos?.pedido?.total ?? 0
}
