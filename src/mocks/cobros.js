let cobros = []

export function obtenerCobrosMock() { return cobros.map((cobro) => ({ ...cobro })) }
export function obtenerCobroMockPorId(id) { return cobros.find((cobro) => cobro.id === id) ?? null }
export function obtenerCobroMockPorOrdenCompraId(ordenCompraId) { return cobros.find((cobro) => cobro.ordenCompraId === ordenCompraId) ?? null }
export function crearCobroMock(data) {
  if (obtenerCobroMockPorOrdenCompraId(data.ordenCompraId)) throw new Error('COBRO_EXISTENTE')
  const cobro = { ...data, id: cobros.length ? Math.max(...cobros.map((item) => item.id)) + 1 : 1, estado: 'Pendiente' }
  cobros = [...cobros, cobro]
  return { ...cobro }
}
export function aprobarCobroMock(id) { cobros = cobros.map((cobro) => cobro.id === id && cobro.estado === 'Pendiente' ? { ...cobro, estado: 'Aprobado' } : cobro); return obtenerCobroMockPorId(id) }
export function rechazarCobroMock(id) { cobros = cobros.map((cobro) => cobro.id === id && cobro.estado === 'Pendiente' ? { ...cobro, estado: 'Rechazado' } : cobro); return obtenerCobroMockPorId(id) }
