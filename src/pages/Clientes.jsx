import { startTransition, useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Autocomplete from '../components/ui/Autocomplete'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import DataTable from '../components/ui/DataTable'
import Input from '../components/ui/Input'
import { PageLoader } from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import { createCliente, deleteCliente, getClientes, updateCliente } from '../services/clientes.service'

const formularioInicial = { id: '', razonSocial: '', cuit: '', telefono: '', email: '', tipoCliente: '' }
const columnas = [{ key: 'id', label: 'ID' }, { key: 'razonSocial', label: 'Razón Social' }, { key: 'cuit', label: 'CUIT' }, { key: 'tipoCliente', label: 'Tipo' }]

function validarFormulario(formulario) {
  const errores = {}
  if (!formulario.razonSocial.trim()) errores.razonSocial = 'La razón social es obligatoria.'
  if (!/^\d{2}-\d{8}-\d$/.test(formulario.cuit.trim())) errores.cuit = 'Usá el formato XX-XXXXXXXX-X.'
  if (!formulario.telefono.trim() || !/[\d]/.test(formulario.telefono) || !/^[\d\s+()-]+$/.test(formulario.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email.trim())) errores.email = 'Ingresá un email válido.'
  if (!formulario.tipoCliente) errores.tipoCliente = 'Seleccioná un tipo de cliente.'
  return errores
}

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [errores, setErrores] = useState({})
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [confirmacion, setConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  async function cargarClientes() { setClientes(await getClientes()) }
  useEffect(() => { getClientes().then((datos) => startTransition(() => setClientes(datos))).finally(() => setCargando(false)) }, [])
  function manejarCambio(event) { setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value })); setErrores((actuales) => ({ ...actuales, [event.target.name]: '' })); setFeedback(null) }
  function abrirNuevo() { setFormulario(formularioInicial); setErrores({}); setSelectedClientId(null); setFeedback(null); setModalAbierto(true) }
  function cerrarModal() { if (!guardando) setModalAbierto(false) }
  function seleccionarCliente(cliente) { setSelectedClientId(cliente.id); setFormulario({ ...cliente, id: String(cliente.id) }); setErrores({}); setFeedback(null); setModalAbierto(true) }
  function validar() { const nuevosErrores = validarFormulario(formulario); setErrores(nuevosErrores); return Object.keys(nuevosErrores).length === 0 }
  async function manejarGuardar() { if (selectedClientId !== null || !validar()) return; setGuardando(true); try { const datos = { ...formulario }; delete datos.id; await createCliente(datos); await cargarClientes(); setModalAbierto(false); setFormulario(formularioInicial); setFeedback({ type: 'success', text: 'Cliente guardado correctamente.' }) } finally { setGuardando(false) } }
  async function manejarModificar() { if (selectedClientId === null || !validar()) return; setGuardando(true); try { const datos = { ...formulario }; delete datos.id; await updateCliente(selectedClientId, datos); await cargarClientes(); setModalAbierto(false); setFormulario(formularioInicial); setSelectedClientId(null); setFeedback({ type: 'success', text: 'Cliente modificado correctamente.' }) } finally { setGuardando(false) } }
  function solicitarEliminacion() { if (selectedClientId !== null) setConfirmacion(true) }
  async function confirmarEliminacion() { setGuardando(true); try { await deleteCliente(selectedClientId); await cargarClientes(); setConfirmacion(false); setModalAbierto(false); setFormulario(formularioInicial); setSelectedClientId(null); setFeedback({ type: 'success', text: 'Cliente eliminado correctamente.' }) } finally { setGuardando(false) } }

  const clientesFiltrados = clientes.filter((cliente) => `${cliente.razonSocial} ${cliente.cuit}`.toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase()))
  const clienteAEliminar = clientes.find((cliente) => cliente.id === selectedClientId)
  const feedbackStyles = { success: 'border-emerald-200 bg-emerald-50 text-emerald-700', error: 'border-red-200 bg-red-50 text-red-700', info: 'border-blue-200 bg-blue-50 text-blue-700' }
  if (cargando) return <PageLoader label="Cargando clientes..." />
  return <section>
    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h1><p className="mt-2 text-sm text-slate-500">Consultá y administrá tus clientes comerciales.</p></div>
    {feedback && <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${feedbackStyles[feedback.type]}`} role="status">{feedback.text}</div>}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Autocomplete label="Buscar cliente" id="buscar-cliente" value={busqueda} options={clientes} getOptionLabel={(cliente) => cliente.razonSocial} onChange={(texto) => setBusqueda(texto)} placeholder="Escribí una razón social" /></div><Button type="button" onClick={abrirNuevo} className="sm:mb-4 sm:w-auto"><Plus size={17} />Nuevo</Button></div></div>
    <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-800">Clientes registrados</h2><p className="mt-1 text-sm text-slate-500">Seleccioná una fila para modificarla.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{clientesFiltrados.length} registros</span></div><DataTable columns={columnas} rows={clientesFiltrados} onRowClick={seleccionarCliente} selectedRowId={selectedClientId} emptyMessage="No hay clientes que coincidan con la búsqueda." /></div>
    <Modal open={modalAbierto} title={selectedClientId === null ? 'Nuevo cliente' : 'Modificar cliente'} description="Completá los datos del cliente y guardá los cambios." onClose={cerrarModal}><form noValidate onSubmit={(event) => { event.preventDefault(); manejarGuardar() }}><div className="grid grid-cols-1 gap-x-5 md:grid-cols-2"><Input label="Razón social" id="razon-social" name="razonSocial" value={formulario.razonSocial} onChange={manejarCambio} error={errores.razonSocial} placeholder="Ej. Juan Pérez" /><Input label="CUIT" id="cuit" name="cuit" value={formulario.cuit} onChange={manejarCambio} error={errores.cuit} placeholder="20-12345678-9" /><Input label="Teléfono" id="telefono" name="telefono" value={formulario.telefono} onChange={manejarCambio} error={errores.telefono} placeholder="11-2345-6789" /><Input label="Email" id="email" name="email" type="email" value={formulario.email} onChange={manejarCambio} error={errores.email} placeholder="cliente@ejemplo.com" /><Select label="Tipo de cliente" id="tipo-cliente" name="tipoCliente" value={formulario.tipoCliente} onChange={manejarCambio} error={errores.tipoCliente}><option value="">Seleccionar tipo</option><option value="Minorista">Minorista</option><option value="Mayorista">Mayorista</option></Select></div><div className="mt-3 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="secondary" onClick={cerrarModal}>Cancelar</Button>{selectedClientId !== null && <Button type="button" variant="danger" disabled={guardando} onClick={solicitarEliminacion}><Trash2 size={17} />Eliminar</Button>}{selectedClientId !== null ? <Button type="button" variant="primary" loading={guardando} onClick={manejarModificar}><Pencil size={17} />Modificar</Button> : <Button type="submit" variant="success" loading={guardando}><Save size={17} />Guardar</Button>}</div></form></Modal>
    <ConfirmDialog open={confirmacion} title="Eliminar cliente" message={`¿Seguro que deseas eliminar a "${clienteAEliminar?.razonSocial ?? ''}"?`} confirmLabel="Eliminar cliente" confirmVariant="danger" loading={guardando} onConfirm={confirmarEliminacion} onCancel={() => setConfirmacion(false)} />
  </section>
}

export default Clientes
