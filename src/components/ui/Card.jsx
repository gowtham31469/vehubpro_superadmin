export default function Card({ children, className = '', noPadding = false, hover = false }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md shadow-sm transition-all overflow-hidden ${hover ? 'hover:border-slate-300 dark:hover:border-white/10 opacity-70 hover:opacity-100' : ''} ${!noPadding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  )
}
