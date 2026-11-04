import { useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Autocomplete from '../components/ui/Autocomplete'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import DataTable from '../components/ui/DataTable'
import Input from '../components/ui/Input'
import { PageLoader } from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import { createProducto, deleteProducto, getProductos, updateProducto } from '../services/productos.service'

const formularioInicial = { id: '', codigo: '', descripcion: '', precioMinorista: '', stockDisponible: '' }
const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const columnas = [{ key: 'codigo', label: 'Código' }, { key: 'descripcion', label: 'Descripción' }, { key: 'precioMinorista', label: 'Precio Minorista', render: (producto) => moneda.format(producto.precioMinorista) }, { key: 'stockDisponible', label: 'Stock' }]

function validarFormulario(formulario) {
  const errores = {}
  if (!formulario.descripcion.trim()) errores.descripcion = 'La descripción es obligatoria.'
  if (formulario.precioMinorista === '' || Number.isNaN(Number(formulario.precioMinorista)) || Number(formulario.precioMinorista) <= 0) errores.precioMinorista = 'El precio debe ser mayor que 0.'
  if (formulario.stockDisponible === '' || Number.isNaN(Number(formulario.stockDisponible)) || !Number.isInteger(Number(formulario.stockDisponible)) || Number(formulario.stockDisponible) < 0) errores.stockDisponible = 'El stock debe ser un entero mayor o igual a 0.'
  return errores
}

function Productos() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [errores, setErrores] = useState({})
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [confirmacion, setConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  async function cargarProductos() { setProductos(await getProductos()) }
  useEffect(() => { getProductos().then(setProductos).finally(() => setCargando(false)) }, [])
  function manejarCambio(event) { setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value })); setErrores((actuales) => ({ ...actuales, [event.target.name]: '' })); setFeedback(null) }
  function abrirNuevo() { setFormulario(formularioInicial); setErrores({}); setSelectedProductId(null); setFeedback(null); setModalAbierto(true) }
  function cerrarModal() { if (!guardando) setModalAbierto(false) }
  function seleccionarProducto(producto) { setSelectedProductId(producto.id); setFormulario({ ...producto, precioMinorista: String(producto.precioMinorista), stockDisponible: String(producto.stockDisponible), id: String(producto.id) }); setErrores({}); setFeedback(null); setModalAbierto(true) }
  function validar() { const nuevosErrores = validarFormulario(formulario); setErrores(nuevosErrores); return Object.keys(nuevosErrores).length === 0 }
  function obtenerDatos() { return { descripcion: formulario.descripcion.trim(), precioMinorista: Number(formulario.precioMinorista), stockDisponible: Number(formulario.stockDisponible) } }
  async function manejarGuardar() { if (selectedProductId !== null || !validar()) return; setGuardando(true); try { const creado = await createProducto(obtenerDatos()); await cargarProductos(); setModalAbierto(false); setFormulario(formularioInicial); setFeedback({ type: 'success', text: `Producto ${creado.codigo} guardado correctamente.` }) } finally { setGuardando(false) } }
  async function manejarModificar() { if (selectedProductId === null || !validar()) return; setGuardando(true); try { await updateProducto(selectedProductId, obtenerDatos()); await cargarProductos(); setModalAbierto(false); setFormulario(formularioInicial); setSelectedProductId(null); setFeedback({ type: 'success', text: 'Producto modificado correctamente.' }) } finally { setGuardando(false) } }
  function solicitarEliminacion() { if (selectedProductId !== null) setConfirmacion(true) }
  async function confirmarEliminacion() { setGuardando(true); try { await deleteProducto(selectedProductId); await cargarProductos(); setConfirmacion(false); setModalAbierto(false); setFormulario(formularioInicial); setSelectedProductId(null); setFeedback({ type: 'success', text: 'Producto eliminado correctamente.' }) } finally { setGuardando(false) } }
  const productosFiltrados = productos.filter((producto) => `${producto.codigo} ${producto.descripcion}`.toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase()))
  const productoAEliminar = productos.find((producto) => producto.id === selectedProductId)
  const feedbackStyles = { success: 'border-emerald-200 bg-emerald-50 text-emerald-700', info: 'border-blue-200 bg-blue-50 text-blue-700' }
  if (cargando) return <PageLoader label="Cargando productos..." />
  return <section>
    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Productos</h1><p className="mt-2 text-sm text-slate-500">Consultá y administrá tus productos comerciales.</p></div>
    {feedback && <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${feedbackStyles[feedback.type]}`} role="status">{feedback.text}</div>}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Autocomplete label="Buscar producto" id="buscar-producto" value={busqueda} options={productos} getOptionLabel={(producto) => `${producto.codigo} - ${producto.descripcion}`} onChange={(texto) => setBusqueda(texto)} placeholder="Escribí un código o descripción" /></div><Button type="button" onClick={abrirNuevo} className="sm:mb-4 sm:w-auto"><Plus size={17} />Nuevo</Button></div></div>
    <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-800">Productos registrados</h2><p className="mt-1 text-sm text-slate-500">Seleccioná una fila para modificarla.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{productosFiltrados.length} registros</span></div><DataTable columns={columnas} rows={productosFiltrados} onRowClick={seleccionarProducto} selectedRowId={selectedProductId} emptyMessage="No hay productos que coincidan con la búsqueda." /></div>
    <Modal open={modalAbierto} title={selectedProductId === null ? 'Nuevo producto' : 'Modificar producto'} description="Completá los datos del producto y guardá los cambios." onClose={cerrarModal}><form noValidate onSubmit={(event) => { event.preventDefault(); manejarGuardar() }}><div className="grid grid-cols-1 gap-x-5 md:grid-cols-2"><Input label="Código interno" id="producto-codigo" name="codigo" value={formulario.codigo || 'Se genera automáticamente'} disabled /><div className="md:col-span-2"><Input label="Descripción" id="producto-descripcion" name="descripcion" value={formulario.descripcion} onChange={manejarCambio} error={errores.descripcion} placeholder="Ej. Cuaderno A4" /></div><Input label="Precio minorista" id="precio-minorista" name="precioMinorista" type="number" min="0" step="0.01" value={formulario.precioMinorista} onChange={manejarCambio} error={errores.precioMinorista} placeholder="0" /><Input label="Stock disponible" id="stock-disponible" name="stockDisponible" type="number" min="0" step="1" value={formulario.stockDisponible} onChange={manejarCambio} error={errores.stockDisponible} placeholder="0" /></div><div className="mt-3 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="secondary" onClick={cerrarModal}>Cancelar</Button>{selectedProductId !== null && <Button type="button" variant="danger" disabled={guardando} onClick={solicitarEliminacion}><Trash2 size={17} />Eliminar</Button>}{selectedProductId !== null ? <Button type="button" variant="primary" loading={guardando} onClick={manejarModificar}><Pencil size={17} />Modificar</Button> : <Button type="submit" variant="success" loading={guardando}><Save size={17} />Guardar</Button>}</div></form></Modal>
    <ConfirmDialog open={confirmacion} title="Eliminar producto" message={`¿Seguro que deseas eliminar "${productoAEliminar?.descripcion ?? ''}"?`} confirmLabel="Eliminar producto" confirmVariant="danger" loading={guardando} onConfirm={confirmarEliminacion} onCancel={() => setConfirmacion(false)} />
  </section>
}

export default Productos
