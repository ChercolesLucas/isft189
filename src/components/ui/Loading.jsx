import { LoaderCircle } from 'lucide-react'

export function InlineLoader({ label = 'Cargando...' }) {
  return <span className="inline-flex items-center gap-2 text-sm text-slate-500" role="status"><LoaderCircle className="animate-spin" size={17} />{label}</span>
}

export function PageLoader({ label = 'Cargando información...' }) {
  return <section className="grid min-h-72 place-items-center"><div className="text-center" role="status"><LoaderCircle className="mx-auto animate-spin text-blue-600" size={34} /><p className="mt-3 text-sm font-medium text-slate-500">{label}</p></div></section>
}
