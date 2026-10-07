let ordenesCompra = []

export function obtenerOrdenesCompraMock() { return ordenesCompra.map((orden) => ({ ...orden, items: orden.items.map((item) => ({ ...item })) })) }
export function obtenerOrdenCompraMockPorId(id) { return ordenesCompra.find((orden) => orden.id === id) ?? null }
export function obtenerOrdenCompraMockPorCotizacionId(cotizacionId) { return ordenesCompra.find((orden) => orden.cotizacionId === cotizacionId) ?? null }
export function crearOrdenCompraMock(datos) {
  const id = ordenesCompra.length ? Math.max(...ordenesCompra.map((orden) => orden.id)) + 1 : 1
  const nuevaOrden = { ...datos, id, numero: String(id).padStart(3, '0'), estado: 'Pendiente', items: datos.items.map((item) => ({ ...item })) }
  ordenesCompra = [...ordenesCompra, nuevaOrden]
  return { ...nuevaOrden, items: nuevaOrden.items.map((item) => ({ ...item })) }
}
export function validarOrdenCompraMock(id) { ordenesCompra = ordenesCompra.map((orden) => orden.id === id ? { ...orden, estado: 'Validada' } : orden); return obtenerOrdenCompraMockPorId(id) }
export function cancelarOrdenCompraMock(id) { ordenesCompra = ordenesCompra.map((orden) => orden.id === id ? { ...orden, estado: 'Cancelada' } : orden); return obtenerOrdenCompraMockPorId(id) }
