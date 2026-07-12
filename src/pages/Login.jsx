import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

import { useAuth } from '../context/AuthContext.jsx'
import { login } from '../utils/api.js'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'

import { ACCENT, PURPLE, TEAL } from '../brand.js'

export default function Login() {
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email.trim().toLowerCase(), password)
      const { access, refresh, user } = res

      if (!user?.is_superuser) {
        setError('Access denied. This portal is restricted to Super Admins only.')
        return
      }

      localStorage.setItem('sa_refresh', refresh || '')
      flushSync(() => setAuth(access, user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 dark:opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: PURPLE }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: TEAL }} />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <Card className="p-8 shadow-2xl border-white/20 dark:border-white/5" noPadding={false}>
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-2 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="VeHubPro"
                className="h-24 w-auto object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
              />
              <div
                className="hidden h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})` }}
              >
                VH
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Super Admin Portal</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vehubpro.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm dark:text-white outline-none transition focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 shadow-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full py-3.5 mt-2 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </>
              )}
            </Button>
          </form>
        </Card>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center">
            VeHubPro Platform © {new Date().getFullYear()} <br/>
            <span className="opacity-50">Enterprise Management System</span>
          </p>
        </div>
      </div>
    </div>
  )
}

