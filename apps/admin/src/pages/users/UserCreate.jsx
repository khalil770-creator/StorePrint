import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

const fetchRoles  = () => client.get('/roles').then(r => Array.isArray(r.data) ? r.data : (r.data.data ?? []))
const fetchStores = () => client.get('/stores').then(r => r.data?.data ?? r.data ?? [])

const s = {
  page:   { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
  card:   { background: colors.white, borderRadius: 12, boxShadow: shadow.md, padding: '32px 36px', maxWidth: 700 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: colors.midGrey, textTransform: 'uppercase',
                  letterSpacing: 0.6, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${colors.border}`, marginTop: 24 },
  grid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' },
  full:   { gridColumn: '1 / -1' },
  field:  { display: 'flex', flexDirection: 'column', gap: 6 },
  label:  { fontSize: 12, fontWeight: 600, color: colors.darkGrey },
  req:    { color: colors.error },
  input:  { padding: '9px 13px', border: `1.5px solid ${colors.border}`, borderRadius: 8,
            fontSize: 14, color: colors.dark, outline: 'none', background: colors.white,
            width: '100%', boxSizing: 'border-box' },
  inputErr: { borderColor: colors.error },
  select: { padding: '9px 13px', border: `1.5px solid ${colors.border}`, borderRadius: 8,
            fontSize: 14, color: colors.dark, outline: 'none', background: colors.white,
            width: '100%', boxSizing: 'border-box', cursor: 'pointer' },
  fieldErr: { fontSize: 12, color: colors.error, marginTop: 2 },
  hint:   { fontSize: 12, color: colors.midGrey, marginTop: 4 },
  actions: { display: 'flex', gap: 12, marginTop: 28, paddingTop: 20, borderTop: `1px solid ${colors.border}` },
  submitBtn: { padding: '10px 24px', background: colors.primary, color: '#fff', border: 'none',
               borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  submitDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  cancelBtn: { padding: '10px 20px', background: 'transparent', color: colors.midGrey,
               border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  mutationErr: { marginTop: 14, padding: '10px 14px', background: '#FEE2E2',
                 border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13 },
  tempPwBox: { marginTop: 16, padding: '14px 18px', background: '#ECFDF5', border: '1px solid #6EE7B7',
               borderRadius: 10, fontSize: 13, color: '#065F46' },
}

export default function UserCreate() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: roles  = [] } = useQuery({ queryKey: ['roles'],  queryFn: fetchRoles  })
  const { data: stores = [] } = useQuery({ queryKey: ['stores'], queryFn: fetchStores })

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role_id: '', store_id: '',
  })
  const [errors, setErrors]   = useState({})
  const [mutErr, setMutErr]   = useState('')
  const [tempPw, setTempPw]   = useState('')

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    return e
  }

  const mutation = useMutation({
    mutationFn: (body) => client.post('/users', body).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      if (data.temp_password) {
        setTempPw(data.temp_password)
      } else {
        window.alert('User created successfully.')
        navigate('/admin/users')
      }
    },
    onError: (err) => {
      setMutErr(err.response?.data?.error || 'Failed to create user.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setMutErr('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    mutation.mutate({
      name:      form.name.trim(),
      email:     form.email.trim().toLowerCase(),
      phone:     form.phone.trim() || undefined,
      password:  form.password.trim() || undefined,
      role_id:   form.role_id  || undefined,
      store_ids: form.store_id ? [form.store_id] : [],
    })
  }

  // Show temp password screen after creation
  if (tempPw) {
    return (
      <div style={s.page}>
        <PageHeader title="User Created" subtitle="Save the login credentials below" onBack={() => navigate('/admin/users')} />
        <div style={{ ...s.card, textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.dark, marginBottom: 8 }}>User created successfully</div>
          <div style={{ fontSize: 14, color: colors.midGrey, marginBottom: 24 }}>
            Share these one-time credentials with the user. They should change their password after first login.
          </div>
          <div style={{ background: colors.background, borderRadius: 10, padding: '16px 24px', textAlign: 'left',
                        border: `1px solid ${colors.border}`, marginBottom: 24 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: colors.midGrey, fontWeight: 600 }}>Email: </span>
              <span style={{ fontWeight: 700, color: colors.dark }}>{form.email}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: colors.midGrey, fontWeight: 600 }}>Temporary Password: </span>
              <span style={{ fontWeight: 800, color: colors.primary, fontFamily: 'monospace', fontSize: 16 }}>{tempPw}</span>
            </div>
          </div>
          <button
            style={{ ...s.submitBtn, padding: '11px 28px' }}
            onClick={() => navigate('/admin/users')}
          >
            Back to Users →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="New User"
        subtitle="Create a user account and assign a role"
        onBack={() => navigate('/admin/users')}
      />

      <form onSubmit={handleSubmit} noValidate>
        <div style={s.card}>

          {/* Personal Info */}
          <div style={s.sectionTitle} role="heading">Personal Information</div>
          <div style={s.grid}>
            <div style={s.field}>
              <label style={s.label}>Full Name <span style={s.req}>*</span></label>
              <input
                style={{ ...s.input, ...(errors.name ? s.inputErr : {}) }}
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Ahmed Al Rashidi"
              />
              {errors.name && <span style={s.fieldErr}>{errors.name}</span>}
            </div>

            <div style={s.field}>
              <label style={s.label}>Email Address <span style={s.req}>*</span></label>
              <input
                style={{ ...s.input, ...(errors.email ? s.inputErr : {}) }}
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="user@company.com"
              />
              {errors.email && <span style={s.fieldErr}>{errors.email}</span>}
            </div>

            <div style={s.field}>
              <label style={s.label}>Phone</label>
              <input
                style={s.input}
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+971 50 123 4567"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                style={s.input}
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Leave blank to auto-generate"
              />
              <span style={s.hint}>Leave blank to auto-generate a temporary password</span>
            </div>
          </div>

          {/* Access */}
          <div style={s.sectionTitle}>Access & Store Assignment</div>
          <div style={s.grid}>
            <div style={s.field}>
              <label style={s.label}>Role</label>
              <select style={s.select} value={form.role_id} onChange={set('role_id')}>
                <option value="">— No role —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>Store</label>
              <select style={s.select} value={form.store_id} onChange={set('store_id')}>
                <option value="">— No store —</option>
                {(Array.isArray(stores) ? stores : []).map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          {mutErr && <div style={s.mutationErr}>⚠️ {mutErr}</div>}

          <div style={s.actions}>
            <button
              type="submit"
              style={{ ...s.submitBtn, ...(mutation.isPending ? s.submitDisabled : {}) }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Creating…' : 'Create User'}
            </button>
            <button type="button" style={s.cancelBtn} onClick={() => navigate('/admin/users')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
