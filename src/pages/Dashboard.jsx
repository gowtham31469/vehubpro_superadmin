import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CreditCard, Boxes, Users, Plus } from 'lucide-react'

import Shell from '../components/Shell.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'

import { fetchTenants, fetchPlans, fetchModules } from '../utils/api.js'
import { ACCENT } from '../brand.js'

// Skeleton components
function SkeletonStatCard() {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 h-10 w-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
      <div className="mb-3 h-4 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" />
      <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" />
    </Card>
  )
}

function SkeletonChart() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-32 w-32 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800/50" />
    </div>
  )
}

const STATUS_VARIANTS = {
  active: 'emerald',
  suspended: 'amber',
  cancelled: 'rose',
}

function StatCard({ label, value, Icon, loading, sub }) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/50">
        <Icon size={20} className="text-slate-500 dark:text-slate-400" strokeWidth={1.8} />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {loading
        ? <div className="mt-2 h-8 w-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50" />
        : <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-white">{value}</p>
      }
      {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </Card>
  )
}

function DonutChart({ value, max, label }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? value / max : 0
  const dash = circ * pct
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" className="stroke-[#e2e8f0] dark:stroke-slate-800" strokeWidth="14" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={ACCENT} strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="700" className="fill-[#0f172a] dark:fill-white">{value}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="10" fontWeight="600" className="fill-[#94a3b8] dark:fill-slate-500" letterSpacing="1">{label}</text>
      </svg>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ tenants: 0, plans: 0, modules: 0, active: 0, suspended: 0, cancelled: 0 })
  const [recentTenants, setRecentTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      fetchTenants({ page_size: 100 }),
      fetchPlans(),
      fetchModules(),
    ]).then(([t, p, m]) => {
      const tenants     = t.status === 'fulfilled' ? (t.value?.results ?? []) : []
      const totalTenants = t.status === 'fulfilled' ? (t.value?.count ?? tenants.length) : 0
      const active    = tenants.filter(x => x.status === 'active').length
      const suspended = tenants.filter(x => x.status === 'suspended').length
      const cancelled = tenants.filter(x => x.status === 'cancelled').length

      setStats({
        tenants: totalTenants,
        plans:   p.status === 'fulfilled' ? (p.value?.results?.length ?? 0) : 0,
        modules: m.status === 'fulfilled' ? (m.value?.results?.length ?? 0) : 0,
        active, suspended, cancelled,
      })
      setRecentTenants(tenants.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <PageHeader 
          title="Dashboard Overview"
          subtitle="Here's what's happening on the platform."
          action={
            <Button onClick={() => navigate('/tenants/new')} variant="primary">
              <Plus size={16} /> New Tenant
            </Button>
          }
        />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)
            : (
              <>
                <StatCard label="Total Tenants"  value={stats.tenants}  Icon={Building2}  loading={false} sub={`${stats.active} active`} />
                <StatCard label="Active Plans"   value={stats.plans}    Icon={CreditCard} loading={false} />
                <StatCard label="Modules"        value={stats.modules}  Icon={Boxes}      loading={false} />
                <StatCard label="Super Admins"   value={1}              Icon={Users}      loading={false} />
              </>
            )
          }
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Tenant Activity */}
          <Card className="lg:col-span-2" noPadding>
            <div className="p-6 h-full flex flex-col">
              <div className="mb-1 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">Tenant Overview</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">Subscription status</p>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" />)}
              </div>
            ) : stats.tenants === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                No tenants registered yet.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Active',    count: stats.active,    color: 'bg-emerald-500' },
                  { label: 'Suspended', count: stats.suspended, color: 'bg-amber-400' },
                  { label: 'Cancelled', count: stats.cancelled, color: 'bg-rose-400' },
                ].map(({ label, count, color }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-2 rounded-full transition-all ${color}`}
                        style={{ width: stats.tenants > 0 ? `${(count / stats.tenants) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </Card>

          {/* Tenant Status Donut */}
          <Card className="flex flex-col" noPadding>
            <div className="p-6 flex flex-col h-full">
              <p className="font-bold text-slate-900 dark:text-white text-lg">Tenant Status</p>
              {loading ? (
                <SkeletonChart />
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center py-2">
                    <DonutChart value={stats.active} max={stats.tenants} label="ACTIVE" />
                  </div>
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
                    {[
                      { label: 'Active',    val: stats.active },
                      { label: 'Suspended', val: stats.suspended },
                      { label: 'Cancelled', val: stats.cancelled },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">{label}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{val}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Tenants */}
        <Card className="overflow-hidden" noPadding>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
            <p className="font-bold text-slate-900 dark:text-white">Recent Tenants</p>
            <Button
              variant="ghost"
              onClick={() => navigate('/tenants')}
              style={{ color: ACCENT }}
            >
              View All
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                {['Tenant', 'Domain', 'Status', 'Onboarded'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {[1,2,3,4].map(j => (
                        <td key={j} className="px-6 py-3"><div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800/50" /></td>
                      ))}
                    </tr>
                  ))
                : recentTenants.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                      No tenants yet
                    </td>
                  </tr>
                )
                : recentTenants.map(t => {
                  const variant = STATUS_VARIANTS[t.status] ?? 'slate'
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-transparent">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">{t.name}</td>
                      <td className="px-6 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{t.domain}</td>
                      <td className="px-6 py-3">
                        <Badge variant={variant} label={t.status} className="capitalize" />
                      </td>
                      <td className="px-6 py-3 text-slate-400 dark:text-slate-500">
                        {t.onboarded_at ? new Date(t.onboarded_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </Card>

      </div>
    </Shell>
  )
}
