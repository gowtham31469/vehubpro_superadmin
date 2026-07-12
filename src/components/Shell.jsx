import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { LayoutDashboard, Building2, CreditCard, Boxes, LogOut, ChevronDown, Sun, Moon, Monitor, PanelLeftClose, PanelRightClose } from 'lucide-react'
import { PURPLE, TEAL } from '../brand.js'

function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system')

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    
    function applyTheme() {
      if (theme === 'dark' || (theme === 'system' && media.matches)) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    
    applyTheme()
    
    if (theme === 'system') {
      media.addEventListener('change', applyTheme)
      return () => media.removeEventListener('change', applyTheme)
    }
  }, [theme])

  const setTheme = (newTheme) => {
    if (newTheme === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', newTheme)
    }
    setThemeState(newTheme)
  }

  return { theme, setTheme }
}

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/tenants',   label: 'Tenants',   Icon: Building2 },
  { to: '/plans',     label: 'Plans',      Icon: CreditCard },
  { to: '/modules',   label: 'Modules',    Icon: Boxes },
]

export default function Shell({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('sidebar-open') === 'false' ? false : true)
  const profileRef = useRef(null)
  const { theme, setTheme } = useTheme()

  const toggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    localStorage.setItem('sidebar-open', newState)
  }

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Sidebar */}
      <aside className={`flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-60' : 'w-16'}`}>

        {/* Logo */}
        <div className={`flex flex-shrink-0 items-center justify-center border-b border-slate-100 dark:border-slate-800 ${sidebarOpen ? 'h-16 px-4 py-2' : 'h-16 p-2.5'}`}>
          <img
            src={sidebarOpen
              ? (isDarkMode ? '/Vehubpro-logo-white.png' : '/logo.png')
              : (isDarkMode ? '/Vehubpro-logo-small-white.png' : '/logo_small.png')
            }
            alt="VeHubPro"
            className={sidebarOpen ? 'w-full max-h-14 object-contain' : 'h-16 w-auto object-contain'}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
          />
          {/* Fallback when logo not found */}
          <div className="hidden flex-col items-center gap-1 text-center">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg font-black text-white"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})` }}
            >
              VH
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">VeHubPro</p>
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500">Super Admin</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className={`flex-1 ${sidebarOpen ? 'space-y-0.5 px-3 py-4' : 'space-y-2 py-4 flex flex-col items-center'}`}>
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center ${sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'} rounded-xl text-sm font-semibold transition ${
                  isActive ? 'text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: PURPLE } : undefined}
              title={!sidebarOpen ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon size={sidebarOpen ? 17 : 20} strokeWidth={2.2} color={isActive ? 'white' : undefined} />
                  {sidebarOpen && label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Close Button */}
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center border-t border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${sidebarOpen ? 'h-12 w-full' : 'h-10 w-10 mx-auto'}`}
          title={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? (
            <PanelLeftClose size={20} strokeWidth={2} />
          ) : (
            <PanelRightClose size={18} strokeWidth={2} />
          )}
        </button>

      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 transition-colors">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">VeHubPro Admin</h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Theme Toggle component matching the design snapshot */}
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center rounded-full p-1.5 transition ${theme === 'light' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                style={theme === 'light' ? { backgroundColor: PURPLE } : undefined}
              >
                <Sun size={15} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center rounded-full p-1.5 transition ${theme === 'system' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                style={theme === 'system' ? { backgroundColor: PURPLE } : undefined}
              >
                <Monitor size={15} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center rounded-full p-1.5 transition ${theme === 'dark' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                style={theme === 'dark' ? { backgroundColor: PURPLE } : undefined}
              >
                <Moon size={15} />
              </button>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1 pl-1 pr-3 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: PURPLE }}
              >
                {user?.first_name ? user.first_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'A')}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {user?.first_name ? user.first_name : 'Admin'}
              </span>
              <ChevronDown size={14} className="text-slate-400 dark:text-slate-500" />
            </button>
            
            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 shadow-lg">
                <div className="border-b border-slate-100 dark:border-slate-700 px-4 pb-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.email || 'admin@vehubpro.com'}</p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => { logout(); navigate('/') }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <LogOut size={15} strokeWidth={2.2} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 transition-colors">{children}</main>
      </div>
    </div>
  )
}
