import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, LockKeyhole, UserRound } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { haySesionActiva, iniciarSesion } from '../services/auth.service'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formulario, setFormulario] = useState({ correo: '', contrasena: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (haySesionActiva()) navigate('/dashboard', { replace: true })
  }, [navigate])

  function manejarCambio(event) {
    setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value }))
    setError('')
  }

  async function manejarEnvio(event) {
    event.preventDefault()
    if (!formulario.correo.trim() || !formulario.contrasena) {
      setError('Completá correo y contraseña para ingresar.')
      return
    }
    setCargando(true)
    setError('')
    try {
      await iniciarSesion(formulario.correo, formulario.contrasena)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (exception) {
      setError(exception.message || 'No se pudo iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-5 py-8">
      <section className="w-full max-w-[430px] rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/30 sm:p-10">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Building2 size={27} /></span>
          <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">Sistema de Gestión Comercial</h1>
          <p className="mt-1 text-sm text-slate-500">Clientes Minoristas</p>
        </div>
        <form onSubmit={manejarEnvio}>
          <Input label="Correo" id="correo" name="correo" type="email" value={formulario.correo} onChange={manejarCambio} placeholder="ventas@sistema.com" autoComplete="username" required />
          <Input label="Contraseña" id="contrasena" name="contrasena" type="password" value={formulario.contrasena} onChange={manejarCambio} placeholder="Ingresá tu contraseña" autoComplete="current-password" required />
          {error && <p className="-mt-1 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{error}</p>}
          <Button type="submit" loading={cargando}>Ingresar</Button>
        </form>
        <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-400"><UserRound size={14} /> Acceso institucional <LockKeyhole size={14} /><span className="ml-1 border-l border-slate-200 pl-2">Versión 1.0</span></div>
      </section>
    </main>
  )
}

export default Login
