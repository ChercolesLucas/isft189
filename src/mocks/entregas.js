let entregas = []

export function obtenerEntregasMock() { return entregas.map((entrega) => ({ ...entrega, items: entrega.items.map((item) => ({ ...item })) })) }
export function obtenerEntregaMockPorId(id) { return entregas.find((entrega) => entrega.id === id) ?? null }
export function obtenerEntregaMockPorOrdenCompraId(ordenCompraId) { return entregas.find((entrega) => entrega.ordenCompraId === ordenCompraId) ?? null }
export function crearEntregaMock(data) {
  const id = entregas.length ? Math.max(...entregas.map((entrega) => entrega.id)) + 1 : 1
  const entrega = { ...data, id, numero: `E-${String(id).padStart(3, '0')}`, estado: 'Entregada', items: data.items.map((item) => ({ ...item })) }
  entregas = [...entregas, entrega]
  return { ...entrega, items: entrega.items.map((item) => ({ ...item })) }
}
