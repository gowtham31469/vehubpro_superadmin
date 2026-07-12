import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Building2, Users, ArrowLeft, Mail, Phone, 
  Trash2, Edit2, Plus, ArrowRight, ShieldCheck,
  Activity, Calendar, Globe, MapPin, Eye, EyeOff, Check, ChevronRight, ChevronDown
} from 'lucide-react'

import Shell from '../components/Shell.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'

import { 
  fetchTenant, fetchTenantPII, fetchTenantAdmins, 
  createTenantAdmin, updateTenantAdmin, deleteTenantAdmin,
  fetchTenantPermissionHierarchy
} from '../utils/api.js'
import { ACCENT, PURPLE, TEAL } from '../brand.js'

const STATUS_VARIANTS = {
  active: 'emerald',
  suspended: 'amber',
  cancelled: 'rose',
}

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <Card className="flex flex-1 flex-col">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
          <Icon size={20} style={{ color }} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </Card>
  )
}

function AdminModal({ tenantId, admin, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: admin?.full_name_value || '',
    email: admin?.email_value || '',
    phone: admin?.phone_value || '',
    password: '',
    status: admin?.status || 'active',
    tenant: tenantId,
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (admin) await updateTenantAdmin(admin.id, payload)
      else await createTenantAdmin(payload)
      onSave()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save admin')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"

  return (
    <Modal 
      show={true} 
      onClose={onClose} 
      title={admin ? 'Edit Administrator' : 'New Administrator'}
      maxWidth="max-w-lg"
      noPadding
    >
      <div className="bg-white dark:bg-slate-900 !opacity-100 !backdrop-blur-none">
        <form onSubmit={save} className="px-8 py-7 space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400">Full Name <span className="text-rose-500">*</span></label>
          <input required placeholder="John Doe" className={inputCls} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400">Email Address <span className="text-rose-500">*</span></label>
          <input required type="email" placeholder="john@organization.com" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400">Phone Number <span className="text-rose-500">*</span></label>
            <input required placeholder="+91 98765 4321" className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5 relative">
            <label className="block text-[13px] font-bold text-slate-500 dark:text-slate-400">Password {!admin && <span className="text-rose-500">*</span>}</label>
            <div className="relative">
              <input required={!admin} type={showPass ? 'text' : 'password'} placeholder={admin ? 'Leave blank' : '••••••••'} className={`${inputCls} pr-10`} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="active-acc" checked={form.status === 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'active' : 'suspended' }))} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
          <label htmlFor="active-acc" className="text-[13px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Active Account</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: '#7C3AED' }}>
            {saving ? 'Saving...' : admin ? 'Update Admin' : 'Create Admin'}
          </button>
        </div>
        </form>
      </div>
    </Modal>
  )
}

export default function TenantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [tenant, setTenant] = useState(null)
  const [pii, setPii] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [tData, pData, aData] = await Promise.all([
        fetchTenant(id),
        fetchTenantPII(id),
        fetchTenantAdmins(id)
      ])
      setTenant(tData)
      setPii((pData.results ?? [])[0] ?? null)
      setAdmins(aData.results ?? [])
    } catch (err) {
      console.error(err)
      // navigate('/tenants')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to remove this admin?')) return
    try {
      await deleteTenantAdmin(adminId)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete')
    }
  }

  if (loading) return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    </Shell>
  )

  return (
    <Shell>
      <div className="mx-auto max-w-6xl space-y-8 pb-10">
        
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <button 
              onClick={() => navigate('/tenants')}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition mb-4"
            >
              <ArrowLeft size={14} /> Back to Tenants
            </button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm">
                <Building2 size={32} className="text-slate-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tenant?.name}</h1>
                  <Badge variant={STATUS_VARIANTS[tenant?.status]} label={tenant?.status} className="capitalize px-3 py-0.5" />
                </div>
                <p className="text-slate-400 font-mono text-sm mt-0.5">{tenant?.domain}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="secondary" onClick={() => navigate(`/tenants/${id}/edit`)}>
              <Edit2 size={16} /> Edit Settings
            </Button>
            <Button variant="primary" onClick={() => { setEditingAdmin(null); setShowModal(true) }}>
              <Plus size={16} /> Add Admin
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            label="Administrators" 
            value={admins.length} 
            sub="Active portal users"
            Icon={ShieldCheck}
            color={ACCENT}
          />
          <StatCard 
            label="Onboarded On" 
            value={tenant?.onboarded_at ? new Date(tenant.onboarded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} 
            sub="Registration date"
            Icon={Calendar}
            color={PURPLE}
          />
           <StatCard 
            label="Modules Enabled" 
            value="--" 
            sub="Active platform features"
            Icon={Activity}
            color={TEAL}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content: Admin List */}
          <div className="lg:col-span-2 space-y-6">
            <Card noPadding className="overflow-hidden">
               <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-900 dark:text-white">Tenant Administrators</h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{admins.length} Total</span>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {admins.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                             <div className="flex flex-col items-center gap-2">
                               <Users size={32} className="opacity-20" />
                               <p>No administrators added yet.</p>
                               <button 
                                onClick={() => setShowModal(true)}
                                className="text-sm font-semibold text-blue-500 hover:underline"
                               >
                                 Create first admin
                               </button>
                             </div>
                          </td>
                        </tr>
                      ) : (
                        admins.map(admin => (
                          <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition group">
                            <td className="px-6 py-4">
                               <p className="font-semibold text-slate-900 dark:text-white text-base">{admin.full_name_value}</p>
                               <Badge variant="ghost" label="Administrator" className="text-[10px] uppercase font-bold tracking-tighter" />
                            </td>
                            <td className="px-6 py-4">
                               <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-slate-500">
                                   <Mail size={12} />
                                   <span className="truncate max-w-[150px]">{admin.email_value}</span>
                                 </div>
                                 {admin.phone_value && (
                                   <div className="flex items-center gap-2 text-slate-400 text-xs">
                                     <Phone size={11} />
                                     <span>{admin.phone_value}</span>
                                   </div>
                                 )}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <Badge 
                                variant={admin.is_active ? 'emerald' : 'slate'} 
                                label={admin.is_active ? 'Active' : 'Inactive'} 
                                className="capitalize"
                               />
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-1 transition duration-200">
                                 <button 
                                  onClick={() => { setEditingAdmin(admin); setShowModal(true) }}
                                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition"
                                 >
                                   <Edit2 size={14} />
                                 </button>
                                 <button 
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                 </table>
               </div>
               
               <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-xs text-slate-400">Administrators have full access to their respective tenant portal.</p>
               </div>
            </Card>
          </div>

          {/* Sidebar: Details Card */}
          <div className="space-y-6">
             <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Building2 size={80} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Organization Summary</h3>
                
                <div className="space-y-5">
                   <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Globe size={14} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subdomain</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tenant?.domain}</p>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Headquarters</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pii?.address || 'Address not set'}</p>
                      </div>
                   </div>

                   <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Mail size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Email</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pii?.email_value || 'No contact email'}</p>
                      </div>
                   </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                   <button 
                    onClick={() => navigate(`/tenants/${id}/edit`)}
                    className="w-full group flex items-center justify-between px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     Manage Content & Billing
                     <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </Card>

             <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Internal Note</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  "Registered for premium support. Key contact is {pii?.contact_name_value || 'pending'}."
                </p>
             </Card>
          </div>

        </div>

        {showModal && (
          <AdminModal 
            tenantId={id} 
            admin={editingAdmin} 
            onClose={() => setShowModal(false)} 
            onSave={loadData} 
          />
        )}
      </div>
    </Shell>
  )
}
