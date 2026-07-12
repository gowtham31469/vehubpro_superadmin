const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`

let refreshPromise = null

function getToken() {
  return localStorage.getItem('sa_token')
}

function getRefreshToken() {
  return localStorage.getItem('sa_refresh')
}

function handleSessionExpired() {
  localStorage.removeItem('sa_token')
  localStorage.removeItem('sa_refresh')
  localStorage.removeItem('sa_user')
  globalThis.location.href = '/'
  throw new Error('SESSION_EXPIRED')
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = getRefreshToken()
    if (!refresh) throw new Error('NO_REFRESH_TOKEN')

    const response = await fetch(`${BASE}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) throw new Error('REFRESH_FAILED')

    const json = await response.json().catch(() => ({}))
    const data = json.data ?? json
    if (!data.access) throw new Error('INVALID_REFRESH_RESPONSE')

    localStorage.setItem('sa_token', data.access)
    if (data.refresh) localStorage.setItem('sa_refresh', data.refresh)
    
    return data.access
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function fetchWithRetry(url, options = {}) {
  let token = getToken()
  if (token) {
    options.headers = options.headers || {}
    options.headers['Authorization'] = `Bearer ${token}`
  }

  let res = await fetch(url, options)

  if (res.status === 401) {
    try {
      token = await refreshAccessToken()
      options.headers['Authorization'] = `Bearer ${token}`
      res = await fetch(url, options)
      
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED_AFTER_REFRESH')
      }
    } catch (e) {
      handleSessionExpired()
    }
  }

  return res
}

function extractErrorMessage(json) {
  // Try nested error structure FIRST (e.g. from validation)
  const err = json?.error
  if (err) {
    if (typeof err === 'string') return err
    if (Array.isArray(err?.non_field_errors) && err.non_field_errors.length > 0) {
      return err.non_field_errors[0]
    }
    if (Array.isArray(err) && err.length > 0) return String(err[0])
    // Field-level errors
    if (typeof err === 'object') {
      const firstField = Object.values(err)[0]
      if (Array.isArray(firstField) && firstField.length > 0) return String(firstField[0])
      if (typeof firstField === 'string') return firstField
    }
  }

  // Fall back to standard fields
  if (json?.message && json.message !== 'Validation failed.') return json.message
  if (json?.detail) return json.detail

  return null
}

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }

  const res = await fetchWithRetry(`${BASE}${path}`, options)

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = extractErrorMessage(json)
    throw new Error(msg || `Error ${res.status}`)
  }

  return json.data ?? json
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login/', { email, password })

// ── Tenants ───────────────────────────────────────────────────────────────────
export const fetchTenants = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return api.get(`/tenants/${q ? `?${q}` : ''}`)
}
export const fetchTenant  = (id)       => api.get(`/tenants/${id}/`)
export const createTenant = (data)     => api.post('/tenants/', data)
export const updateTenant = (id, data) => api.patch(`/tenants/${id}/`, data)
export const deleteTenant = (id)       => api.delete(`/tenants/${id}/`)

// ── Tenant PII ────────────────────────────────────────────────────────────────
export const fetchTenantsPII  = ()          => api.get('/tenants/pii/')
export const fetchTenantPII   = (tenantId)  => api.get(`/tenants/pii/?tenant=${tenantId}`)
export const createTenantPII  = (data)      => api.post('/tenants/pii/', data)
export const updateTenantPII  = (id, data)  => api.patch(`/tenants/pii/${id}/`, data)

// ── Tenant Branding ───────────────────────────────────────────────────────────
async function brandingUpload(method, path, formData) {
  const res = await fetchWithRetry(`${BASE}${path}`, { method, body: formData })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || json?.detail || `Error ${res.status}`)
  return json.data ?? json
}
export const fetchTenantBranding  = (tenantId) => api.get(`/tenants/branding/?tenant=${tenantId}`)
export const createTenantBranding = (fd) => brandingUpload('POST',  '/tenants/branding/',      fd)
export const updateTenantBranding = (id, fd) => brandingUpload('PATCH', `/tenants/branding/${id}/`, fd)

// ── Plans ─────────────────────────────────────────────────────────────────────
export const fetchPlans   = ()          => api.get('/billing/plans/')
export const createPlan   = (data)      => api.post('/billing/plans/', data)
export const updatePlan   = (id, data)  => api.patch(`/billing/plans/${id}/`, data)

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const fetchTenantSubscriptions = (tenantId) => api.get(`/billing/subscriptions/?tenant=${tenantId}`)
export const createSubscription       = (data)     => api.post('/billing/subscriptions/', data)
export const updateSubscription       = (id, data) => api.patch(`/billing/subscriptions/${id}/`, data)

// ── Tenant Modules ────────────────────────────────────────────────────────────
export const fetchTenantModules  = (tenantId) => api.get(`/modules/assignments/?tenant_id=${tenantId}`)
export const createTenantModule  = (data)      => api.post('/modules/assignments/', data)
export const deleteTenantModule  = (id)        => api.delete(`/modules/assignments/${id}/`)

// ── Tenant Admins ─────────────────────────────────────────────────────────────
export const fetchTenantAdmins  = (tenantId) => api.get(`/users/tenant-admins/?tenant_id=${tenantId}`)
export const createTenantAdmin  = (data)     => api.post('/users/tenant-admins/', data)
export const updateTenantAdmin  = (id, data) => api.patch(`/users/tenant-admins/${id}/`, data)
export const deleteTenantAdmin  = (id)       => api.delete(`/users/tenant-admins/${id}/`)

// ── Modules ───────────────────────────────────────────────────────────────────
export const fetchModules      = ()                    => api.get('/modules/')
export const createModule      = (data)                => api.post('/modules/', data)
export const updateModule      = (id, data)            => api.patch(`/modules/${id}/`, data)
export const fetchSubmodules   = (moduleId)            => api.get(`/modules/${moduleId}/submodules/`)
export const createSubmodule   = (moduleId, data)      => api.post(`/modules/${moduleId}/submodules/`, data)
export const updateSubmodule   = (moduleId, id, data)  => api.patch(`/modules/${moduleId}/submodules/${id}/`, data)
export const deleteSubmodule   = (moduleId, id)        => api.delete(`/modules/${moduleId}/submodules/${id}/`)
export const fetchTenantPermissionHierarchy = (tenantId) => api.get(`/modules/tenant-permissions/?tenant_id=${tenantId}`)
