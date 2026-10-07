const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } })
  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) throw new Error(body?.error ?? `Error HTTP ${response.status}`)
  return body
}

export { API_URL }
