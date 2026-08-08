import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Shell from '../components/Shell.jsx'
import { ArrowLeft, Check, Upload, X } from 'lucide-react'
import Select from '../components/Select.jsx'
import {
  fetchTenant, updateTenant,
  fetchTenantPII, createTenantPII, updateTenantPII,
  fetchTenantBranding, createTenantBranding, updateTenantBranding,
  fetchTenantInvoiceSettings, createTenantInvoiceSettings, updateTenantInvoiceSettings,
  fetchPlans, fetchTenantSubscriptions, createSubscription, updateSubscription,
  fetchModules, fetchTenantModules, createTenantModule, deleteTenantModule,
} from '../utils/api.js'
import { ACCENT, PURPLE, TEAL } from '../brand.js'


// Convert absolute Django media URLs to path-only so Vite proxy (or same-origin Django) can serve them
function toProxiedUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.pathname  // '/media/branding/...'
  } catch {
    return url  // already relative or S3 presigned URL — use as-is
  }
}

// ─── shared ────────────────────────────────────────────────────────────────────

const inp = 'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950/50'
const inpReadonly = 'w-full rounded-xl border border-slate-100 dark:border-white/5 bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-200 cursor-default select-none overflow-auto'

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {required && <span className="mr-1 text-rose-500">*</span>}{label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

function SectionCard({ title, description, children, onSave, saving, saved, error, saveLabel }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 shadow-sm">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/60">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">{description}</p>
      </div>
      <div className="px-8 py-6 space-y-5">
        {children}
      </div>
      <div className="flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800/60 px-8 py-4">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check size={14} /> Saved successfully
          </span>
        )}
        {error && <span className="text-sm text-rose-600">{error}</span>}
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition"
          style={{ backgroundColor: ACCENT }}
        >
          {saving ? 'Saving…' : (saveLabel ?? `Update ${title}`)}
        </button>
      </div>
    </div>
  )
}

function useSaveState() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  const run = async (fn) => {
    setSaving(true); setSaved(false); setError('')
    try {
      await fn()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }
  return { saving, saved, error, run }
}

// ─── file upload widget ────────────────────────────────────────────────────────

function FileUpload({ label, hint, file, existingUrl, onChange }) {
  const preview = file ? URL.createObjectURL(file) : existingUrl ?? null
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <label className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition ${
        preview ? 'border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}>
        <input type="file" accept="image/*" className="sr-only" onChange={e => onChange(e.target.files?.[0] ?? null)} />
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

// ─── sections ──────────────────────────────────────────────────────────────────

function BasicInfoSection({ tenant, onSaved }) {
  const [form, setForm] = useState({ name: '', status: 'active' })
  const { saving, saved, error, run } = useSaveState()
  useEffect(() => {
    if (tenant) setForm({ name: tenant.name, status: tenant.status })
  }, [tenant])

  const save = () => run(async () => {
    await updateTenant(tenant.id, form)
    onSaved({ ...tenant, ...form })
  })

  return (
    <SectionCard
      title="Basic Information"
      description="Core tenant details and status."
      onSave={save} saving={saving} saved={saved} error={error}
      saveLabel="Update Basic Info"
    >
      <div className="grid grid-cols-2 gap-5">
        <Field label="Tenant Name" required>
          <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Domain" hint="Domain cannot be changed after creation.">
          <span className={`${inpReadonly} font-mono`}>{tenant?.domain}</span>
        </Field>
      </div>
      <Field label="Status">
        <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </Field>
    </SectionCard>
  )
}

function SubscriptionSection({ tenantId, plans, loadingPlans }) {
  const [subscription, setSubscription] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const { saving, saved, error, run } = useSaveState()
  const CYC = { monthly: 'mo', yearly: 'yr', lifetime: 'once' }

  // Custom / editable subscription fields
  const today = new Date().toISOString().split('T')[0]
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  const [customFields, setCustomFields] = useState({
    start_date: today, end_date: nextYear,
    billing_cycle: 'monthly', price: '', max_users: '', max_vehicles: '',
  })
  const setC = k => e => setCustomFields(f => ({ ...f, [k]: e.target.value }))

  const isCustomPlan = selectedPlan?.is_custom === true
  const showCustomFields = !selectedPlan || isCustomPlan  // no-plan or custom plan

  useEffect(() => {
    if (!tenantId) return
    fetchTenantSubscriptions(tenantId)
      .then(d => {
        const active = (d.results ?? []).find(s => s.status === 'active') ?? (d.results ?? [])[0] ?? null
        setSubscription(active)
        if (active) {
          // plan_details is the nested plan object returned by TenantSubscriptionSerializer
          setSelectedPlan(active.plan_details ?? null)
          setCustomFields({
            start_date:    active.start_date    ?? today,
            end_date:      active.end_date      ?? nextYear,
            billing_cycle: active.billing_cycle ?? 'monthly',
            price:         active.price         ?? '',
            max_users:     active.max_users     ?? '',
            max_vehicles:  active.max_vehicles  ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  // When a plan is selected, pre-fill the custom fields from the plan defaults
  const handleSelectPlan = (p) => {
    setSelectedPlan(p)
    if (p) {
      const start = new Date()
      const end = new Date(start)
      if (p.billing_cycle === 'monthly')  end.setMonth(end.getMonth() + 1)
      else if (p.billing_cycle === 'yearly') end.setFullYear(end.getFullYear() + 1)
      else end.setFullYear(end.getFullYear() + 10)
      setCustomFields(f => ({
        ...f,
        billing_cycle: p.billing_cycle ?? f.billing_cycle,
        price:         p.is_custom ? f.price : (p.price ?? f.price),
        max_users:     p.is_custom ? f.max_users : (p.max_users ?? f.max_users),
        max_vehicles:  p.is_custom ? f.max_vehicles : (p.max_vehicles ?? f.max_vehicles),
        start_date:    start.toISOString().split('T')[0],
        end_date:      end.toISOString().split('T')[0],
      }))
    }
  }

  const save = () => run(async () => {
    const payload = {
      tenant:        tenantId,
      plan:          selectedPlan?.id ?? null,
      billing_cycle: isCustomPlan || !selectedPlan ? customFields.billing_cycle : (selectedPlan?.billing_cycle ?? 'monthly'),
      price:         isCustomPlan || !selectedPlan ? customFields.price         : (selectedPlan?.price ?? '0.00'),
      max_users:     isCustomPlan || !selectedPlan ? Number(customFields.max_users)    : (selectedPlan?.max_users ?? 0),
      max_vehicles:  isCustomPlan || !selectedPlan ? Number(customFields.max_vehicles) : (selectedPlan?.max_vehicles ?? 0),
      status:        'active',
      start_date:    customFields.start_date,
      end_date:      customFields.end_date,
    }

    if (subscription?.id) await updateSubscription(subscription.id, payload)
    else {
      const created = await createSubscription(payload)
      setSubscription(created)
    }
  })

  return (
    <SectionCard
      title="Subscription Plan"
      description="Billing plan assigned to this tenant."
      onSave={save} saving={saving} saved={saved} error={error}
      saveLabel="Update Subscription"
    >
      {loading || loadingPlans
        ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
        : (
          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            <button type="button" onClick={() => { setSelectedPlan(null) }}
              className={`rounded-xl border p-4 text-left transition ${!selectedPlan ? 'border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 text-white' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20'}`}>
              <p className="font-semibold text-sm dark:text-white">No Plan</p>
              <p className={`text-xs mt-1 ${!selectedPlan ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>Assign later</p>
            </button>
            {plans.map(p => {
              const sel = selectedPlan?.id === p.id
              return (
                <button key={p.id} type="button" onClick={() => handleSelectPlan(p)}
                  className={`rounded-xl border p-4 text-left transition ${sel ? 'text-white border-transparent' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20'}`}
                  style={sel ? { backgroundColor: TEAL } : undefined}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm leading-tight ${sel ? 'text-white' : 'dark:text-white'}`}>{p.name}</p>
                    {sel && <Check size={14} className="flex-shrink-0 mt-0.5" />}
                  </div>
                  <p className={`mt-2 text-lg font-bold ${sel ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {p.is_custom ? 'Custom Pricing' : `₹${Number(p.price).toLocaleString('en-IN')}`}
                    {!p.is_custom && <span className={`text-xs font-normal ml-1 ${sel ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>/{CYC[p.billing_cycle] ?? p.billing_cycle}</span>}
                  </p>
                  <p className={`text-xs mt-1 ${sel ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                    {p.max_users === 0 ? 'Unlimited' : p.max_users} users · {p.max_vehicles === 0 ? 'Unlimited' : p.max_vehicles} vehicles
                  </p>
                </button>
              )
            })}
          </div>
        )
      }

      {/* Always show dates; show editable price/limits for custom or no-plan */}
      {!loading && !loadingPlans && (
        <div className="mt-4 space-y-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Subscription Details</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <input type="date" className={inp} value={customFields.start_date} onChange={setC('start_date')} />
            </Field>
            <Field label="End Date" required>
              <input type="date" className={inp} value={customFields.end_date} onChange={setC('end_date')} />
            </Field>
          </div>

          {showCustomFields && (
            <>
              <Field label="Billing Cycle" required>
                <Select value={customFields.billing_cycle} onChange={setC('billing_cycle')}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </Select>
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Price (₹)" required>
                  <input type="number" min="0" step="0.01" className={inp} value={customFields.price} onChange={setC('price')} placeholder="0.00" />
                </Field>
                <Field label="Max Users" hint="0 = unlimited">
                  <input type="number" min="0" className={inp} value={customFields.max_users} onChange={setC('max_users')} placeholder="0" />
                </Field>
                <Field label="Max Vehicles" hint="0 = unlimited">
                  <input type="number" min="0" className={inp} value={customFields.max_vehicles} onChange={setC('max_vehicles')} placeholder="0" />
                </Field>
              </div>
            </>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function OrganizationSection({ tenantId }) {
  const [pii, setPii]   = useState(null)
  const [form, setForm] = useState({ contact_name: '', email: '', phone: '', address: '', gstin: '' })
  const [loading, setLoading] = useState(true)
  const { saving, saved, error, run } = useSaveState()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (!tenantId) return
    fetchTenantPII(tenantId)
      .then(d => {
        const record = (d.results ?? [])[0] ?? null
        setPii(record)
        if (record) setForm({
          contact_name: record.contact_name_value ?? '',
          email:        record.email_value        ?? '',
          phone:        record.phone_value        ?? '',
          address:      record.address            ?? '',
          gstin:        record.gstin_value        ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const save = () => run(async () => {
    if (pii?.id) await updateTenantPII(pii.id, form)
    else {
      const created = await createTenantPII({ tenant: tenantId, ...form })
      setPii(created)
    }
  })

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <SectionCard
      title="Organization Details"
      description="Contact and PII information stored encrypted."
      onSave={save} saving={saving} saved={saved} error={error}
      saveLabel="Update Organization"
    >
      <Field label="Contact Name" required>
        <input className={inp} value={form.contact_name} onChange={set('contact_name')} placeholder="John Doe" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" required>
          <input type="email" className={inp} value={form.email} onChange={set('email')} placeholder="john@acme.com" />
        </Field>
        <Field label="Phone" required>
          <input className={inp} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
        </Field>
      </div>
      <Field label="Address" required>
        <textarea rows={2} className={inp} value={form.address} onChange={set('address')} placeholder="Chennai, Tamil Nadu, India" />
      </Field>
      <Field label="GSTIN" hint="15-character GST identification number" required>
        <input
          className={`${inp} font-mono uppercase`}
          value={form.gstin}
          onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
        />
      </Field>
    </SectionCard>
  )
}

function BrandingSection({ tenantId, tenantName }) {
  const [branding, setBranding] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [logoFile, setLogoFile]         = useState(null)
  const [darkLogoFile, setDarkLogoFile] = useState(null)
  const [faviconFile, setFaviconFile]   = useState(null)
  const [color, setColor] = useState(PURPLE)
  const { saving, saved, error, run } = useSaveState()
  const PRESETS = [PURPLE,'#C82909','#059669','#7c3aed','#0891b2','#d97706','#374151','#000000']

  useEffect(() => {
    if (!tenantId) return
    fetchTenantBranding(tenantId)
      .then(d => {
        const record = (d.results ?? [])[0] ?? null
        setBranding(record)
        if (record?.primary_color) setColor(record.primary_color)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const save = () => run(async () => {
    const fd = new FormData()
    fd.append('tenant', tenantId)
    fd.append('primary_color', color)
    if (logoFile)     fd.append('logo_file',      logoFile)
    if (darkLogoFile) fd.append('dark_logo_file', darkLogoFile)
    if (faviconFile)  fd.append('favicon_file',   faviconFile)

    if (branding?.id) {
      const updated = await updateTenantBranding(branding.id, fd)
      setBranding(updated)
    } else {
      const created = await createTenantBranding(fd)
      setBranding(created)
    }
    setLogoFile(null); setDarkLogoFile(null); setFaviconFile(null)
  })

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <SectionCard
      title="Brand Identity"
      description="Logos and primary colour for the tenant portal."
      onSave={save} saving={saving} saved={saved} error={error}
      saveLabel="Update Branding"
    >
      <div className="grid grid-cols-3 gap-4">
        <FileUpload label="Light Logo" hint="Used on dark backgrounds"
          file={logoFile} existingUrl={toProxiedUrl(branding?.logo_url)}
          onChange={setLogoFile} />
        <FileUpload label="Dark Logo" hint="Used on light backgrounds"
          file={darkLogoFile} existingUrl={toProxiedUrl(branding?.dark_logo_url)}
          onChange={setDarkLogoFile} />
        <FileUpload label="Favicon" hint="Square, min 32×32 px"
          file={faviconFile} existingUrl={toProxiedUrl(branding?.favicon_url)}
          onChange={setFaviconFile} />
      </div>

      <Field label="Primary Color">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex-shrink-0" style={{ backgroundColor: color }} />
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 p-1 flex-shrink-0 bg-white dark:bg-slate-900" />
            <input className={`${inp} w-36 font-mono uppercase flex-shrink-0`} value={color} onChange={e => setColor(e.target.value)} maxLength={7} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-lg border-2 transition hover:scale-110 ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </Field>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Preview</p>
        <div
          className="flex items-center gap-3 rounded-lg border-l-4 bg-slate-100 dark:bg-slate-800 px-4 py-3"
          style={{ borderLeftColor: color }}
        >
          {(logoFile || branding?.logo_url)
            ? <img src={logoFile ? URL.createObjectURL(logoFile) : toProxiedUrl(branding?.logo_url)} alt="logo" className="h-8 max-w-[120px] object-contain" />
            : <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold" style={{ backgroundColor: color }}>{tenantName?.[0]?.toUpperCase() ?? 'T'}</div>
          }
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{tenantName || 'Tenant'}</p>
        </div>
      </div>
    </SectionCard>
  )
}

function InvoiceSettingsSection({ tenantId }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [qrFile, setQrFile]     = useState(null)
  const [form, setForm] = useState({
    account_holder_name: '', account_number: '', account_type: '',
    ifsc_code: '', bank_name: '', branch_name: '', upi_id: '',
    terms_and_conditions: '',
    currency_symbol: '₹', advance_payment_percentage: '100', estimate_charge_percentage: '3',
    replaced_parts_retention_days: '2', service_warranty_days: '30',
  })
  const { saving, saved, error, run } = useSaveState()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (!tenantId) return
    fetchTenantInvoiceSettings(tenantId)
      .then(d => {
        const record = (d.results ?? [])[0] ?? null
        setSettings(record)
        if (record) setForm({
          account_holder_name: record.account_holder_name ?? '',
          account_number:      record.account_number_value ?? '',
          account_type:        record.account_type ?? '',
          ifsc_code:           record.ifsc_code ?? '',
          bank_name:           record.bank_name ?? '',
          branch_name:         record.branch_name ?? '',
          upi_id:              record.upi_id ?? '',
          terms_and_conditions: record.terms_and_conditions ?? '',
          currency_symbol:     record.currency_symbol ?? '₹',
          advance_payment_percentage:    record.advance_payment_percentage ?? '100',
          estimate_charge_percentage:    record.estimate_charge_percentage ?? '3',
          replaced_parts_retention_days: record.replaced_parts_retention_days ?? '2',
          service_warranty_days:         record.service_warranty_days ?? '30',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const save = () => run(async () => {
    const fd = new FormData()
    fd.append('tenant', tenantId)
    Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''))
    if (qrFile) fd.append('qr_code_file', qrFile)

    if (settings?.id) {
      const updated = await updateTenantInvoiceSettings(settings.id, fd)
      setSettings(updated)
    } else {
      const created = await createTenantInvoiceSettings(fd)
      setSettings(created)
    }
    setQrFile(null)
  })

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <SectionCard
      title="Invoice Settings"
      description="Bank details, UPI QR code, and terms & conditions printed on job card / invoice PDFs."
      onSave={save} saving={saving} saved={saved} error={error}
      saveLabel="Update Invoice Settings"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Bank Account Details</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Account Holder Name">
          <input className={inp} value={form.account_holder_name} onChange={set('account_holder_name')} placeholder="Account Holder Name" />
        </Field>
        <Field label="Account Number">
          <input className={`${inp} font-mono`} value={form.account_number} onChange={set('account_number')} placeholder="05853 11111 11111" />
        </Field>
        <Field label="IFSC Code">
          <input className={`${inp} font-mono uppercase`} value={form.ifsc_code} onChange={e => setForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))} placeholder="TMBL0000058" />
        </Field>
        <Field label="Account Type">
          <Select value={form.account_type} onChange={set('account_type')}>
            <option value="">Select type</option>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
          </Select>
        </Field>
        <Field label="Bank Name">
          <input className={inp} value={form.bank_name} onChange={set('bank_name')} placeholder="Tamilnadu Mercantile Bank" />
        </Field>
        <Field label="Branch">
          <input className={inp} value={form.branch_name} onChange={set('branch_name')} placeholder="Podanur" />
        </Field>
        <Field label="UPI ID">
          <input className={inp} value={form.upi_id} onChange={set('upi_id')} placeholder="UPI ID" />
        </Field>
        <FileUpload label="UPI QR Code" hint="Square image, shown on invoice page 2"
          file={qrFile} existingUrl={toProxiedUrl(settings?.qr_code_url)}
          onChange={setQrFile} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 pt-2">Terms & Conditions Variables</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Currency Symbol">
          <input className={inp} value={form.currency_symbol} onChange={set('currency_symbol')} placeholder="₹" maxLength={5} />
        </Field>
        <Field label="Advance Payment (%)">
          <input type="number" min="0" max="100" step="0.01" className={inp} value={form.advance_payment_percentage} onChange={set('advance_payment_percentage')} placeholder="100" />
        </Field>
        <Field label="Estimate Charge (%)">
          <input type="number" min="0" max="100" step="0.01" className={inp} value={form.estimate_charge_percentage} onChange={set('estimate_charge_percentage')} placeholder="3" />
        </Field>
        <Field label="Replaced Parts Retention (days)">
          <input type="number" min="0" className={inp} value={form.replaced_parts_retention_days} onChange={set('replaced_parts_retention_days')} placeholder="2" />
        </Field>
        <Field label="Service Warranty (days)">
          <input type="number" min="0" className={inp} value={form.service_warranty_days} onChange={set('service_warranty_days')} placeholder="30" />
        </Field>
      </div>

      <Field
        label="Terms & Conditions"
        hint="Separate each clause with a blank line. Use {{tenant_name}}, {{advance_payment_percentage}}, {{estimate_charge_percentage}}, {{replaced_parts_retention_days}}, {{service_warranty_days}}, {{currency_symbol}} — they'll be substituted with the values above when the PDF is generated."
      >
        <textarea rows={10} className={`${inp} font-mono text-xs`} value={form.terms_and_conditions} onChange={set('terms_and_conditions')}
          placeholder={'Pickup, drop-off, and test drives are undertaken at the customer’s own risk. {{tenant_name}} will exercise reasonable care…\n\nAn advance payment of {{advance_payment_percentage}}% of the quoted spare parts value must be paid before work commences.'} />
      </Field>
    </SectionCard>
  )
}

function ModulesSection({ tenantId, allModules, loadingModules }) {
  const [assignments, setAssignments] = useState([])
  const [selected, setSelected]       = useState(new Set())
  const [loading, setLoading]         = useState(true)
  const { saving, saved, error, run } = useSaveState()

  useEffect(() => {
    if (!tenantId) return
    fetchTenantModules(tenantId)
      .then(d => {
        const list = d.results ?? []
        setAssignments(list)
        setSelected(new Set(list.map(a => a.module)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const toggle = (moduleId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const save = () => run(async () => {
    const currentIds  = new Set(assignments.map(a => a.module))
    const toAdd       = [...selected].filter(id => !currentIds.has(id))
    const toRemove    = assignments.filter(a => !selected.has(a.module))

    await Promise.all(toRemove.map(a => deleteTenantModule(a.id)))
    const added = await Promise.all(
      toAdd.map((moduleId, i) => createTenantModule({ tenant: tenantId, module: moduleId, priority: assignments.length + i + 1 }))
    )

    const remaining = assignments.filter(a => selected.has(a.module))
    setAssignments([...remaining, ...added])
  })

  if (loading || loadingModules) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <SectionCard
      title="Modules"
      description="Enable or disable platform modules for this tenant."
      onSave={save} saving={saving} saved={saved} error={error}
      saveLabel="Save Modules"
    >
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {allModules.map(mod => {
          const on = selected.has(mod.id)
          return (
            <button key={mod.id} type="button" onClick={() => toggle(mod.id)}
              className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition ${on ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${on ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {on ? <Check size={16} /> : mod.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${on ? 'text-slate-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>{mod.name}</p>
                <p className={`text-xs font-mono ${on ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`}>{mod.key}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border flex-shrink-0 ${on ? 'border-blue-300 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                {on ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          )
        })}
        {allModules.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No modules available.</p>}
      </div>
    </SectionCard>
  )
}

// ─── main page ─────────────────────────────────────────────────────────────────

export default function TenantEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant]           = useState(null)
  const [allPlans, setAllPlans]       = useState([])
  const [allModules, setAllModules]   = useState([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [loadingPlans, setLoadingPlans]     = useState(true)
  const [loadingModules, setLoadingModules] = useState(true)

  useEffect(() => {
    fetchTenant(id)
      .then(setTenant)
      .catch(() => navigate('/tenants'))
      .finally(() => setLoadingPage(false))
    fetchPlans()
      .then(d => setAllPlans((d.results ?? []).filter(p => p.is_active)))
      .catch(() => {})
      .finally(() => setLoadingPlans(false))
    fetchModules()
      .then(d => setAllModules(d.results ?? []))
      .catch(() => {})
      .finally(() => setLoadingModules(false))
  }, [id])

  if (loadingPage) {
    return (
      <Shell>
        <div className="mx-auto max-w-4xl space-y-6">
          {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/50" />)}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/tenants')}
            className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Tenant</h1>
          <p className="mt-1 text-slate-400 dark:text-slate-500">Manage settings for {tenant?.name}</p>
          <div className="mt-6 border-t border-slate-200 dark:border-white/5" />
        </div>

        <BasicInfoSection tenant={tenant} onSaved={setTenant} />
        <SubscriptionSection tenantId={id} plans={allPlans} loadingPlans={loadingPlans} />
        <OrganizationSection tenantId={id} />
        <BrandingSection tenantId={id} tenantName={tenant?.name} />
        <InvoiceSettingsSection tenantId={id} />
        <ModulesSection tenantId={id} allModules={allModules} loadingModules={loadingModules} />
      </div>
    </Shell>
  )
}
