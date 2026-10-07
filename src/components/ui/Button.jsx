import { LoaderCircle } from 'lucide-react'

const variants = { primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200', success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200', danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200', secondary: 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 focus:ring-slate-200' }

function Button({ children, variant = 'primary', type = 'button', className = '', loading = false, disabled = false, ...props }) { return <button className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant] ?? variants.primary} ${className}`} type={type} disabled={disabled || loading} aria-busy={loading} {...props}>{loading && <LoaderCircle className="animate-spin" size={17} />}{children}</button> }
export default Button
