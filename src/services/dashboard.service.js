import { apiRequest } from './api'

const tarjetas = [
  ['pedidos', 'Pedidos pendientes', 'pedidosPendientes', 'blue'],
  ['cotizaciones', 'Cotizaciones', 'cotizaciones', 'purple'],
  ['ordenes', 'Órdenes de compra', 'ordenesCompra', 'orange'],
  ['pagos', 'Pendientes de pago', 'pagosPendientes', 'red'],
  ['retiro', 'Listos para retirar', 'listosParaRetirar', 'green'],
  ['facturas', 'Facturas emitidas', 'facturasEmitidas', 'teal'],
]

export async function obtenerResumenDashboard() {
  const resumen = await apiRequest('/dashboard/resumen')
  return tarjetas.map(([id, label, campo, tone]) => ({ id, label, value: resumen[campo], tone }))
}
