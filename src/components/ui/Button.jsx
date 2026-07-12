import { ACCENT } from '../../brand.js'

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60"
  
  const variants = {
    primary: "text-white shadow-sm",
    secondary: "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
    danger: "bg-rose-500 text-white shadow-sm hover:bg-rose-600",
    ghost: "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5"
  }

  const style = variant === 'primary' ? { backgroundColor: ACCENT } : {}

  return (
    <button className={`${base} ${variants[variant]} ${className}`} style={style} {...props}>
      {children}
    </button>
  )
}
