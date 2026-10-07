import { startTransition, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import Button from '../components/ui/Button'
import { PageLoader } from '../components/ui/Loading'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import { getClientes } from '../services/clientes.service'
import { getOrdenCompraById, getOrdenesCompra } from '../services/ordenesCompra.service'
import { createRemito, getRemitoByOrdenCompraId } from '../services/remitos.service'
import { getProductos } from '../services/productos.service'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const fechaActual = () => { const fecha = new Date(); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` }

function Stock() {
  const [ordenes, setOrdenes] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [ordenId, setOrdenId] = useState('')
  const [orden, setOrden] = useState(null)
  const [remito, setRemito] = useState(null)
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { Promise.all([getOrdenesCompra(), getClientes(), getProductos()]).then(([datosOrdenes, datosClientes, datosProductos]) => startTransition(() => { setOrdenes(datosOrdenes.filter((item) => item.estado === 'Validada')); setClientes(datosClientes); setProductos(datosProductos); setCargando(false) })).catch(() => { setError('No se pudieron cargar los datos de stock.'); setCargando(false) }) }, [])
  function construirFilas(ordenSeleccionada, productosActuales) { return ordenSeleccionada?.items.map((item) => { const producto = productosActuales.find((dato) => dato.id === item.productoId); const disponible = producto?.stockDisponible ?? 0; return { ...item, descripcion: producto?.descripcion ?? `Producto #${item.productoId}`, disponible, suficiente: disponible >= item.cantidad } }) ?? [] }
  async function seleccionarOrden(event) { const valor = event.target.value; setOrdenId(valor); setFeedback(null); setError(''); if (!valor) { setOrden(null); setRemito(null); setFilas([]); return } const seleccionada = await getOrdenCompraById(Number(valor)); const existente = await getRemitoByOrdenCompraId(Number(valor)); setOrden(seleccionada); setRemito(existente); setFilas(construirFilas(seleccionada, productos)); if (existente) setFeedback({ type: 'info', text: `El remito ${existente.numero} ya fue generado para esta orden.` }) }
  async function actualizarStock() { const datos = await getProductos(); setProductos(datos); setFilas(construirFilas(orden, datos)) }
  const stockSuficiente = filas.length > 0 && filas.every((fila) => fila.suficiente)
  async function generarRemito() { if (!orden || orden.estado !== 'Validada' || !stockSuficiente || remito) return; setGuardando(true); setError(''); try { const creado = await createRemito({ ordenCompraId: orden.id, pedidoId: orden.pedidoId, clienteId: orden.clienteId, fecha: fechaActual(), items: orden.items.map(({ productoId, cantidad }) => ({ productoId, cantidad })) }); setRemito(creado); await actualizarStock(); setFeedback({ type: 'success', text: `Remito ${creado.numero} generado correctamente.` }) } catch (errorGeneracion) { setError(errorGeneracion.message === 'STOCK_INSUFICIENTE' ? 'No se pudo generar el remito: el stock cambió y ya no es suficiente.' : 'No se pudo generar el remito.') } finally { setGuardando(false) } }
  const cliente = clientes.find((item) => item.id === orden?.clienteId)
  if (cargando) return <PageLoader label="Verificando stock..." />
  return <section><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Verificar Stock</h1><p className="mt-2 text-sm text-slate-500">Comprobación de disponibilidad para órdenes de compra validadas</p></div>{feedback && <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700" role="status">{feedback.text}</div>}{error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="grid grid-cols-1 gap-x-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"><Select label="Orden de Compra" id="stock-orden" value={ordenId} onChange={seleccionarOrden}><option value="">Seleccionar OC validada</option>{ordenes.map((item) => { const persona = clientes.find((clienteItem) => clienteItem.id === item.clienteId); return <option key={item.id} value={item.id}>OC {item.numero} - {persona?.razonSocial ?? 'Cliente'} - {moneda.format(item.total)}</option> })}</Select><div className="mb-4"><Button type="button" disabled={!orden || !stockSuficiente || Boolean(remito) || guardando} onClick={generarRemito} className="inline-flex items-center justify-center gap-2 md:w-auto"><FileText size={17} />Generar remito</Button></div></div>{!ordenes.length && <p className="text-sm text-slate-500">No hay órdenes de compra validadas disponibles.</p>}</div>{orden && <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs text-slate-500">Orden de Compra</span><h2 className="mt-1 text-lg font-semibold text-slate-800">OC {orden.numero} · {cliente?.razonSocial ?? 'Cliente'}</h2></div>{remito && <div><span className="mr-2 text-xs text-slate-500">Remito {remito.numero}</span><StatusBadge status="success">{remito.estado}</StatusBadge></div>}</div><div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[560px] border-collapse"><thead className="bg-slate-50"><tr>{['Producto', 'Solicitado', 'Disponible', 'Estado'].map((titulo) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={titulo}>{titulo}</th>)}</tr></thead><tbody>{filas.map((fila) => <tr className="border-t border-slate-100" key={fila.productoId}><td className="px-4 py-3 text-sm font-medium text-slate-700">{fila.descripcion}</td><td className="px-4 py-3 text-sm text-slate-600">{fila.cantidad}</td><td className="px-4 py-3 text-sm text-slate-600">{fila.disponible}</td><td className="px-4 py-3"><StatusBadge status={fila.suficiente ? 'success' : 'danger'}>{fila.suficiente ? 'OK' : 'Insuficiente'}</StatusBadge></td></tr>)}</tbody></table></div><div className={`mt-6 flex items-center gap-3 rounded-lg border px-4 py-4 text-sm font-semibold ${stockSuficiente ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>{stockSuficiente ? <CheckCircle size={21} /> : <AlertTriangle size={21} />}<div><strong className="block">{stockSuficiente ? 'Stock disponible' : 'Stock insuficiente'}</strong><span className="font-normal">{stockSuficiente ? 'Se puede generar el remito.' : 'No se puede generar el remito.'}</span></div></div></div>}</section>
}
export default Stock
