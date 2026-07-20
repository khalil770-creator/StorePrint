import { createContext, useContext, useState, useCallback } from 'react'
import React from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_admin_user')) } catch { return null }
  })

  const login = useCallback((token, userData) => {
    localStorage.setItem('sp_admin_token', token)
    localStorage.setItem('sp_admin_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sp_admin_token')
    localStorage.removeItem('sp_admin_user')
    setUser(null)
  }, [])

  return React.createElement(AuthCtx.Provider, { value: { user, login, logout } }, children)
}

export function useAuth() {
  return useContext(AuthCtx)
}
