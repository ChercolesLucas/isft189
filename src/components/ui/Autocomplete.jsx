import { useEffect, useRef, useState } from 'react'

function Autocomplete({ label, id, value, options, getOptionLabel, onChange, placeholder, error }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  const texto = value ?? ''
  const sugerencias = options.filter((option) => getOptionLabel(option).toLocaleLowerCase().includes(texto.trim().toLocaleLowerCase())).slice(0, 8)

  useEffect(() => {
    function cerrar(event) { if (!ref.current?.contains(event.target)) setAbierto(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  return <div ref={ref} className="relative mb-4">
    <label className="mb-2 block text-xs font-semibold text-slate-600" htmlFor={id}>{label}</label>
    <input id={id} value={texto} placeholder={placeholder} autoComplete="off" onFocus={() => setAbierto(true)} onChange={(event) => { onChange(event.target.value); setAbierto(true) }} className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${error ? 'border-red-400' : 'border-slate-200'}`} />
    {abierto && texto.trim() && sugerencias.length > 0 && <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg" role="listbox">{sugerencias.map((option) => <li key={option.id}><button type="button" className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(getOptionLabel(option), option); setAbierto(false) }}>{getOptionLabel(option)}</button></li>)}</ul>}
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </div>
}

export default Autocomplete
