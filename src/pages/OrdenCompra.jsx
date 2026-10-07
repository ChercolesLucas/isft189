import { startTransition, useEffect, useMemo, useState } from 'react'
import { CheckCircle, ClipboardCheck, XCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageLoader } from '../components/ui/Loading'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import { getClientes } from '../services/clientes.service'
import { getCotizaciones } from '../services/cotizaciones.service'
import { cancelarOrdenCompra, createOrdenCompra, getOrdenCompraByCotizacionId, validarOrdenCompra } from '../services/ordenesCompra.service'
import { getProductos } from '../services/productos.service'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const fechaVisible = (fecha) => fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR') : '-'

function compararItems(cotizacion, orden) {
  if (!cotizacion || !orden) return { productosCoinciden: false, cantidadesCoinciden: false, importesCoinciden: false }
  const cotizacionIds = cotizacion.items.map((item) => item.productoId).sort()
  const ordenIds = orden.items.map((item) => item.productoId).sort()
  const productosCoinciden = cotizacionIds.length === ordenIds.length && cotizacionIds.every((id, index) => id === ordenIds[index])
  const cantidadesCoinciden = productosCoinciden && cotizacion.items.every((item) => orden.items.find((ordenItem) => ordenItem.productoId === item.productoId)?.cantidad === item.cantidad)
  const importesCoinciden = cantidadesCoinciden && cotizacion.items.every((item) => { const ordenItem = orden.items.find((dato) => dato.productoId === item.productoId); return ordenItem?.precioUnitario === item.precioUnitario && ordenItem?.subtotal === item.subtotal }) && orden.total === cotizacion.total
  return { productosCoinciden, cantidadesCoinciden, importesCoinciden }
}

function OrdenCompra() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [cotizacionId, setCotizacionId] = useState('')
  const [cotizacion, setCotizacion] = useState(null)
  const [orden, setOrden] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [confirmacion, setConfirmacion] = useState(false)

  useEffect(() => {
    Promise.all([getCotizaciones(), getClientes(), getProductos()]).then(([datosCotizaciones, datosClientes, datosProductos]) => startTransition(() => { setCotizaciones(datosCotizaciones.filter((item) => item.estado === 'Enviada')); setClientes(datosClientes); setProductos(datosProductos); setCargando(false) })).catch(() => { setError('No se pudieron cargar las órdenes de compra.'); setCargando(false) })
  }, [])

  async function seleccionarCotizacion(event) {
    const valor = event.target.value
    setCotizacionId(valor); setFeedback(null); setError('')
    if (!valor) { setCotizacion(null); setOrden(null); return }
    try { const seleccionada = await getCotizaciones().then((lista) => lista.find((item) => item.id === Number(valor))); const existente = await getOrdenCompraByCotizacionId(Number(valor)); setCotizacion(seleccionada ?? null); setOrden(existente) } catch { setError('No se pudo cargar la cotización seleccionada.') }
  }

  const validacion = useMemo(() => compararItems(cotizacion, orden), [cotizacion, orden])
  const cliente = clientes.find((item) => item.id === cotizacion?.clienteId)
  function descripcionProducto(productoId) { return productos.find((producto) => producto.id === productoId)?.descripcion ?? `Producto #${productoId}` }
  async function registrarOrden() {
    if (!cotizacion || orden) return
    setGuardando(true); setError('')
    try { const creada = await createOrdenCompra({ cotizacionId: cotizacion.id, pedidoId: cotizacion.pedidoId, clienteId: cotizacion.clienteId, fecha: cotizacion.fecha, items: cotizacion.items.map((item) => ({ ...item })), total: cotizacion.total }); setOrden(creada); setFeedback({ type: 'success', text: 'Orden de compra registrada correctamente.' }) } catch { setError('No se pudo registrar la orden de compra.') } finally { setGuardando(false) }
  }
  async function validarOrden() { if (!orden || orden.estado !== 'Pendiente' || !validacion.productosCoinciden || !validacion.cantidadesCoinciden || !validacion.importesCoinciden) return; setGuardando(true); try { setOrden(await validarOrdenCompra(orden.id)); setFeedback({ type: 'success', text: 'Orden de compra validada correctamente.' }) } finally { setGuardando(false) } }
  async function confirmarCancelacion() { if (!orden) return; setGuardando(true); try { setOrden(await cancelarOrdenCompra(orden.id)); setConfirmacion(false); setFeedback({ type: 'success', text: 'Orden de compra cancelada correctamente.' }) } finally { setGuardando(false) } }
  const puedeValidar = orden?.estado === 'Pendiente' && validacion.productosCoinciden && validacion.cantidadesCoinciden && validacion.importesCoinciden
  const tipoEstado = { Pendiente: 'warning', Validada: 'success', Cancelada: 'danger' }

  if (cargando) return <PageLoader label="Cargando órdenes de compra..." />
  return <section>
    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Validar Orden de Compra</h1><p className="mt-2 text-sm text-slate-500">Verificación de órdenes vinculadas a cotizaciones enviadas</p></div>
    {feedback && <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">{feedback.text}</div>}
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="grid grid-cols-1 gap-x-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"><Select label="Cotización" id="orden-cotizacion" value={cotizacionId} onChange={seleccionarCotizacion}><option value="">Seleccionar cotización enviada</option>{cotizaciones.map((item) => { const persona = clientes.find((clienteItem) => clienteItem.id === item.clienteId); return <option key={item.id} value={item.id}>Cotización {item.numero} - {persona?.razonSocial ?? 'Cliente'} - {moneda.format(item.total)}</option> })}</Select><div className="mb-4 md:text-right"><Button type="button" disabled={!cotizacion || Boolean(orden) || guardando} onClick={registrarOrden} className="inline-flex items-center justify-center gap-2 md:w-auto"><ClipboardCheck size={17} />Registrar orden de compra</Button></div></div>{!cotizaciones.length && <p className="text-sm text-slate-500">No hay cotizaciones enviadas disponibles.</p>}</div>
    {cotizacion && <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="grid grid-cols-2 gap-5 md:grid-cols-4"><div><span className="block text-xs text-slate-500">N.º OC</span><strong className="mt-1 block text-sm text-slate-800">{orden?.numero ?? 'Pendiente de registrar'}</strong></div><div><span className="block text-xs text-slate-500">Fecha</span><strong className="mt-1 block text-sm text-slate-800">{fechaVisible(orden?.fecha ?? cotizacion.fecha)}</strong></div><div><span className="block text-xs text-slate-500">Estado</span><div className="mt-1">{orden ? <StatusBadge status={tipoEstado[orden.estado]}>{orden.estado}</StatusBadge> : <StatusBadge status="neutral">Sin registrar</StatusBadge>}</div></div><div><span className="block text-xs text-slate-500">Cliente</span><strong className="mt-1 block text-sm text-slate-800">{cliente?.razonSocial ?? 'No encontrado'}</strong></div></div><div className="mt-6 border-t border-slate-100 pt-5"><h2 className="text-base font-semibold text-slate-800">Verificación de la OC</h2><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">{[['Productos coinciden', validacion.productosCoinciden], ['Cantidades coinciden', validacion.cantidadesCoinciden], ['Importes coinciden', validacion.importesCoinciden]].map(([label, coincide]) => <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${coincide ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`} key={label}>{coincide ? <CheckCircle size={18} /> : <XCircle size={18} />}<span>{label}</span></div>)}</div>{orden && <div className={`mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${puedeValidar || orden.estado === 'Validada' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{puedeValidar || orden.estado === 'Validada' ? <CheckCircle size={19} /> : <XCircle size={19} />}{puedeValidar || orden.estado === 'Validada' ? 'OC válida' : 'La orden presenta diferencias'}</div>}</div></div>}
    {cotizacion && orden && <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><h2 className="mb-5 text-base font-semibold text-slate-800">Productos de la orden</h2><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[600px] border-collapse"><thead className="bg-slate-50"><tr>{['Producto', 'Cantidad', 'Precio', 'Total'].map((titulo) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={titulo}>{titulo}</th>)}</tr></thead><tbody>{orden.items.map((item) => <tr className="border-t border-slate-100" key={item.productoId}><td className="px-4 py-3 text-sm font-medium text-slate-700">{descripcionProducto(item.productoId)}</td><td className="px-4 py-3 text-sm text-slate-600">{item.cantidad}</td><td className="px-4 py-3 text-sm text-slate-600">{moneda.format(item.precioUnitario)}</td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{moneda.format(item.subtotal)}</td></tr>)}</tbody></table></div><div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5"><span className="text-sm font-medium text-slate-500">Total</span><strong className="text-2xl font-bold tracking-tight text-slate-900">{moneda.format(orden.total)}</strong></div><div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row"><div className="sm:w-auto"><Button type="button" variant="secondary" disabled={!orden || orden.estado !== 'Pendiente' || guardando} onClick={() => setConfirmacion(true)} className="inline-flex items-center justify-center gap-2 sm:w-auto"><XCircle size={17} />Cancelar</Button></div><div className="sm:w-auto"><Button type="button" variant="success" disabled={!puedeValidar || guardando} onClick={validarOrden} className="inline-flex items-center justify-center gap-2 sm:w-auto"><CheckCircle size={17} />Validar OC</Button></div></div></div>}
    <ConfirmDialog open={confirmacion} title="Cancelar orden de compra" message={`¿Seguro que deseas cancelar la orden de compra ${orden?.numero ?? ''}?`} confirmLabel="Cancelar orden" confirmVariant="danger" loading={guardando} onConfirm={confirmarCancelacion} onCancel={() => setConfirmacion(false)} />
  </section>
}
export default OrdenCompra
