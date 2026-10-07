import { apiRequest } from './api'
function toCliente(dto) { return { id: dto.idCliente, razonSocial: dto.razonSocial, cuit: dto.cuit, tipoCliente: dto.tipoCliente, estadoCredito: dto.estadoCredito, telefono: '', email: '' } }
function toPayload(cliente, id) { return { idCliente: id, razonSocial: cliente.razonSocial, cuit: cliente.cuit, tipoCliente: cliente.tipoCliente, estadoCredito: cliente.estadoCredito || 'ACTIVO' } }
export async function getClientes() { return (await apiRequest('/clientes')).map(toCliente) }
export async function createCliente(cliente) { return toCliente(await apiRequest('/clientes', { method: 'POST', body: JSON.stringify(toPayload(cliente)) })) }
export async function updateCliente(id, cliente) { return toCliente(await apiRequest('/clientes', { method: 'POST', body: JSON.stringify(toPayload(cliente, id)) })) }
export async function deleteCliente(id) { await apiRequest(`/clientes/${id}`, { method: 'DELETE' }) }
