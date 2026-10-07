import { startTransition, useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import DataTable from '../components/ui/DataTable'
import Input from '../components/ui/Input'
import { PageLoader } from '../components/ui/Loading'
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
  const [formulario, setFormulario] = useState(formularioInicial)
  const [errores, setErrores] = useState({})
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [confirmacion, setConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  async function cargarClientes() { setClientes(await getClientes()) }
  useEffect(() => { getClientes().then((datos) => startTransition(() => setClientes(datos))).finally(() => setCargando(false)) }, [])

  function manejarCambio(event) { setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value })); setErrores((actuales) => ({ ...actuales, [event.target.name]: '' })); setFeedback(null) }
  function limpiarFormulario() { setFormulario(formularioInicial); setErrores({}); setSelectedClientId(null); setFeedback(null) }
  function seleccionarCliente(cliente) { setSelectedClientId(cliente.id); setFormulario({ ...cliente, id: String(cliente.id) }); setErrores({}); setFeedback(null) }
  function validar() { const nuevosErrores = validarFormulario(formulario); setErrores(nuevosErrores); return Object.keys(nuevosErrores).length === 0 }

  async function manejarGuardar() { if (selectedClientId !== null) return; if (!validar()) return; setGuardando(true); try { const datos = { ...formulario }; delete datos.id; await createCliente(datos); await cargarClientes(); limpiarFormulario(); setFeedback({ type: 'success', text: 'Cliente guardado correctamente.' }) } finally { setGuardando(false) } }
  async function manejarModificar() { if (selectedClientId === null) { setFeedback({ type: 'info', text: 'Seleccioná un cliente para modificar.' }); return } if (!validar()) return; setGuardando(true); try { const datos = { ...formulario }; delete datos.id; await updateCliente(selectedClientId, datos); await cargarClientes(); limpiarFormulario(); setFeedback({ type: 'success', text: 'Cliente modificado correctamente.' }) } finally { setGuardando(false) } }
  function solicitarEliminacion() { if (selectedClientId === null) { setFeedback({ type: 'info', text: 'Seleccioná un cliente para eliminar.' }); return } setConfirmacion(true) }
  async function confirmarEliminacion() { setGuardando(true); try { await deleteCliente(selectedClientId); await cargarClientes(); setConfirmacion(false); limpiarFormulario(); setFeedback({ type: 'success', text: 'Cliente eliminado correctamente.' }) } finally { setGuardando(false) } }

  const feedbackStyles = { success: 'border-emerald-200 bg-emerald-50 text-emerald-700', error: 'border-red-200 bg-red-50 text-red-700', info: 'border-blue-200 bg-blue-50 text-blue-700' }
  const clienteAEliminar = clientes.find((cliente) => cliente.id === selectedClientId)
  if (cargando) return <PageLoader label="Cargando clientes..." />

  return <section>
    <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Módulo comercial</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h1><p className="mt-2 text-sm text-slate-500">Gestión de clientes comerciales</p></div>
    {feedback && <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${feedbackStyles[feedback.type]}`} role="status">{feedback.text}</div>}
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
      <h2 className="mb-6 text-base font-semibold text-slate-800">Datos del cliente</h2>
      <form noValidate onSubmit={(event) => { event.preventDefault(); manejarGuardar() }}>
        <div className="grid grid-cols-1 gap-x-5 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-5"><Input label="Razón social" id="razon-social" name="razonSocial" value={formulario.razonSocial} onChange={manejarCambio} error={errores.razonSocial} placeholder="Ej. Juan Pérez" /></div>
          <div className="lg:col-span-2"><Input label="CUIT" id="cuit" name="cuit" value={formulario.cuit} onChange={manejarCambio} error={errores.cuit} placeholder="20-12345678-9" /></div>
          <div className="lg:col-span-2"><Input label="Teléfono" id="telefono" name="telefono" value={formulario.telefono} onChange={manejarCambio} error={errores.telefono} placeholder="11-2345-6789" /></div>
          <div className="lg:col-span-4"><Input label="Email" id="email" name="email" type="email" value={formulario.email} onChange={manejarCambio} error={errores.email} placeholder="cliente@ejemplo.com" /></div>
          <div className="lg:col-span-2"><Select label="Tipo de cliente" id="tipo-cliente" name="tipoCliente" value={formulario.tipoCliente} onChange={manejarCambio} error={errores.tipoCliente}><option value="">Seleccionar tipo</option><option value="Minorista">Minorista</option><option value="Mayorista">Mayorista</option></Select></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 border-t border-slate-100 pt-6"><div className="w-full sm:w-auto"><Button type="button" variant="primary" className="sm:w-auto" onClick={limpiarFormulario}><Plus size={17} />Nuevo</Button></div><div className="w-full sm:w-auto"><Button type="submit" variant="success" loading={guardando && selectedClientId === null} disabled={selectedClientId !== null} className="sm:w-auto"><Save size={17} />Guardar</Button></div><div className="w-full sm:w-auto"><Button type="button" variant="secondary" loading={guardando && selectedClientId !== null && !confirmacion} disabled={selectedClientId === null} className="sm:w-auto" onClick={manejarModificar}><Pencil size={17} />Modificar</Button></div><div className="w-full sm:w-auto"><Button type="button" variant="danger" disabled={selectedClientId === null || guardando} className="sm:w-auto" onClick={solicitarEliminacion}><Trash2 size={17} />Eliminar</Button></div></div>
      </form>
    </div>
    <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-slate-800">Clientes registrados</h2><p className="mt-1 text-sm text-slate-500">Seleccioná una fila para ver o editar sus datos.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{clientes.length} registros</span></div><DataTable columns={columnas} rows={clientes} onRowClick={seleccionarCliente} selectedRowId={selectedClientId} emptyMessage="No hay clientes registrados." /></div>
    <ConfirmDialog open={confirmacion} title="Eliminar cliente" message={`¿Seguro que deseas eliminar a "${clienteAEliminar?.razonSocial ?? ''}"?`} confirmLabel="Eliminar cliente" confirmVariant="danger" loading={guardando} onConfirm={confirmarEliminacion} onCancel={() => setConfirmacion(false)} />
  </section>
}

export default Clientes
