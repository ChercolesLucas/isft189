import { startTransition, useEffect, useState } from 'react'
import { FilePlus2, Printer, Send } from 'lucide-react'
import Button from '../components/ui/Button'
import { PageLoader } from '../components/ui/Loading'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import { getClientes } from '../services/clientes.service'
import { createCotizacion, getCotizacionByPedidoId, updateEstadoCotizacion } from '../services/cotizaciones.service'
import { getPedidoById, getPedidos } from '../services/pedidos.service'
import { getProductos } from '../services/productos.service'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const fechaActual = () => { const fecha = new Date(); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` }
const fechaVisible = (fecha) => fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR') : '-'

function Cotizaciones() {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [pedidoId, setPedidoId] = useState('')
  const [pedido, setPedido] = useState(null)
  const [cotizacion, setCotizacion] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoPedido, setCargandoPedido] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    Promise.all([getPedidos(), getClientes(), getProductos()]).then(([datosPedidos, datosClientes, datosProductos]) => startTransition(() => { setPedidos(datosPedidos); setClientes(datosClientes); setProductos(datosProductos); setCargando(false) })).catch(() => { setError('No se pudieron cargar los datos de cotizaciones.'); setCargando(false) })
  }, [])

  async function seleccionarPedido(event) {
    const valor = event.target.value
    setPedidoId(valor); setFeedback(null); setError('')
    if (!valor) { setPedido(null); setCotizacion(null); setCliente(null); return }
    setCargandoPedido(true)
    try {
      const pedidoCargado = await getPedidoById(Number(valor))
      const cotizacionExistente = await getCotizacionByPedidoId(Number(valor))
      setPedido(pedidoCargado); setCotizacion(cotizacionExistente); setCliente(clientes.find((item) => item.id === pedidoCargado?.clienteId) ?? null)
      if (cotizacionExistente) setFeedback({ type: 'info', text: 'Este pedido ya posee una cotización.' })
    } catch { setError('No se pudo cargar el pedido seleccionado.') } finally { setCargandoPedido(false) }
  }

  const items = cotizacion?.items ?? pedido?.items ?? []
  const total = items.reduce((acumulado, item) => acumulado + item.subtotal, 0)
  function descripcionProducto(productoId) { return productos.find((producto) => producto.id === productoId)?.descripcion ?? `Producto #${productoId}` }
  async function generarCotizacion() {
    if (!pedido || !cliente || !pedido.items?.length) { setError('No se puede generar la cotización: faltan pedido, cliente o productos.'); return }
    if (cotizacion) { setFeedback({ type: 'info', text: 'Este pedido ya posee una cotización.' }); return }
    setGuardando(true); setError('')
    try { const creada = await createCotizacion({ pedidoId: pedido.id, clienteId: cliente.id, fecha: pedido.fecha || fechaActual(), tipoCliente: cliente.tipoCliente, items: pedido.items.map((item) => ({ ...item })), total: pedido.items.reduce((acumulado, item) => acumulado + item.subtotal, 0) }); setCotizacion(creada); setFeedback({ type: 'success', text: 'Cotización generada correctamente.' }) } catch { setError('No se pudo generar la cotización.') } finally { setGuardando(false) }
  }
  async function enviarCotizacion() { if (!cotizacion || cotizacion.estado === 'Enviada') return; setGuardando(true); try { const actualizada = await updateEstadoCotizacion(cotizacion.id, 'Enviada'); setCotizacion(actualizada); setFeedback({ type: 'success', text: 'Cotización marcada como enviada.' }) } finally { setGuardando(false) } }

  if (cargando) return <PageLoader label="Cargando cotizaciones..." />
  if (error && !pedidos.length) return <section><div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div></section>
  return <section className="printable-quote">
    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Cotizaciones</h1><p className="mt-2 text-sm text-slate-500">Generación y gestión de cotizaciones comerciales</p></div>
    {feedback && <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`} role="status">{feedback.text}</div>}
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="grid grid-cols-1 gap-x-5 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end"><Select label="Pedido" id="cotizacion-pedido" value={pedidoId} onChange={seleccionarPedido}><option value="">Seleccionar pedido</option>{pedidos.map((item) => { const persona = clientes.find((clienteItem) => clienteItem.id === item.clienteId); return <option key={item.id} value={item.id}>Pedido {item.numero} - {persona?.razonSocial ?? 'Cliente'} - {moneda.format(item.total)}</option> })}</Select><div className="mb-4 text-sm text-slate-500">{cargandoPedido ? 'Cargando pedido...' : pedido ? 'Pedido seleccionado' : 'Elegí un pedido para comenzar'}</div><div className="mb-4 md:text-right"><Button type="button" variant="primary" disabled={!pedido || Boolean(cotizacion) || guardando} onClick={generarCotizacion} className="inline-flex items-center justify-center gap-2 md:w-auto"><FilePlus2 size={17} />Generar cotización</Button></div></div></div>
    {pedido && <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="grid grid-cols-2 gap-5 md:grid-cols-4"><div><span className="block text-xs text-slate-500">N.º Cotización</span><strong className="mt-1 block text-sm text-slate-800">{cotizacion?.numero ?? 'Pendiente'}</strong></div><div><span className="block text-xs text-slate-500">Fecha</span><strong className="mt-1 block text-sm text-slate-800">{fechaVisible(cotizacion?.fecha ?? pedido.fecha)}</strong></div><div><span className="block text-xs text-slate-500">Estado</span><div className="mt-1">{cotizacion ? <StatusBadge status={cotizacion.estado === 'Enviada' ? 'success' : 'info'}>{cotizacion.estado}</StatusBadge> : <StatusBadge status="neutral">Sin generar</StatusBadge>}</div></div><div><span className="block text-xs text-slate-500">Pedido</span><strong className="mt-1 block text-sm text-slate-800">{pedido.numero}</strong></div></div><div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2"><div><span className="block text-xs text-slate-500">Cliente</span><strong className="mt-1 block text-sm text-slate-800">{cliente?.razonSocial ?? 'No encontrado'}</strong></div><div><span className="block text-xs text-slate-500">Tipo de cliente</span><strong className="mt-1 block text-sm text-slate-800">{cliente?.tipoCliente ?? '-'}</strong></div></div></div>}
    {pedido && <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><h2 className="mb-5 text-base font-semibold text-slate-800">Productos</h2><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[600px] border-collapse"><thead className="bg-slate-50"><tr>{['Producto', 'Cantidad', 'Precio', 'Total'].map((titulo) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={titulo}>{titulo}</th>)}</tr></thead><tbody>{items.map((item) => <tr className="border-t border-slate-100" key={item.productoId}><td className="px-4 py-3 text-sm font-medium text-slate-700">{descripcionProducto(item.productoId)}</td><td className="px-4 py-3 text-sm text-slate-600">{item.cantidad}</td><td className="px-4 py-3 text-sm text-slate-600">{moneda.format(item.precioUnitario)}</td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{moneda.format(item.subtotal)}</td></tr>)}</tbody></table></div><div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5"><span className="text-sm font-medium text-slate-500">Total cotizado</span><strong className="text-2xl font-bold tracking-tight text-slate-900">{moneda.format(cotizacion?.total ?? total)}</strong></div><div className="print-hidden mt-6 flex flex-col justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><div className="sm:w-auto"><Button type="button" variant="primary" disabled={!cotizacion || cotizacion.estado === 'Enviada' || guardando} onClick={enviarCotizacion} className="inline-flex items-center justify-center gap-2 sm:w-auto"><Send size={17} />Enviar cotización</Button></div><div className="sm:w-auto"><Button type="button" variant="secondary" disabled={!cotizacion} onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 sm:w-auto"><Printer size={17} />Imprimir</Button></div></div></div>}
  </section>
}
export default Cotizaciones
