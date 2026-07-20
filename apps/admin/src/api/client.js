import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sp_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  res => res,
  err => {
    // Only redirect on 401 if we have a token (i.e. it expired mid-session)
    // Don't redirect on the login call itself
    if (err.response?.status === 401) {
      const token = localStorage.getItem('sp_admin_token')
      const isLoginCall = err.config?.url?.includes('/auth/login')
      if (token && !isLoginCall) {
        localStorage.removeItem('sp_admin_token')
        localStorage.removeItem('sp_admin_user')
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

export default client
