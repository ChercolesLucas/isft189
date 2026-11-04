function Modal({ open, title, description, onClose, children }) {
  if (!open) return null

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 sm:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="mx-auto my-6 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:my-10 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><h2 id="modal-title" className="text-lg font-bold text-slate-900">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>
        <button type="button" className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar ventana" onClick={onClose}>×</button>
      </div>
      {children}
    </section>
  </div>
}

export default Modal
