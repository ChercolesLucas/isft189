const clientesIniciales = [
  { id: 1, razonSocial: 'Juan Pérez', cuit: '20-12345675-9', telefono: '11-2345-6789', email: 'juan@ejemplo.com', tipoCliente: 'Minorista' },
  { id: 2, razonSocial: 'Librería ABC', cuit: '30-98765432-1', telefono: '11-4567-8901', email: 'contacto@libreriaabc.com', tipoCliente: 'Mayorista' },
  { id: 3, razonSocial: 'Comercial XYZ', cuit: '30-11223344-9', telefono: '11-5555-1234', email: 'ventas@comercialxyz.com', tipoCliente: 'Minorista' },
]

let clientes = clientesIniciales.map((cliente) => ({ ...cliente }))

export function obtenerClientesMock() {
  return clientes.map((cliente) => ({ ...cliente }))
}

export function crearClienteMock(cliente) {
  const nuevoCliente = { ...cliente, id: clientes.length ? Math.max(...clientes.map(({ id }) => id)) + 1 : 1 }
  clientes = [...clientes, nuevoCliente]
  return { ...nuevoCliente }
}

export function actualizarClienteMock(id, datos) {
  clientes = clientes.map((cliente) => cliente.id === id ? { ...cliente, ...datos, id } : cliente)
  return clientes.find((cliente) => cliente.id === id)
}

export function eliminarClienteMock(id) {
  clientes = clientes.filter((cliente) => cliente.id !== id)
}
