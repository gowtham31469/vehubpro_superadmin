import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sa_token') || null)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sa_user') || 'null') } catch { return null }
  })

  const login = (accessToken, userInfo) => {
    localStorage.setItem('sa_token', accessToken)
    localStorage.setItem('sa_user', JSON.stringify(userInfo))
    setToken(accessToken)
    setUser(userInfo)
  }

  const logout = () => {
    localStorage.removeItem('sa_token')
    localStorage.removeItem('sa_refresh')
    localStorage.removeItem('sa_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
