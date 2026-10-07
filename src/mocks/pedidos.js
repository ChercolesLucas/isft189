let pedidos = []

export function obtenerPedidosMock() { return pedidos.map((pedido) => ({ ...pedido, items: pedido.items.map((item) => ({ ...item })) })) }
export function obtenerPedidoMockPorId(id) { return pedidos.find((pedido) => pedido.id === id) ?? null }
export function crearPedidoMock(pedido) {
  const id = pedidos.length ? Math.max(...pedidos.map((item) => item.id)) + 1 : 1
  const numero = String(id).padStart(3, '0')
  const nuevoPedido = { ...pedido, id, numero, estado: 'Pendiente' }
  pedidos = [...pedidos, nuevoPedido]
  return { ...nuevoPedido }
}
