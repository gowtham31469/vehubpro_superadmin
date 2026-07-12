import { useEffect, useState, useCallback } from 'react'
import {
  Boxes, Plus, X, ChevronDown, ChevronRight,
  Pencil, ToggleLeft, ToggleRight, Layers, Check,
} from 'lucide-react'

import Shell from '../components/Shell.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'

import {
  fetchModules, createModule, updateModule,
  fetchSubmodules, createSubmodule, updateSubmodule,
} from '../utils/api.js'
import { ACCENT } from '../brand.js'

// ─── shared UI ────────────────────────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] flex flex-col transition-colors">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/60 px-6 py-4 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="mt-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
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

const inp = 'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900'



// ─── submodule row ─────────────────────────────────────────────────────────────

function SubmoduleRow({ sub, moduleId, onEdit }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 px-4 py-3 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <Layers size={13} className="text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{sub.name}</p>
          <p className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{sub.key}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge active={sub.is_active} />
        <Button variant="secondary" onClick={() => onEdit(sub)} className="p-1.5 rounded-lg px-2">
          <Pencil size={13} />
        </Button>
      </div>
    </div>
  )
}

// ─── module card ──────────────────────────────────────────────────────────────

function ModuleCard({ mod, onEditModule, onAddSubmodule, onEditSubmodule, onToggleModule }) {
  const [open, setOpen]       = useState(false)
  const [subs, setSubs]       = useState(null)
  const [loadingSubs, setLoadingSubs] = useState(false)

  const loadSubs = useCallback(async () => {
    if (subs !== null) return
    setLoadingSubs(true)
    try {
      const data = await fetchSubmodules(mod.id)
      setSubs(data.results ?? [])
    } catch { setSubs([]) }
    finally { setLoadingSubs(false) }
  }, [mod.id, subs])

  const toggle = () => {
    if (!open) loadSubs()
    setOpen(o => !o)
  }

  const refreshSubs = async () => {
    setLoadingSubs(true)
    try {
      const data = await fetchSubmodules(mod.id)
      setSubs(data.results ?? [])
    } catch {}
    finally { setLoadingSubs(false) }
  }

  const handleEditSub = (sub) => onEditSubmodule(mod, sub, refreshSubs)
  const handleAddSub  = ()    => onAddSubmodule(mod, refreshSubs)

  return (
    <Card className={`transition-all ${mod.is_active ? '' : 'opacity-70 hover:opacity-100'}`} noPadding>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: mod.is_active ? `${ACCENT}15` : 'transparent', border: mod.is_active ? 'none' : '1px solid rgba(148, 163, 184, 0.2)' }}
        >
          <Boxes size={18} style={{ color: mod.is_active ? ACCENT : '#94a3b8' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 dark:text-white">{mod.name}</p>
            <Badge active={mod.is_active} />
            {mod.is_service && (
              <span className="rounded-full border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400">Service</span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">{mod.key}</p>
          {mod.description && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 truncate">{mod.description}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{mod.submodule_count} submodule{mod.submodule_count !== 1 ? 's' : ''}</span>

          <Button
            variant="ghost"
            onClick={() => onToggleModule(mod)}
            className="p-1.5 px-2 rounded-lg"
            title={mod.is_active ? 'Deactivate' : 'Activate'}
          >
            {mod.is_active
              ? <ToggleRight size={18} className="text-emerald-500 dark:text-emerald-400" />
              : <ToggleLeft size={18} />}
          </Button>

          <Button
            variant="secondary"
            onClick={() => onEditModule(mod)}
            className="p-1.5 px-2 rounded-lg"
          >
            <Pencil size={14} />
          </Button>

          <Button
            variant="secondary"
            onClick={toggle}
            className="p-1.5 px-2 rounded-lg"
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Button>
        </div>
      </div>

      {/* Submodules panel */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 px-5 py-4 transition-colors">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Submodules</p>
            <Button
              variant="primary"
              onClick={handleAddSub}
              className="px-2.5 py-1 text-xs rounded-lg shadow-none"
            >
              <Plus size={12} /> Add
            </Button>
          </div>

          {loadingSubs ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
            </div>
          ) : subs?.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
              No submodules yet — add one above
            </p>
          ) : (
            <div className="space-y-2">
              {subs?.map(s => (
                <SubmoduleRow key={s.id} sub={s} moduleId={mod.id} onEdit={handleEditSub} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Modules() {
  const [modules, setModules]   = useState([])
  const [loading, setLoading]   = useState(true)

  // Modal state
  const [moduleModal, setModuleModal] = useState(null)   // null | { mode: 'create'|'edit', data?: mod }
  const [subModal, setSubModal]       = useState(null)   // null | { mod, sub?, refresh }
  const [form, setForm]               = useState({})
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState('')

  const loadModules = useCallback(() => {
    setLoading(true)
    fetchModules()
      .then(data => setModules(data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadModules() }, [])

  // ── module modal ────────────────────────────────────────────────────────────

  const openCreateModule = () => {
    setForm({ name: '', key: '', description: '', is_active: true, is_service: false })
    setFormError('')
    setModuleModal({ mode: 'create' })
  }

  const openEditModule = (mod) => {
    setForm({ name: mod.name, key: mod.key, description: mod.description ?? '', is_active: mod.is_active, is_service: mod.is_service })
    setFormError('')
    setModuleModal({ mode: 'edit', data: mod })
  }

  const closeModuleModal = () => setModuleModal(null)

  const handleModuleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (moduleModal.mode === 'create') {
        await createModule(form)
      } else {
        await updateModule(moduleModal.data.id, form)
      }
      closeModuleModal()
      loadModules()
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleModule = async (mod) => {
    try {
      await updateModule(mod.id, { is_active: !mod.is_active })
      loadModules()
    } catch {}
  }

  // ── submodule modal ─────────────────────────────────────────────────────────

  const openAddSubmodule = (mod, refresh) => {
    setForm({ name: '', key: '', description: '', is_active: true })
    setFormError('')
    setSubModal({ mod, sub: null, refresh })
  }

  const openEditSubmodule = (mod, sub, refresh) => {
    setForm({ name: sub.name, key: sub.key, description: sub.description ?? '', is_active: sub.is_active })
    setFormError('')
    setSubModal({ mod, sub, refresh })
  }

  const closeSubModal = () => setSubModal(null)

  const handleSubSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (!subModal.sub) {
        await createSubmodule(subModal.mod.id, form)
      } else {
        await updateSubmodule(subModal.mod.id, subModal.sub.id, form)
      }
      subModal.refresh()
      loadModules()
      closeSubModal()
    } catch (err) {
      setFormError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const setF = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const active   = modules.filter(m => m.is_active)
  const inactive = modules.filter(m => !m.is_active)

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <PageHeader 
          title="Modules"
          subtitle="Platform capabilities and feature groups"
          action={
            <Button onClick={openCreateModule} variant="primary">
              <Plus size={16} /> New Module
            </Button>
          }
        />

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Modules',   value: modules.length },
            { label: 'Active',          value: active.length },
            { label: 'Service Modules', value: modules.filter(m => m.is_service).length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm transition-colors">
              <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Module list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-16 text-slate-400 dark:text-slate-500">
            <Boxes size={36} className="mb-2 opacity-30" />
            <p>No modules configured yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Active</p>
                {active.map(mod => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    onEditModule={openEditModule}
                    onAddSubmodule={openAddSubmodule}
                    onEditSubmodule={openEditSubmodule}
                    onToggleModule={handleToggleModule}
                  />
                ))}
              </div>
            )}
            {inactive.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Inactive</p>
                {inactive.map(mod => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    onEditModule={openEditModule}
                    onAddSubmodule={openAddSubmodule}
                    onEditSubmodule={openEditSubmodule}
                    onToggleModule={handleToggleModule}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Module create/edit modal */}
      {moduleModal && (
        <Modal
          title={moduleModal.mode === 'create' ? 'New Module' : 'Edit Module'}
          subtitle={moduleModal.mode === 'edit' ? moduleModal.data?.key : undefined}
          onClose={closeModuleModal}
        >
          <form onSubmit={handleModuleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Module Name *">
                <input required className={inp} value={form.name} onChange={setF('name')} placeholder="Services" />
              </Field>
              <Field label="Key *">
                <input
                  required
                  className={`${inp} font-mono lowercase`}
                  value={form.key}
                  onChange={setF('key')}
                  placeholder="services"
                  disabled={moduleModal.mode === 'edit'}
                />
                {moduleModal.mode === 'edit' && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Key is immutable</p>}
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={2} className={inp} value={form.description} onChange={setF('description')} placeholder="What does this module provide?" />
            </Field>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none transition">
                <input type="checkbox" checked={form.is_active} onChange={setF('is_active')} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none transition">
                <input type="checkbox" checked={form.is_service} onChange={setF('is_service')} className="rounded" />
                Service Module
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
              <Button type="button" variant="secondary" onClick={closeModuleModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : moduleModal.mode === 'create' ? 'Create Module' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submodule create/edit modal */}
      {subModal && (
        <Modal
          title={subModal.sub ? 'Edit Submodule' : 'New Submodule'}
          subtitle={`Under: ${subModal.mod.name}`}
          onClose={closeSubModal}
        >
          <form onSubmit={handleSubSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Submodule Name *">
                <input required className={inp} value={form.name} onChange={setF('name')} placeholder="Job Cards" />
              </Field>
              <Field label="Key *">
                <input
                  required
                  className={`${inp} font-mono lowercase`}
                  value={form.key}
                  onChange={setF('key')}
                  placeholder="job_cards"
                  disabled={!!subModal.sub}
                />
                {subModal.sub && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Key is immutable</p>}
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={2} className={inp} value={form.description} onChange={setF('description')} placeholder="What does this submodule do?" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none pt-1 transition">
              <input type="checkbox" checked={form.is_active} onChange={setF('is_active')} className="rounded" />
              Active
            </label>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4">
              <Button type="button" variant="secondary" onClick={closeSubModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : subModal.sub ? 'Save Changes' : 'Add Submodule'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  )
}
