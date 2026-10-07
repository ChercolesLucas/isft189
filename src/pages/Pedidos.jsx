import { startTransition, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Input from '../components/ui/Input'
import { PageLoader } from '../components/ui/Loading'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import { getClientes } from '../services/clientes.service'
import { createPedido, deletePedido, getPedidos, updatePedido } from '../services/pedidos.service'
import { getProductos } from '../services/productos.service'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const fechaActual = () => {
  const fecha = new Date()
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}
const fechaVisible = (fecha) => fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR') : '—'
const estadoColor = { PENDIENTE: 'warning', COTIZADO: 'info', ENTREGADO: 'success', CANCELADO: 'danger' }

function Pedidos() {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [fecha, setFecha] = useState(fechaActual)
  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [items, setItems] = useState([])
  const [pedidoEditandoId, setPedidoEditandoId] = useState(null)
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null)
  const [errores, setErrores] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    Promise.all([getClientes(), getProductos(), getPedidos()])
      .then(([datosClientes, datosProductos, datosPedidos]) => startTransition(() => {
        setClientes(datosClientes)
        setProductos(datosProductos)
        setPedidos(datosPedidos)
        setCargando(false)
      }))
      .catch(() => {
        setErrorCarga('No se pudieron cargar los datos necesarios.')
        setCargando(false)
      })
  }, [])

  const total = useMemo(() => items.reduce((acumulado, item) => acumulado + item.subtotal, 0), [items])
  const productoSeleccionado = productos.find((item) => item.id === Number(productoId))

  function limpiarError(campo) {
    setErrores((actuales) => ({ ...actuales, [campo]: '' }))
    setFeedback(null)
  }

  function agregarProducto(event) {
    event.preventDefault()
    const nuevosErrores = {}
    const producto = productos.find((item) => item.id === Number(productoId))
    const cantidadNumero = Number(cantidad)
    const itemExistente = items.find((item) => item.productoId === Number(productoId))
    if (!producto) nuevosErrores.producto = 'Seleccioná un producto.'
    if (cantidad === '' || !Number.isInteger(cantidadNumero) || cantidadNumero <= 0) nuevosErrores.cantidad = 'La cantidad debe ser un entero mayor que 0.'
    const cantidadTotal = (itemExistente?.cantidad ?? 0) + cantidadNumero
    if (producto && cantidadTotal > producto.stockDisponible) nuevosErrores.cantidad = `Stock insuficiente. Disponible: ${producto.stockDisponible}.`
    if (Object.keys(nuevosErrores).length) {
      setErrores((actuales) => ({ ...actuales, ...nuevosErrores }))
      return
    }
    setItems((actuales) => itemExistente
      ? actuales.map((item) => item.productoId === producto.id ? { ...item, cantidad: cantidadTotal, subtotal: item.precioUnitario * cantidadTotal } : item)
      : [...actuales, { productoId: producto.id, cantidad: cantidadNumero, precioUnitario: producto.precioMinorista, subtotal: producto.precioMinorista * cantidadNumero }])
    setProductoId('')
    setCantidad('')
    setErrores((actuales) => ({ ...actuales, producto: '', cantidad: '', items: '' }))
    setFeedback(null)
  }

  function quitarItem(id) {
    setItems((actuales) => actuales.filter((item) => item.productoId !== id))
  }

  function limpiarPedido() {
    setClienteId('')
    setFecha(fechaActual())
    setProductoId('')
    setCantidad('')
    setItems([])
    setPedidoEditandoId(null)
    setErrores({})
    setFeedback(null)
  }

  function editarPedido(pedido) {
    if (pedido.estado !== 'PENDIENTE') {
      setFeedback({ type: 'info', text: 'Solo se pueden modificar pedidos pendientes.' })
      return
    }
    setPedidoEditandoId(pedido.id)
    setClienteId(String(pedido.clienteId))
    setFecha(pedido.fecha)
    setItems(pedido.items.map((item) => ({ ...item })))
    setProductoId('')
    setCantidad('')
    setErrores({})
    setFeedback({ type: 'info', text: `Editando el pedido ${pedido.numero}.` })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function recargarPedidos() {
    setPedidos(await getPedidos())
  }

  async function confirmarPedido(event) {
    event.preventDefault()
    const nuevosErrores = {}
    if (!clienteId) nuevosErrores.clienteId = 'Seleccioná un cliente.'
    if (!fecha) nuevosErrores.fecha = 'Seleccioná una fecha válida.'
    if (!items.length) nuevosErrores.items = 'Agregá al menos un producto al pedido.'
    if (Object.keys(nuevosErrores).length) {
      setErrores(nuevosErrores)
      return
    }
    setGuardando(true)
    try {
      const datos = { clienteId: Number(clienteId), fecha, items }
      const pedido = pedidoEditandoId
        ? await updatePedido(pedidoEditandoId, datos)
        : await createPedido(datos)
      await recargarPedidos()
      limpiarPedido()
      setFeedback({ type: 'success', text: `Pedido ${pedido.numero} ${pedidoEditandoId ? 'modificado' : 'registrado'} correctamente.` })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'No se pudo guardar el pedido.' })
    } finally {
      setGuardando(false)
    }
  }

  function solicitarEliminacion(pedido) {
    if (pedido.estado !== 'PENDIENTE') {
      setFeedback({ type: 'info', text: 'Solo se pueden eliminar pedidos pendientes.' })
      return
    }
    setPedidoAEliminar(pedido)
  }

  async function confirmarEliminacion() {
    if (!pedidoAEliminar) return
    setGuardando(true)
    try {
      await deletePedido(pedidoAEliminar.id)
      await recargarPedidos()
      if (pedidoEditandoId === pedidoAEliminar.id) limpiarPedido()
      setPedidoAEliminar(null)
      setFeedback({ type: 'success', text: 'Pedido eliminado correctamente.' })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'No se pudo eliminar el pedido.' })
      setPedidoAEliminar(null)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <PageLoader label="Cargando pedidos..." />
  if (errorCarga) return <section><div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorCarga}</div></section>

  const feedbackStyles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  }

  return (
    <section>
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pedidoEditandoId ? `Modificar Pedido ${pedidoEditandoId}` : 'Ingresar Pedido'}</h1>
        <p className="mt-2 text-sm text-slate-500">Registrá nuevos pedidos y administrá los que todavía estén pendientes.</p>
      </div>

      {feedback && <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${feedbackStyles[feedback.type]}`} role="status">{feedback.text}</div>}

      <form onSubmit={confirmarPedido}>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
          <h2 className="mb-6 text-base font-semibold text-slate-800">Datos del pedido</h2>
          <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2">
            <Select label="Cliente" id="pedido-cliente" value={clienteId} onChange={(event) => { setClienteId(event.target.value); limpiarError('clienteId') }} error={errores.clienteId}>
              <option value="">Seleccionar cliente</option>
              {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>)}
            </Select>
            <Input label="Fecha" id="pedido-fecha" type="date" value={fecha} onChange={(event) => { setFecha(event.target.value); limpiarError('fecha') }} error={errores.fecha} />
          </div>
        </div>

        <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
          <h2 className="mb-6 text-base font-semibold text-slate-800">Productos del pedido</h2>
          <div className="grid grid-cols-1 items-start gap-x-5 lg:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
            <Select label="Producto" id="pedido-producto" value={productoId} onChange={(event) => { setProductoId(event.target.value); limpiarError('producto') }} error={errores.producto}>
              <option value="">Seleccionar producto</option>
              {productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.codigo} - {producto.descripcion} - stock {producto.stockDisponible}</option>)}
            </Select>
            <Input label="Código interno" id="pedido-codigo-producto" value={productoSeleccionado?.codigo ?? ''} placeholder="Automático" disabled />
            <Input label="Cantidad" id="pedido-cantidad" type="number" min="1" step="1" value={cantidad} onChange={(event) => { setCantidad(event.target.value); limpiarError('cantidad') }} error={errores.cantidad} placeholder="1" />
            <div className="mb-4 pt-6"><Button type="button" onClick={agregarProducto} className="lg:w-auto"><Plus size={17} />Agregar</Button></div>
          </div>
          {errores.items && <p className="-mt-2 mb-5 text-xs text-red-600">{errores.items}</p>}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-slate-50"><tr>{['Código', 'Producto', 'Cantidad', 'Precio', 'Subtotal', 'Acciones'].map((titulo) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={titulo}>{titulo}</th>)}</tr></thead>
              <tbody>
                {items.length ? items.map((item) => {
                  const producto = productos.find((dato) => dato.id === item.productoId)
                  return <tr className="border-t border-slate-100" key={item.productoId}><td className="px-4 py-3 text-sm font-semibold text-blue-700">{producto?.codigo}</td><td className="px-4 py-3 text-sm font-medium text-slate-700">{producto?.descripcion ?? item.producto}</td><td className="px-4 py-3 text-sm text-slate-600">{item.cantidad}</td><td className="px-4 py-3 text-sm text-slate-600">{moneda.format(item.precioUnitario)}</td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{moneda.format(item.subtotal)}</td><td className="px-4 py-3"><button type="button" className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700" onClick={() => quitarItem(item.productoId)}><Trash2 size={15} />Quitar</button></td></tr>
                }) : <tr><td className="px-4 py-10 text-center text-sm text-slate-500" colSpan="6">No hay productos agregados al pedido.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5"><span className="text-sm font-medium text-slate-500">Total</span><strong className="text-2xl font-bold tracking-tight text-slate-900">{moneda.format(total)}</strong></div>
        </div>

        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <div className="sm:w-auto"><Button type="button" variant="secondary" onClick={limpiarPedido} className="sm:w-auto">{pedidoEditandoId ? 'Cancelar edición' : 'Limpiar'}</Button></div>
          <div className="sm:w-auto"><Button type="submit" variant="success" loading={guardando} className="sm:w-auto"><CheckCircle2 size={17} />{pedidoEditandoId ? 'Guardar cambios' : 'Confirmar pedido'}</Button></div>
        </div>
      </form>

      <div className="mt-9 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-semibold text-slate-800">Pedidos registrados</h2><p className="mt-1 text-sm text-slate-500">Los pedidos pendientes pueden modificarse o eliminarse.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{pedidos.length} registros</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-slate-50"><tr>{['Pedido', 'Fecha', 'Cliente', 'Unidades', 'Productos', 'Total', 'Estado', 'Acciones'].map((titulo) => <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500" key={titulo}>{titulo}</th>)}</tr></thead>
            <tbody>
              {pedidos.length ? pedidos.map((pedido) => {
                const editable = pedido.estado === 'PENDIENTE'
                const unidades = pedido.items.reduce((suma, item) => suma + item.cantidad, 0)
                return <tr className={`border-t border-slate-100 ${pedidoEditandoId === pedido.id ? 'bg-blue-50' : ''}`} key={pedido.id}><td className="px-4 py-3 text-sm font-semibold text-slate-800">#{pedido.numero}</td><td className="px-4 py-3 text-sm text-slate-600">{fechaVisible(pedido.fecha)}</td><td className="px-4 py-3 text-sm text-slate-700">{pedido.cliente}</td><td className="px-4 py-3 text-sm text-slate-600">{unidades}</td><td className="px-4 py-3 text-sm text-slate-600">{pedido.items.length}</td><td className="px-4 py-3 text-sm font-semibold text-slate-700">{moneda.format(pedido.total)}</td><td className="px-4 py-3"><StatusBadge status={estadoColor[pedido.estado] ?? 'neutral'}>{pedido.estado}</StatusBadge></td><td className="px-4 py-3"><div className="flex gap-3"><button type="button" disabled={!editable || guardando} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-35" onClick={() => editarPedido(pedido)}><Pencil size={15} />Modificar</button><button type="button" disabled={!editable || guardando} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-35" onClick={() => solicitarEliminacion(pedido)}><Trash2 size={15} />Eliminar</button></div></td></tr>
              }) : <tr><td className="px-4 py-10 text-center text-sm text-slate-500" colSpan="8">No hay pedidos registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog open={Boolean(pedidoAEliminar)} title="Eliminar pedido" message={`¿Seguro que deseas eliminar el pedido ${pedidoAEliminar?.numero ?? ''}? Esta acción no se puede deshacer.`} confirmLabel="Eliminar pedido" confirmVariant="danger" loading={guardando} onConfirm={confirmarEliminacion} onCancel={() => setPedidoAEliminar(null)} />
    </section>
  )
}

export default Pedidos
