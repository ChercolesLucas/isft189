let cotizaciones = []

export function obtenerCotizacionesMock() { return cotizaciones.map((cotizacion) => ({ ...cotizacion, items: cotizacion.items.map((item) => ({ ...item })) })) }
export function obtenerCotizacionMockPorId(id) { return cotizaciones.find((cotizacion) => cotizacion.id === id) ?? null }
export function obtenerCotizacionMockPorPedidoId(pedidoId) { return cotizaciones.find((cotizacion) => cotizacion.pedidoId === pedidoId) ?? null }
export function crearCotizacionMock(cotizacion) {
  const id = cotizaciones.length ? Math.max(...cotizaciones.map((item) => item.id)) + 1 : 1
  const nuevoNumero = String(id).padStart(5, '0')
  const nuevaCotizacion = { ...cotizacion, id, numero: nuevoNumero, estado: 'Generada', items: cotizacion.items.map((item) => ({ ...item })) }
  cotizaciones = [...cotizaciones, nuevaCotizacion]
  return { ...nuevaCotizacion, items: nuevaCotizacion.items.map((item) => ({ ...item })) }
}
export function actualizarEstadoCotizacionMock(id, estado) { cotizaciones = cotizaciones.map((cotizacion) => cotizacion.id === id ? { ...cotizacion, estado } : cotizacion); return obtenerCotizacionMockPorId(id) }
