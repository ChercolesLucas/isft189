import { startTransition, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Circle, CircleDot, ClipboardList, Search, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import { InlineLoader, PageLoader } from '../components/ui/Loading'
import { getPedidos } from '../services/pedidos.service'
import { getSeguimientoByPedidoId, obtenerEstadoGeneral, obtenerTotalComercial } from '../services/seguimiento.service'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
const fechaVisible = (fecha) => fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR') : '—'

const iconos = { completed: CheckCircle2, current: CircleDot, pending: Circle, error: XCircle }
const estilosEtapa = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  current: 'border-blue-200 bg-blue-50 text-blue-700',
  pending: 'border-slate-200 bg-slate-50 text-slate-400',
  error: 'border-red-200 bg-red-50 text-red-700',
}
const estilosResumen = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
}

function estadoEtapa(tipo, datos) {
  if (tipo === 'pedido') return 'completed'
  if (tipo === 'cotizacion') {
    if (datos.cotizacion?.estado === 'Rechazada') return 'error'
    return datos.cotizacion ? 'completed' : 'current'
  }
  if (tipo === 'orden') {
    if (datos.ordenCompra?.estado === 'Cancelada') return 'error'
    if (datos.ordenCompra?.estado === 'Pendiente') return 'current'
    return datos.ordenCompra ? 'completed' : datos.cotizacion ? 'current' : 'pending'
  }
  if (tipo === 'remito') {
    if (datos.remito) return 'completed'
    return datos.ordenCompra?.estado === 'Validada' ? 'current' : 'pending'
  }
  if (tipo === 'cobro') {
    if (datos.cobro?.estado === 'Aprobado') return 'completed'
    if (datos.cobro?.estado === 'Rechazado') return 'error'
    return datos.ordenCompra?.estado === 'Validada' || datos.cobro ? 'current' : 'pending'
  }
  if (tipo === 'entrega') {
    if (datos.entrega) return 'completed'
    return datos.remito && datos.cobro?.estado === 'Aprobado' ? 'current' : 'pending'
  }
  if (tipo === 'factura') return datos.factura ? 'completed' : datos.entrega ? 'current' : 'pending'
  return 'pending'
}

function crearEtapas(datos) {
  if (!datos) return []
  return [
    {
      tipo: 'pedido',
      titulo: 'Pedido ingresado',
      detalle: `Pedido ${datos.pedido.numero} · ${fechaVisible(datos.pedido.fecha)}`,
    },
    {
      tipo: 'cotizacion',
      titulo: 'Cotización',
      detalle: datos.cotizacion
        ? `Cotización ${datos.cotizacion.numero} · ${datos.cotizacion.estado} · ${fechaVisible(datos.cotizacion.fecha)}`
        : 'Aún no se generó una cotización.',
    },
    {
      tipo: 'orden',
      titulo: 'Orden de compra',
      detalle: datos.ordenCompra
        ? `${datos.ordenCompra.numero} · ${datos.ordenCompra.estado} · ${fechaVisible(datos.ordenCompra.fecha)}`
        : 'Orden de compra pendiente.',
    },
    {
      tipo: 'remito',
      titulo: 'Stock y remito',
      detalle: datos.remito
        ? `${datos.remito.numero} · ${datos.remito.estado} · ${fechaVisible(datos.remito.fecha)}`
        : 'Remito pendiente.',
    },
    {
      tipo: 'cobro',
      titulo: 'Cobro',
      detalle: datos.cobro
        ? `${datos.cobro.estado}${datos.cobro.medioPago ? ` · ${datos.cobro.medioPago}` : ''} · ${fechaVisible(datos.cobro.fecha)}`
        : 'Cobro pendiente.',
    },
    {
      tipo: 'entrega',
      titulo: 'Entrega',
      detalle: datos.entrega
        ? `${datos.entrega.numero} · Mercadería entregada · ${fechaVisible(datos.entrega.fecha)}`
        : 'Entrega pendiente.',
    },
    {
      tipo: 'factura',
      titulo: 'Facturación',
      detalle: datos.factura
        ? `${datos.factura.numero} · ${datos.factura.estado} · ${fechaVisible(datos.factura.fecha)}`
        : 'Factura pendiente.',
    },
  ]
}

function accionContextual(datos, estadoGeneral) {
  if (!datos || estadoGeneral.tone === 'danger' || datos.factura) return null
  if (!datos.cotizacion || datos.cotizacion.estado === 'Generada') return ['Ir a Cotizaciones', '/cotizaciones']
  if (!datos.ordenCompra || datos.ordenCompra.estado === 'Pendiente') return ['Ir a Órdenes de Compra', '/ordenes-compra']
  if (datos.ordenCompra.estado === 'Validada' && !datos.remito) return ['Ir a Stock', '/stock']
  if (!datos.cobro || datos.cobro.estado === 'Pendiente') return ['Ir a Cobros', '/cobros']
  if (datos.remito && datos.cobro.estado === 'Aprobado' && !datos.entrega) return ['Ir a Almacén', '/almacen']
  if (datos.entrega && !datos.factura) return ['Ir a Facturación', '/facturacion']
  return null
}

function Seguimiento() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [pedidoId, setPedidoId] = useState('')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPedidos()
      .then((resultado) => startTransition(() => {
        setPedidos(resultado)
        setCargando(false)
      }))
      .catch(() => {
        setError('No se pudieron cargar los pedidos.')
        setCargando(false)
      })
  }, [])

  async function seleccionarPedido(event) {
    const valor = event.target.value
    setPedidoId(valor)
    setDatos(null)
    setError('')
    if (!valor) return
    setCargandoDetalle(true)
    try {
      setDatos(await getSeguimientoByPedidoId(Number(valor)))
    } catch (err) {
      setError(err.message || 'No se pudo cargar el seguimiento de la operación.')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const estadoGeneral = obtenerEstadoGeneral(datos)
  const etapas = useMemo(() => crearEtapas(datos), [datos])
  const estadosEtapas = etapas.map((etapa) => ({ ...etapa, estado: estadoEtapa(etapa.tipo, datos) }))
  const completadas = estadosEtapas.filter((etapa) => etapa.estado === 'completed').length
  const accion = accionContextual(datos, estadoGeneral)

  if (cargando) return <PageLoader label="Cargando seguimiento..." />

  return (
    <section>
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">Consulta operativa</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Seguimiento de operación</h1>
        <p className="mt-2 text-sm text-slate-500">Consultá el estado y la trazabilidad completa de una operación comercial.</p>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
        <Select label="Pedido" id="seguimiento-pedido" value={pedidoId} onChange={seleccionarPedido}>
          <option value="">Seleccionar pedido</option>
          {pedidos.map((pedido) => (
            <option key={pedido.id} value={pedido.id}>
              Pedido {pedido.numero} - {pedido.cliente || 'Cliente'} - {moneda.format(pedido.total)}
            </option>
          ))}
        </Select>
      </div>

      {cargandoDetalle && <div className="mt-6"><InlineLoader label="Cargando seguimiento..." /></div>}

      {!datos && !cargandoDetalle && (
        <div className="mt-7 grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div>
            <Search className="mx-auto text-slate-400" size={38} />
            <h2 className="mt-4 text-base font-semibold text-slate-700">Seleccioná un pedido</h2>
            <p className="mt-2 text-sm text-slate-500">Seleccioná un pedido para consultar su seguimiento.</p>
          </div>
        </div>
      )}

      {datos && (
        <>
          <div className={`mt-7 rounded-xl border p-5 shadow-sm sm:p-7 ${estilosResumen[estadoGeneral.tone] ?? estilosResumen.neutral}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-75">Estado de la operación</p>
                <h2 className="mt-2 text-xl font-bold">{estadoGeneral.label}</h2>
                <p className="mt-1 text-sm">{estadoGeneral.description}</p>
              </div>
              <StatusBadge status={estadoGeneral.tone}>{estadoGeneral.label}</StatusBadge>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs font-semibold">
                <span>Progreso</span>
                <span>{completadas} / 7 etapas completadas</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-current transition-all" style={{ width: `${(completadas / 7) * 100}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <ClipboardList className="text-blue-600" size={20} />
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Línea de tiempo</h2>
                  <p className="text-sm text-slate-500">Avance de la operación comercial</p>
                </div>
              </div>
              <div>
                {estadosEtapas.map((etapa, index) => {
                  const Icon = iconos[etapa.estado]
                  return (
                    <div className="flex gap-4" key={etapa.tipo}>
                      <div className="flex w-7 shrink-0 flex-col items-center">
                        <span className={`grid size-7 place-items-center rounded-full border ${estilosEtapa[etapa.estado]}`}><Icon size={16} /></span>
                        {index < estadosEtapas.length - 1 && <span className={`my-1 h-10 w-px ${etapa.estado === 'completed' ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
                      </div>
                      <div className="pb-7">
                        <h3 className={`text-sm font-semibold ${etapa.estado === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>{etapa.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-500">{etapa.detalle}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-7">
              <h2 className="text-base font-semibold text-slate-800">Resumen de la operación</h2>
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  ['Cliente', datos.cliente?.razonSocial],
                  ['Pedido', datos.pedido?.numero],
                  ['Cotización', datos.cotizacion?.numero],
                  ['Orden de compra', datos.ordenCompra?.numero],
                  ['Remito', datos.remito?.numero],
                  ['Cobro', datos.cobro?.estado],
                  ['Entrega', datos.entrega?.numero],
                  ['Factura', datos.factura?.numero],
                ].map(([label, valor]) => (
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3" key={label}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-700">{valor || '—'}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 pt-1">
                  <dt className="font-semibold text-slate-700">Total comercial</dt>
                  <dd className="font-bold text-slate-900">{moneda.format(obtenerTotalComercial(datos))}</dd>
                </div>
              </dl>
              {accion && (
                <button type="button" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700" onClick={() => navigate(accion[1])}>
                  {accion[0]} <ArrowRight size={17} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default Seguimiento
