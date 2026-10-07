import { NavLink, useNavigate } from 'react-router-dom'
import { Archive, Banknote, BarChart3, Boxes, ClipboardList, FileText, House, LogOut, Package, Receipt, ShoppingCart, Users } from 'lucide-react'
import { cerrarSesion } from '../../services/auth.service'

const items = [{ to: '/dashboard', label: 'Inicio', icon: House }, { to: '/clientes', label: 'Clientes', icon: Users }, { to: '/productos', label: 'Productos', icon: Package }, { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart }, { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText }, { to: '/ordenes-compra', label: 'Órdenes de Compra', icon: ClipboardList }, { to: '/stock', label: 'Stock', icon: Boxes }, { to: '/cobros', label: 'Cobros', icon: Banknote }, { to: '/almacen', label: 'Almacén', icon: Archive }, { to: '/facturacion', label: 'Facturación', icon: Receipt }, { to: '/seguimiento', label: 'Seguimiento', icon: BarChart3 }]

function Sidebar() {
  const navigate = useNavigate()
  function salir() { cerrarSesion(); navigate('/', { replace: true }) }
  return <aside className="flex w-[252px] shrink-0 flex-col bg-slate-950 px-3 py-5 text-slate-300 max-md:w-[220px] max-sm:hidden"><div className="flex items-center gap-3 border-b border-slate-800 px-3 pb-6"><span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-xs font-extrabold tracking-tight text-white">SG</span><div><strong className="block text-sm text-white">Gestión Comercial</strong><small className="text-[11px] text-slate-500">Clientes minoristas</small></div></div><nav className="mt-6 flex flex-col gap-1">{items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${isActive ? 'bg-slate-800 font-semibold text-white before:absolute before:-left-3 before:h-6 before:w-1 before:rounded-r-full before:bg-blue-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav><button className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-slate-400 transition hover:bg-slate-900 hover:text-white" onClick={salir}><LogOut size={18} /><span>Salir</span></button></aside>
}
export default Sidebar
