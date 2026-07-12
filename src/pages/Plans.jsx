import { useEffect, useState } from 'react'
import { CreditCard, Plus, X, Check } from 'lucide-react'

import Shell from '../components/Shell.jsx'
import Select from '../components/Select.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'

import { fetchPlans, createPlan, updatePlan } from '../utils/api.js'
import { ACCENT } from '../brand.js'

const CYCLE_LABELS = { monthly: 'Monthly', yearly: 'Annual', lifetime: 'Lifetime' }

const EMPTY_FORM = {
  name: '', description: '', billing_cycle: 'monthly',
  price: '', max_users: '', max_vehicles: '', is_active: true, is_custom: false,
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900'

function PlanCard({ plan, onEdit }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{CYCLE_LABELS[plan.billing_cycle] ?? plan.billing_cycle}</p>
        </div>
        <Badge active={plan.is_active} variant="status" />
      </div>

      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {plan.is_custom ? 'Custom' : `₹${Number(plan.price).toLocaleString('en-IN')}`}
        {!plan.is_custom && <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">/{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>}
      </p>

      {plan.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
      )}

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
          {plan.max_users === 0 ? 'Unlimited users' : `Up to ${plan.max_users} users`}
        </div>
        <div className="flex items-center gap-1.5">
          <Check size={12} className="text-emerald-500 dark:text-emerald-400" />
          {plan.max_vehicles === 0 ? 'Unlimited vehicles' : `Up to ${plan.max_vehicles} vehicles`}
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={() => onEdit(plan)}
        className="w-full py-2"
      >
        Edit Plan
      </Button>
    </Card>
  )
}

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetchPlans()
      .then(data => setPlans(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal('create')
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name || '',
      description: p.description || '',
      billing_cycle: p.billing_cycle || 'monthly',
      price: p.price ?? '',
      max_users: p.max_users ?? '',
      max_vehicles: p.max_vehicles ?? '',
      is_active: p.is_active ?? true,
      is_custom: p.is_custom ?? false,
    })
    setError('')
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditing(null) }

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      max_users: parseInt(form.max_users) || 0,
      max_vehicles: parseInt(form.max_vehicles) || 0,
    }
    try {
      if (modal === 'create') await createPlan(payload)
      else await updatePlan(editing.id, payload)
      closeModal()
      load()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const monthly = plans.filter(p => p.billing_cycle === 'monthly')
  const yearly = plans.filter(p => p.billing_cycle === 'yearly')
  const others = plans.filter(p => p.billing_cycle !== 'monthly' && p.billing_cycle !== 'yearly')

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader 
          title="Plans"
          subtitle={`${plans.length} plan${plans.length !== 1 ? 's' : ''} configured`}
          action={
            <Button onClick={openCreate} variant="primary">
              <Plus size={16} /> New Plan
            </Button>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="space-y-3">
                {[32, 20, 48, 14, 14].map((h, j) => (
                  <div key={j} className={`h-${h > 20 ? '8' : '4'} animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800`} style={{ height: h }} />
                ))}
              </Card>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-16 text-slate-400 dark:text-slate-500">
            <CreditCard size={36} className="mb-2 opacity-30" />
            <p>No plans yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {monthly.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Monthly</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {monthly.map(p => <PlanCard key={p.id} plan={p} onEdit={openEdit} />)}
                </div>
              </div>
            )}
            {yearly.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Annual</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {yearly.map(p => <PlanCard key={p.id} plan={p} onEdit={openEdit} />)}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Other</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {others.map(p => <PlanCard key={p.id} plan={p} onEdit={openEdit} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Plan' : 'Edit Plan'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">{error}</div>
            )}

            <Field label="Plan Name">
              <input required className={inputCls} value={form.name} onChange={set('name')} placeholder="Starter Monthly" />
            </Field>

            <Field label="Description">
              <textarea className={inputCls} rows={2} value={form.description} onChange={set('description')} placeholder="Optional description…" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Billing Cycle">
                <Select value={form.billing_cycle} onChange={set('billing_cycle')}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Annual</option>
                  <option value="lifetime">Lifetime</option>
                </Select>
              </Field>
              <Field label="Price (₹)">
                <input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={set('price')} placeholder="1499" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Max Users (0 = unlimited)">
                <input type="number" min="0" className={inputCls} value={form.max_users} onChange={set('max_users')} placeholder="3" />
              </Field>
              <Field label="Max Vehicles (0 = unlimited)">
                <input type="number" min="0" className={inputCls} value={form.max_vehicles} onChange={set('max_vehicles')} placeholder="500" />
              </Field>
            </div>

            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer transition">
                <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer transition">
                <input type="checkbox" checked={form.is_custom} onChange={set('is_custom')} className="rounded" />
                Custom / Enterprise
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create Plan' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  )
}
