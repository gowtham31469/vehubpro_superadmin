import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { TEAL } from '../brand.js'

/**
 * Fully custom styled select — accepts the same interface as a native <select>:
 *   value, onChange, children (<option value="…">Label</option>)
 */
export default function Select({ value, onChange, children, className = '', disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Parse <option> children into { value, label } pairs
  const options = []
  const nodes = Array.isArray(children) ? children : [children]
  nodes.forEach(node => {
    if (!node) return
    const val   = node.props?.value ?? ''
    const label = node.props?.children ?? val
    options.push({ value: val, label })
  })

  const selected = options.find(o => String(o.value) === String(value)) ?? options[0]

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (opt) => {
    setOpen(false)
    if (onChange) onChange({ target: { value: opt.value } })
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition
          ${open
            ? 'border-blue-500 dark:border-blue-500 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20'
            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-slate-900'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <span className="text-slate-800 dark:text-white">{selected?.label ?? '—'}</span>
        <ChevronDown
          size={15}
          className={`ml-2 flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map(opt => {
              const isSelected = String(opt.value) === String(value)
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => pick(opt)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition
                      ${isSelected
                        ? 'text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                    style={isSelected ? { backgroundColor: TEAL } : undefined}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={13} className="flex-shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
