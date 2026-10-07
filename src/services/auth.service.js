import { apiRequest } from './api'

const SESSION_KEY = 'sistemaPedidos.usuario'

export async function iniciarSesion(correo, contrasena) {
  const usuario = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim(), contrasena }),
  })
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario))
  return usuario
}

export function obtenerUsuarioActual() {
  const session = localStorage.getItem(SESSION_KEY)
  if (!session) return null
  try {
    return JSON.parse(session)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY)
}

export function haySesionActiva() {
  return Boolean(obtenerUsuarioActual())
}
