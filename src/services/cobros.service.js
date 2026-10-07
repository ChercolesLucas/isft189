import { apiRequest } from './api'

const valorVisible = (valor) => valor ? `${valor.charAt(0)}${valor.slice(1).toLowerCase()}` : ''
const toCobro = (dto) => ({ id: dto.idCobro, ordenCompraId: dto.idOc, fecha: dto.fechaRegistro.slice(0, 10), medioPago: valorVisible(dto.medioPago), comprobante: dto.comprobante ?? '', estado: valorVisible(dto.estado) })

export async function getCobros() { return (await apiRequest('/cobros')).map(toCobro) }
export async function getCobroById(id) { return toCobro(await apiRequest(`/cobros/${Number(id)}`)) }
export async function getCobroByOrdenCompraId(ordenCompraId) { const dto = await apiRequest(`/cobros/orden/${Number(ordenCompraId)}`); return dto ? toCobro(dto) : null }
export async function createCobro(data) { return toCobro(await apiRequest('/cobros', { method: 'POST', body: JSON.stringify({ idOc: data.ordenCompraId, medioPago: data.medioPago, comprobante: data.comprobante || null }) })) }
export async function aprobarCobro(id) { return toCobro(await apiRequest(`/cobros/${id}/aprobar`, { method: 'PATCH' })) }
export async function rechazarCobro(id) { return toCobro(await apiRequest(`/cobros/${id}/rechazar`, { method: 'PATCH' })) }
