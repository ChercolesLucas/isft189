let facturas = []

export function obtenerFacturasMock() { return facturas.map((factura) => ({ ...factura, items: factura.items.map((item) => ({ ...item })), cliente: factura.cliente ? { ...factura.cliente } : undefined })) }
export function obtenerFacturaMockPorId(id) { return facturas.find((factura) => factura.id === id) ?? null }
export function obtenerFacturaMockPorEntregaId(entregaId) { return facturas.find((factura) => factura.entregaId === entregaId) ?? null }
export function crearFacturaMock(data) {
  const id = facturas.length ? Math.max(...facturas.map((factura) => factura.id)) + 1 : 1
  const factura = { ...data, id, numero: `F-${String(id).padStart(5, '0')}`, estado: 'Emitida', items: data.items.map((item) => ({ ...item })), cliente: data.cliente ? { ...data.cliente } : undefined }
  facturas = [...facturas, factura]
  return obtenerFacturaMockPorId(id)
}
