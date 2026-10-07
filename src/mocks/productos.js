const productosIniciales = [
  { id: 1, codigo: '001', descripcion: 'Cuaderno A4', precioMinorista: 12000, stockDisponible: 35 },
  { id: 2, codigo: '002', descripcion: 'Resma A4', precioMinorista: 8500, stockDisponible: 12 },
  { id: 3, codigo: '003', descripcion: 'Lapicera azul', precioMinorista: 1500, stockDisponible: 80 },
]

let productos = productosIniciales.map((producto) => ({ ...producto }))

export function obtenerProductosMock() { return productos.map((producto) => ({ ...producto })) }
export function obtenerProductoMockPorId(id) { const producto = productos.find((item) => item.id === id); return producto ? { ...producto } : null }
export function crearProductoMock(producto) { const nuevoProducto = { ...producto, id: productos.length ? Math.max(...productos.map(({ id }) => id)) + 1 : 1 }; productos = [...productos, nuevoProducto]; return { ...nuevoProducto } }
export function actualizarProductoMock(id, datos) { productos = productos.map((producto) => producto.id === id ? { ...producto, ...datos, id } : producto); return productos.find((producto) => producto.id === id) }
export function eliminarProductoMock(id) { productos = productos.filter((producto) => producto.id !== id) }
export function descontarStockProductosMock(items) {
  const productosActuales = items.map((item) => productos.find((producto) => producto.id === item.productoId))
  if (productosActuales.some((producto, index) => !producto || producto.stockDisponible < items[index].cantidad)) return false
  productos = productos.map((producto) => { const item = items.find((dato) => dato.productoId === producto.id); return item ? { ...producto, stockDisponible: producto.stockDisponible - item.cantidad } : producto })
  return true
}
