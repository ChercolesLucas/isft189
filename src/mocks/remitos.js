let remitos = []

export function obtenerRemitosMock() { return remitos.map((remito) => ({ ...remito, items: remito.items.map((item) => ({ ...item })) })) }
export function obtenerRemitoMockPorId(id) { return remitos.find((remito) => remito.id === id) ?? null }
export function obtenerRemitoMockPorOrdenCompraId(ordenCompraId) { return remitos.find((remito) => remito.ordenCompraId === ordenCompraId) ?? null }
export function crearRemitoMock(datos) {
  const id = remitos.length ? Math.max(...remitos.map((remito) => remito.id)) + 1 : 1
  const remito = { ...datos, id, numero: `R-${String(id).padStart(3, '0')}`, estado: 'Validado', items: datos.items.map((item) => ({ ...item })) }
  remitos = [...remitos, remito]
  return { ...remito, items: remito.items.map((item) => ({ ...item })) }
}
