import { useEffect, useState } from 'react'
import { Activity, Banknote, CheckCircle2, ClipboardList, FileText, PackageCheck, Receipt } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import { PageLoader } from '../components/ui/Loading'
import { obtenerResumenDashboard } from '../services/dashboard.service'

const iconos = { pedidos: Activity, cotizaciones: FileText, ordenes: ClipboardList, pagos: Banknote, retiro: PackageCheck, facturas: Receipt }

function Dashboard() {
  const [estadisticas, setEstadisticas] = useState([])
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  useEffect(() => { obtenerResumenDashboard().then(setEstadisticas).catch((exception) => setError(exception.message || 'No se pudo cargar el resumen.')).finally(() => setCargando(false)) }, [])
  if (cargando) return <PageLoader label="Cargando dashboard..." />
  return <section><div className="mb-9 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Panel principal</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido, ventas</h1><p className="mt-2 text-sm text-slate-500">Aquí tienes un resumen de la actividad del sistema.</p></div><span className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:inline">Resumen general</span></div>{error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}<div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{estadisticas.map((stat) => <StatCard key={stat.id} {...stat} icon={iconos[stat.id]} />)}</div><div className="flex min-h-36 flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:flex-row sm:items-center"><div><h2 className="text-base font-semibold text-slate-800">Actividad del sistema</h2><p className="mt-2 text-sm text-slate-500">Seleccioná un módulo del menú para comenzar a trabajar.</p></div><div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4"><CheckCircle2 className={error ? 'text-red-600' : 'text-emerald-600'} size={21} /><div><span className="block text-xs text-slate-500">Estado de la operación</span><strong className={error ? 'text-sm text-red-600' : 'text-sm text-emerald-600'}>{error ? 'Conexión no disponible' : 'Todo en orden'}</strong></div></div></div></section>
}
export default Dashboard
