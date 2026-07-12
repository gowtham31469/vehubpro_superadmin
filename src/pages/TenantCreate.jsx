import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { ChevronLeft, ChevronRight, Check, Upload, X } from 'lucide-react'
import {
  createTenant, createTenantPII,
  createTenantBranding,
  fetchPlans, createSubscription,
  fetchModules, createTenantModule,
} from '../utils/api.js'
import { ACCENT, PURPLE } from '../brand.js'
const DOMAIN_SFX = '.vehubpro.com'

const STEPS = [
  { id: 1, title: 'Basic Info',    sub: 'Details' },
  { id: 2, title: 'Subscription',  sub: 'Plan' },
  { id: 3, title: 'Configuration', sub: 'Modules' },
  { id: 4, title: 'Branding',      sub: 'Identity' },
  { id: 5, title: 'Organization',  sub: 'PII / Contact' },
  { id: 6, title: 'Review',        sub: 'Confirm' },
]

const EMPTY = {
  name: '', subdomain: '',
  plan: null,
  selectedModules: [],
  primary_color: PURPLE, logo_file: null, dark_logo_file: null, favicon_file: null,
  contact_name: '', email: '', phone: '', address: '', gstin: '',
}

// ─── field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {required && <span className="mr-1 text-rose-500">*</span>}{label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

const inp = 'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950/50'

// ─── file upload widget ────────────────────────────────────────────────────────
function FileUpload({ label, hint, file, onChange, accept = 'image/*' }) {
  const preview = file ? URL.createObjectURL(file) : null
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <label className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition ${
        file ? 'border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}>
        <input type="file" accept={accept} className="sr-only" onChange={e => onChange(e.target.files?.[0] ?? null)} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt={label} className="mx-auto max-h-16 max-w-full rounded-lg object-contain" />
            <button
              type="button"
              onClick={e => { e.preventDefault(); onChange(null) }}
              className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-0.5 text-white"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={20} className="text-slate-400" />
            <span className="text-xs text-slate-400">Click to upload</span>
          </>
        )}
      </label>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {file && <p className="mt-1 text-[11px] text-emerald-600 truncate">{file.name}</p>}
    </div>
  )
}

// ─── steps ─────────────────────────────────────────────────────────────────────

function StepBasicInfo({ data, set }) {
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Tenant Basics</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The core identity of this tenant on the platform.</p></div>
      <Field label="Tenant Name" required>
        <input required className={inp} value={data.name} onChange={e => set('name', e.target.value)} placeholder="Acme Corp" />
      </Field>
      <Field label="Domain" required hint={`Tenant portal: ${data.subdomain || 'subdomain'}${DOMAIN_SFX}`}>
        <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-950/50 transition">
          <input
            required
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none lowercase dark:text-white"
            value={data.subdomain}
            onChange={e => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="acme"
          />
          <span className="flex items-center border-l border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 px-4 text-sm text-slate-400 dark:text-slate-500 select-none">{DOMAIN_SFX}</span>
        </div>
      </Field>
    </div>
  )
}

function StepSubscription({ data, set, plans, loading }) {
  const CYC = { monthly: 'mo', yearly: 'yr', lifetime: 'once' }
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the billing plan for this tenant. You can update this later.</p></div>
      {loading
        ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
        : (
          <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            <button type="button" onClick={() => set('plan', null)}
              className={`rounded-xl border p-4 text-left transition ${!data.plan ? 'border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 text-white' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20'}`}>
              <p className="font-semibold text-sm dark:text-white">No Plan</p>
              <p className={`text-xs mt-1 ${!data.plan ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>Assign later</p>
            </button>
            {plans.map(p => {
              const sel = data.plan?.id === p.id
              return (
                <button key={p.id} type="button" onClick={() => set('plan', p)}
                  className={`rounded-xl border p-4 text-left transition ${sel ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-600/20 text-white dark:text-blue-100' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm leading-tight ${sel ? '' : 'dark:text-white'}`}>{p.name}</p>
                    {sel && <Check size={14} className="flex-shrink-0 mt-0.5" />}
                  </div>
                  <p className={`mt-2 text-lg font-bold ${sel ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {p.is_custom ? 'Custom' : `₹${Number(p.price).toLocaleString('en-IN')}`}
                    {!p.is_custom && <span className={`text-xs font-normal ml-1 ${sel ? 'text-blue-200 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`}>/{CYC[p.billing_cycle] ?? p.billing_cycle}</span>}
                  </p>
                  <p className={`text-xs mt-1 ${sel ? 'text-blue-200 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`}>
                    {p.max_users === 0 ? 'Unlimited' : p.max_users} users · {p.max_vehicles === 0 ? 'Unlimited' : p.max_vehicles} vehicles
                  </p>
                </button>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

function StepModules({ data, set, modules, loading }) {
  const toggle = mod => {
    const has = data.selectedModules.find(m => m.id === mod.id)
    set('selectedModules', has ? data.selectedModules.filter(m => m.id !== mod.id) : [...data.selectedModules, mod])
  }
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Module Configuration</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select which platform modules to enable for this tenant.</p></div>
      {loading
        ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
        : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {modules.map(mod => {
              const sel = !!data.selectedModules.find(m => m.id === mod.id)
              return (
                <button key={mod.id} type="button" onClick={() => toggle(mod)}
                  className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition ${sel ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${sel ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {sel ? <Check size={16} /> : mod.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${sel ? 'text-slate-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>{mod.name}</p>
                    <p className={`text-xs font-mono ${sel ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`}>{mod.key}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border flex-shrink-0 ${sel ? 'border-blue-300 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                    {sel ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              )
            })}
          </div>
        )
      }
      {data.selectedModules.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{data.selectedModules.length} module{data.selectedModules.length !== 1 ? 's' : ''} selected</p>}
    </div>
  )
}

function StepBranding({ data, set }) {
  const PRESETS = [PURPLE,'#C82909','#059669','#7c3aed','#0891b2','#d97706','#374151','#000000']
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Brand Identity</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Logos and primary colour for the tenant's portal.</p></div>

      {/* Logo uploads */}
      <div className="grid grid-cols-3 gap-4">
        <FileUpload
          label="Light Logo"
          hint="Used on dark backgrounds"
          file={data.logo_file}
          onChange={f => set('logo_file', f)}
        />
        <FileUpload
          label="Dark Logo"
          hint="Used on light backgrounds"
          file={data.dark_logo_file}
          onChange={f => set('dark_logo_file', f)}
        />
        <FileUpload
          label="Favicon"
          hint="Square, min 32×32 px"
          file={data.favicon_file}
          onChange={f => set('favicon_file', f)}
        />
      </div>

      {/* Color */}
      <Field label="Primary Color">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex-shrink-0" style={{ backgroundColor: data.primary_color }} />
            <input type="color" value={data.primary_color} onChange={e => set('primary_color', e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 p-1 flex-shrink-0 bg-white dark:bg-slate-900" />
            <input className={`${inp} w-32 font-mono uppercase flex-shrink-0`} value={data.primary_color} onChange={e => set('primary_color', e.target.value)} maxLength={7} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(c => (
              <button key={c} type="button" onClick={() => set('primary_color', c)}
                className={`h-7 w-7 rounded-lg border-2 transition hover:scale-110 ${data.primary_color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </Field>

      {/* Preview */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Preview</p>
        <div
          className="flex items-center gap-3 rounded-lg border-l-4 bg-slate-100 dark:bg-slate-800 px-4 py-3"
          style={{ borderLeftColor: data.primary_color }}
        >
          {data.logo_file
            ? <img src={URL.createObjectURL(data.logo_file)} alt="logo" className="h-8 max-w-[120px] object-contain" />
            : <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold" style={{ backgroundColor: data.primary_color }}>{data.name?.[0]?.toUpperCase() ?? 'T'}</div>
          }
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.name || 'Tenant Name'}</p>
            <p className="text-xs" style={{ color: data.primary_color }}>{data.subdomain || 'subdomain'}{DOMAIN_SFX}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepOrganization({ data, set }) {
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Details</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Contact and PII information. All fields are required and stored encrypted.</p></div>
      <Field label="Contact Name" required>
        <input required className={inp} value={data.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="John Doe" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" required>
          <input required type="email" className={inp} value={data.email} onChange={e => set('email', e.target.value)} placeholder="john@acme.com" />
        </Field>
        <Field label="Phone" required>
          <input required className={inp} value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
        </Field>
      </div>
      <Field label="Address" required>
        <textarea required rows={2} className={inp} value={data.address} onChange={e => set('address', e.target.value)} placeholder="Chennai, Tamil Nadu, India" />
      </Field>
      <Field label="GSTIN" required hint="15-character GST identification number">
        <input
          required
          className={`${inp} font-mono uppercase`}
          value={data.gstin}
          onChange={e => set('gstin', e.target.value.toUpperCase())}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          minLength={15}
        />
      </Field>
    </div>
  )
}

function StepReview({ data }) {
  const Section = ({ title, rows }) => (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{title}</p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(([label, value]) => value ? (
          <div key={label} className="flex items-start gap-4 px-4 py-3">
            <p className="w-32 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">{label}</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 break-all">{value}</p>
          </div>
        ) : null)}
      </div>
    </div>
  )
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & Confirm</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Check all details before creating the tenant.</p></div>
      <Section title="Basic Info" rows={[['Tenant Name', data.name], ['Domain', `${data.subdomain}${DOMAIN_SFX}`]]} />
      <Section title="Subscription" rows={[
        ['Plan', data.plan ? `${data.plan.name} — ₹${Number(data.plan.price).toLocaleString('en-IN')}` : 'None (assign later)'],
        ['Billing Cycle', data.plan?.billing_cycle],
      ]} />
      <Section title="Modules" rows={[['Enabled', data.selectedModules.length > 0 ? data.selectedModules.map(m => m.name).join(', ') : 'None selected']]} />
      <Section title="Branding" rows={[
        ['Light Logo', data.logo_file?.name],
        ['Dark Logo', data.dark_logo_file?.name],
        ['Favicon', data.favicon_file?.name],
        ['Primary Color', data.primary_color],
      ]} />
      <Section title="Organization" rows={[
        ['Contact', data.contact_name],
        ['Email', data.email],
        ['Phone', data.phone],
        ['Address', data.address],
        ['GSTIN', data.gstin],
      ]} />
    </div>
  )
}

// ─── main wizard page ──────────────────────────────────────────────────────────

export default function TenantCreate() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(1)
  const [data, setData]   = useState(EMPTY)
  const [plans, setPlans] = useState([])
  const [modules, setModules] = useState([])
  const [loadingPlans, setLoadingPlans]     = useState(false)
  const [loadingModules, setLoadingModules] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    setLoadingPlans(true)
    fetchPlans().then(d => setPlans((d.results ?? []).filter(p => p.is_active))).catch(() => {}).finally(() => setLoadingPlans(false))
    setLoadingModules(true)
    fetchModules().then(d => setModules(d.results ?? [])).catch(() => {}).finally(() => setLoadingModules(false))
  }, [])

  const set = (key, value) => setData(d => ({ ...d, [key]: value }))

  const canNext = () => {
    if (step === 1) return data.name.trim() && data.subdomain.trim()
    if (step === 5) return data.contact_name && data.email && data.phone && data.address && data.gstin.length === 15
    return true
  }

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, 6)) }
  const back = () => setStep(s => Math.max(s - 1, 1))

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // 1. Tenant
      const tenant   = await createTenant({ name: data.name.trim(), domain: `${data.subdomain.trim()}${DOMAIN_SFX}`, status: 'active' })
      const tenantId = tenant.id

      // 2. PII (all required)
      await createTenantPII({
        tenant: tenantId,
        contact_name: data.contact_name,
        email:        data.email,
        phone:        data.phone,
        address:      data.address,
        gstin:        data.gstin,
      })

      // 3. Branding (multipart)
      const fd = new FormData()
      fd.append('tenant', tenantId)
      fd.append('primary_color', data.primary_color)
      if (data.logo_file)       fd.append('logo_file',       data.logo_file)
      if (data.dark_logo_file)  fd.append('dark_logo_file',  data.dark_logo_file)
      if (data.favicon_file)    fd.append('favicon_file',    data.favicon_file)
      await createTenantBranding(fd)

      // 4. Subscription
      if (data.plan) {
        const start = new Date()
        const end   = new Date(start)
        if (data.plan.billing_cycle === 'monthly')       end.setMonth(end.getMonth() + 1)
        else if (data.plan.billing_cycle === 'yearly')   end.setFullYear(end.getFullYear() + 1)
        else                                             end.setFullYear(end.getFullYear() + 10)
        await createSubscription({
          tenant: tenantId, plan: data.plan.id,
          billing_cycle: data.plan.billing_cycle, price: data.plan.price,
          max_users: data.plan.max_users, max_vehicles: data.plan.max_vehicles,
          status: 'active',
          start_date: start.toISOString().split('T')[0],
          end_date:   end.toISOString().split('T')[0],
        })
      }

      // 5. Modules
      for (const [i, mod] of data.selectedModules.entries()) {
        await createTenantModule({ tenant: tenantId, module: mod.id, priority: i + 1 })
      }

      navigate('/tenants')
    } catch (err) {
      setError(err.message || 'Failed to create tenant. Please try again.')
      setStep(6)
    } finally {
      setSubmitting(false)
    }
  }

  const NEXT_LABEL = { 1: 'Next: Subscription', 2: 'Next: Configuration', 3: 'Next: Branding', 4: 'Next: Organization', 5: 'Next: Review' }

  return (
    <Shell>
      {/* Escape Shell's p-6 padding and fill exactly the available height (viewport minus h-20 header) */}
      <div className="flex -m-6" style={{ height: 'calc(100vh - 80px)' }}>

        {/* Step navigator */}
        <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 px-7 py-8 flex flex-col">
          <div className="mb-8">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Create New Tenant</h1>
          </div>
          <nav className="flex-1 space-y-0.5">
            {STEPS.map((s, idx) => {
              const done    = step > s.id
              const current = step === s.id
              return (
                <div key={s.id} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                      done    ? 'border-slate-800 dark:border-white/10 bg-slate-800 dark:bg-slate-800 text-white'
                      : current ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      {done ? <Check size={12} /> : s.id}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`mt-0.5 w-px flex-1 min-h-[24px] ${done ? 'bg-slate-800 dark:bg-slate-700' : 'bg-slate-200 dark:bg-white/10'}`} />
                    )}
                  </div>
                  <div className="pb-6 pt-0.5">
                    <p className={`text-sm font-semibold leading-none ${current ? 'text-slate-900 dark:text-white' : done ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>{s.title}</p>
                    <p className={`mt-0.5 text-xs ${current ? 'text-slate-400 dark:text-slate-500' : 'text-slate-300 dark:text-slate-700'}`}>{s.sub}</p>
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Step content */}
        <div className="flex flex-1 flex-col bg-white dark:bg-slate-900 overflow-hidden">
          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            {error && (
              <div className="mb-6 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">{error}</div>
            )}
            {step === 1 && <StepBasicInfo data={data} set={set} />}
            {step === 2 && <StepSubscription data={data} set={set} plans={plans} loading={loadingPlans} />}
            {step === 3 && <StepModules data={data} set={set} modules={modules} loading={loadingModules} />}
            {step === 4 && <StepBranding data={data} set={set} />}
            {step === 5 && <StepOrganization data={data} set={set} />}
            {step === 6 && <StepReview data={data} />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 px-10 py-4 bg-white dark:bg-slate-900">
            <button
              onClick={step === 1 ? () => navigate('/tenants') : back}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft size={15} />{step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 6 ? (
              <button
                onClick={next}
                disabled={!canNext()}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40 transition"
                style={{ backgroundColor: ACCENT }}
              >
                {NEXT_LABEL[step]} <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60 transition"
                style={{ backgroundColor: '#059669' }}
              >
                <Check size={15} /> {submitting ? 'Creating…' : 'Create Tenant'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
