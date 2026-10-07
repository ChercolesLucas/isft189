import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Button from './Button'

const iconStyles = { danger: 'bg-red-50 text-red-600', success: 'bg-emerald-50 text-emerald-600', primary: 'bg-blue-50 text-blue-600' }

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', confirmVariant = 'primary', loading = false, onConfirm, onCancel }) {
  if (!open) return null
  const Icon = confirmVariant === 'danger' ? AlertTriangle : CheckCircle2
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5" role="presentation" onMouseDown={(event) => !loading && event.target === event.currentTarget && onCancel()}><section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title"><div className="flex items-start gap-4"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${iconStyles[confirmVariant] ?? iconStyles.primary}`}><Icon size={20} /></span><div><h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p></div></div><div className="mt-6 flex justify-end gap-3"><div className="w-auto"><Button variant="secondary" type="button" disabled={loading} onClick={onCancel}>Cancelar</Button></div><div className="w-auto"><Button variant={confirmVariant} type="button" loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div></div></section></div>
}

export default ConfirmDialog
