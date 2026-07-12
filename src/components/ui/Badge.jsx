import { Check } from 'lucide-react'

export default function Badge({ active, label, children, variant = 'status', className = '' }) {
  // Implicit boolean status handling
  if (variant === 'status') {
    return active ? (
      <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 ${className}`}>
        <Check size={10} /> {label || 'Active'}
      </span>
    ) : (
      <span className={`inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 ${className}`}>
        {label || 'Inactive'}
      </span>
    )
  }

  // Predefined color variants
  const variants = {
    blue: "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
    emerald: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
    slate: "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
    rose: "border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
    purple: "border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400",
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${variants[variant]} ${className}`}>
      {children || label}
    </span>
  )
}
