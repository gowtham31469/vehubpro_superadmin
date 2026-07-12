import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Plus, ChevronLeft, ChevronRight,
  Search, Download, Pencil, Trash2, AlertTriangle,
} from 'lucide-react'

import Shell from '../components/Shell.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'

import { fetchTenants, fetchTenantsPII, deleteTenant } from '../utils/api.js'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const STATUS_VARIANTS = {
  active: 'emerald',
  suspended: 'amber',
  cancelled: 'rose',
}

const COLUMNS = [
  { label: 'Tenant',    width: 'w-[22%]' },
  { label: 'Domain',    width: 'w-[22%]' },
  { label: 'Contact',   width: 'w-[22%]' },
  { label: 'Status',    width: 'w-[12%]' },
  { label: 'Onboarded', width: 'w-[14%]' },
  { label: 'Actions',   width: 'w-[8%]', align: 'text-right' },
]

function exportToCSV(tenants, piiMap) {
  const headers = ['Name', 'Domain', 'Status', 'Onboarded', 'Contact Name', 'Email', 'Phone']
  const rows = tenants.map(t => {
    const pii = piiMap[t.id]
    return [
      t.name,
      t.domain,
      t.status,
      t.onboarded_at ? new Date(t.onboarded_at).toLocaleDateString('en-IN') : '',
      pii?.contact_name_value || '',
      pii?.email_value || '',
      pii?.phone_value || '',
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  })
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function DeleteConfirmModal({ tenant, onConfirm, onCancel, deleting }) {
  return (
    <Modal show={!!tenant} onClose={onCancel} title="Delete Tenant" maxWidth="max-w-md">
      <div className="px-6 py-5 space-y-4 bg-white dark:bg-slate-900">
        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">This action cannot be undone.</p>
            <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400/80">
              The tenant will be archived and all associated access removed.
            </p>
          </div>
        </div>

        {/* Tenant summary */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{tenant?.name}</p>
          <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">{tenant?.domain}</p>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{tenant?.name}</span>?
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={deleting}>
            <Trash2 size={15} />
            {deleting ? 'Deleting…' : 'Delete Tenant'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Tenants() {
  const navigate = useNavigate()
  const [tenants, setTenants]             = useState([])
  const [piiMap, setPiiMap]               = useState({})
  const [count, setCount]                 = useState(0)
  const [page, setPage]                   = useState(1)
  const [pageSize, setPageSize]           = useState(PAGE_SIZE_OPTIONS[0])
  const [search, setSearch]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [exporting, setExporting]         = useState(false)
  const [deletingTenant, setDeletingTenant] = useState(null)
  const [deleting, setDeleting]           = useState(false)

  const loadPII = useCallback(() => {
    fetchTenantsPII()
      .then(d => {
        const map = {}
        ;(d.results ?? []).forEach(p => { map[p.tenant] = p })
        setPiiMap(map)
      })
      .catch(() => {})
  }, [])

  const load = useCallback((p, size, q) => {
    setLoading(true)
    const params = { page: p, page_size: size }
    if (q) params.search = q
    fetchTenants(params)
      .then(d => { setTenants(d.results ?? []); setCount(d.count ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(page, pageSize, search) }, [page, pageSize])
  useEffect(() => { loadPII() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, pageSize, search)
  }

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = { page: 1, page_size: 10000 }
      if (search) params.search = search
      const d = await fetchTenants(params)
      exportToCSV(d.results ?? [], piiMap)
    } catch {
      /* silently fail */
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTenant) return
    setDeleting(true)
    try {
      await deleteTenant(deletingTenant.id)
      setDeletingTenant(null)
      load(page, pageSize, search)
    } catch {
      /* TODO: surface error toast */
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(count / pageSize)
  const rangeStart = count === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd   = Math.min(page * pageSize, count)

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Tenants"
          subtitle={`${count} tenant${count !== 1 ? 's' : ''} registered`}
          action={
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                disabled={exporting || count === 0}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download size={15} />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </Button>
              <Button onClick={() => navigate('/tenants/new')} variant="primary">
                <Plus size={16} /> New Tenant
              </Button>
            </div>
          }
        />

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or domain…"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 transition"
            />
          </div>
          <Button type="submit" variant="secondary" className="px-4 py-2.5">Search</Button>
        </form>

        {/* Table */}
        <Card className="overflow-hidden" noPadding>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <tr>
                {COLUMNS.map(col => (
                  <th
                    key={col.label}
                    className={`${col.width} px-4 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.align ?? 'text-left'}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {COLUMNS.map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
                        </td>
                      ))}
                    </tr>
                  ))
                : tenants.length === 0
                ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <Building2 size={24} className="text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No tenants found</p>
                        {search && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Try adjusting your search query
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )
                : tenants.map(t => {
                    const pii     = piiMap[t.id]
                    const variant = STATUS_VARIANTS[t.status] ?? 'amber'
                    return (
                      <tr
                        key={t.id}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Tenant name */}
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => navigate(`/tenants/${t.id}`)}
                            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline-offset-4 hover:underline"
                          >
                            {t.name}
                          </button>
                        </td>

                        {/* Domain */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {t.domain}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3.5">
                          {pii
                            ? (
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{pii.contact_name_value || '—'}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{pii.email_value || ''}</p>
                              </div>
                            )
                            : <span className="text-slate-300 dark:text-slate-600 text-xs">Not set</span>
                          }
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <Badge variant={variant} label={t.status} className="capitalize" />
                        </td>

                        {/* Onboarded */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {t.onboarded_at
                            ? new Date(t.onboarded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/tenants/${t.id}/edit`)}
                              title="Edit tenant"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingTenant(t)}
                              title="Delete tenant"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>

          {/* Pagination footer */}
          {count > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              {/* Left: range + rows selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {rangeStart}–{rangeEnd} of {count} tenant{count !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    {PAGE_SIZE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right: page nav */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        tenant={deletingTenant}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTenant(null)}
        deleting={deleting}
      />
    </Shell>
  )
}
