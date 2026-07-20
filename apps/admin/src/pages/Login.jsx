import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../store/authStore'
import client from '../api/client'
import { colors, shadow, fonts } from '../theme'

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: colors.background, fontFamily: fonts.body,
  },
  card: {
    background: colors.white, borderRadius: 16, padding: '40px 40px 36px',
    width: '100%', maxWidth: 400, boxShadow: shadow.md,
    border: `1px solid ${colors.border}`,
  },
  logo:    { textAlign: 'center', marginBottom: 32 },
  mark:    {
    width: 52, height: 52, background: colors.primary, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: fonts.headline,
    margin: '0 auto 14px',
  },
  appName: {
    fontSize: 24, fontWeight: 700, color: colors.dark,
    fontFamily: fonts.headline, letterSpacing: '-0.4px',
  },
  sub: {
    fontSize: 11, color: colors.lightGrey, textTransform: 'uppercase',
    letterSpacing: '1px', marginTop: 4, fontFamily: fonts.label,
  },
  title:   { fontSize: 18, fontWeight: 600, color: colors.dark, marginBottom: 4, fontFamily: fonts.headline },
  desc:    { fontSize: 13, color: colors.midGrey, marginBottom: 24, fontFamily: fonts.body },
  label:   {
    display: 'block', fontSize: 12, fontWeight: 600, color: colors.darkGrey,
    marginBottom: 6, fontFamily: fonts.label, textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  input: {
    width: '100%', padding: '11px 14px', border: `1.5px solid ${colors.border}`,
    borderRadius: 8, fontSize: 14, color: colors.dark, outline: 'none',
    background: colors.background, boxSizing: 'border-box', fontFamily: fonts.body,
    transition: 'border-color 0.15s',
  },
  group:   { marginBottom: 16 },
  btn: {
    width: '100%', padding: '13px', background: colors.primary, color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', marginTop: 8, fontFamily: fonts.body,
    letterSpacing: '0.2px',
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: {
    background: colors.errorBg, border: `1px solid ${colors.error}33`,
    borderLeft: `3px solid ${colors.error}`,
    borderRadius: 8, padding: '10px 14px', color: colors.error,
    fontSize: 13, marginBottom: 16, fontFamily: fonts.body,
  },
  badge: {
    display: 'block', marginTop: 24, fontSize: 11, color: colors.lightGrey,
    textAlign: 'center', fontFamily: fonts.body,
  },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const mutation = useMutation({
    mutationFn: () => client.post('/auth/login', { email, password }).then(r => r.data),
    onSuccess: (data) => {
      const token = data.tokens?.access
      const user  = data.user
      if (!token || !user) { setErrorMsg('Unexpected login response. Please try again.'); return }
      login(token, user)
      navigate('/admin', { replace: true })
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error || 'Login failed. Check your credentials.')
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    if (!email || !password) { setErrorMsg('Email and password are required.'); return }
    mutation.mutate()
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.mark}>SP</div>
          <div style={s.appName}>StorePrint</div>
          <div style={s.sub}>Admin Portal</div>
        </div>

        <div style={s.title}>Sign in to continue</div>
        <div style={s.desc}>Access is restricted to administrators only.</div>

        {errorMsg && <div style={s.error}>⚠️ {errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Email address</label>
            <input
              style={s.input}
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...s.input, paddingRight: 44 }}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button
            style={{ ...s.btn, ...(mutation.isPending ? s.btnDisabled : {}) }}
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <span style={s.badge}>StorePrint v1.0 · Self-hosted · Secure admin access</span>
      </div>
    </div>
  )
}
