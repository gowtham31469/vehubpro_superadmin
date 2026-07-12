import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tenants from './pages/Tenants.jsx'
import TenantCreate from './pages/TenantCreate.jsx'
import TenantEdit from './pages/TenantEdit.jsx'
import TenantDetails from './pages/TenantDetails.jsx'
import Plans from './pages/Plans.jsx'
import Modules from './pages/Modules.jsx'

function PrivateRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!user?.is_superuser) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/tenants" element={<PrivateRoute><Tenants /></PrivateRoute>} />
      <Route path="/tenants/new" element={<PrivateRoute><TenantCreate /></PrivateRoute>} />
      <Route path="/tenants/:id" element={<PrivateRoute><TenantDetails /></PrivateRoute>} />
      <Route path="/tenants/:id/edit" element={<PrivateRoute><TenantEdit /></PrivateRoute>} />
      <Route path="/plans" element={<PrivateRoute><Plans /></PrivateRoute>} />
      <Route path="/modules" element={<PrivateRoute><Modules /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
