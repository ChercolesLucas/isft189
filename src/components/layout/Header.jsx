import { Bell, UserCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { obtenerUsuarioActual } from '../../services/auth.service'

const titulos = { '/dashboard': 'Inicio', '/clientes': 'Clientes', '/productos': 'Productos', '/pedidos': 'Pedidos', '/cotizaciones': 'Cotizaciones', '/ordenes-compra': 'Órdenes de Compra', '/stock': 'Stock', '/cobros': 'Cobros', '/almacen': 'Almacén', '/facturacion': 'Facturación', '/seguimiento': 'Seguimiento' }

function Header() {
  const { pathname } = useLocation()
  const titulo = titulos[pathname] ?? 'Sistema de Gestión Comercial'
  const usuario = obtenerUsuarioActual()
  return <header className="flex h-[68px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div className="flex items-center gap-3 text-sm font-semibold text-slate-700"><span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-xs font-extrabold tracking-tight text-white">SG</span><span>{titulo}</span></div><div className="flex items-center gap-4 text-slate-500"><button className="grid size-9 place-items-center rounded-lg transition hover:bg-slate-100 hover:text-blue-600" aria-label="Notificaciones"><Bell size={19} /></button><span className="h-6 w-px bg-slate-200" /><span className="flex items-center gap-2 text-sm font-medium text-slate-600"><UserCircle size={20} /> {usuario?.nombre ?? usuario?.correo ?? 'Usuario'}</span></div></header>
}
export default Header
