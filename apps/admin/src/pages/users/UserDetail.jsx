import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

// ─── data fetchers ────────────────────────────────────────────────────────────
const fetchUser = async (id) => {
  const { data } = await client.get(`/users/${id}`)
  return data?.data ?? data
}

const fetchRoles = async () => {
  const { data } = await client.get('/roles')
  return Array.isArray(data) ? data : (data.data ?? [])
}

const fetchStores = async () => {
  const { data } = await client.get('/stores')
  return Array.isArray(data) ? data : (data.data ?? [])
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    padding: '32px 40px',
    background: colors.background,
    minHeight: '100vh',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    background: colors.white,
    borderRadius: 12,
    boxShadow: shadow.md,
    padding: '32px 36px',
    maxWidth: 680,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.midGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: `1px solid ${colors.border}`,
  },
  fieldGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 24px',
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.darkGrey,
  },
  input: {
    padding: '9px 13px',
    border: `1.5px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: colors.dark,
    outline: 'none',
    background: colors.white,
    transition: 'border-color 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputReadonly: {
    padding: '9px 13px',
    border: `1.5px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: colors.midGrey,
    background: '#F9FAFB',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'not-allowed',
  },
  select: {
    padding: '9px 13px',
    border: `1.5px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: colors.dark,
    outline: 'none',
    background: colors.white,
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'auto',
  },
  statusChips: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 32,
    paddingTop: 24,
    borderTop: `1px solid ${colors.border}`,
    alignItems: 'center',
  },
  saveBtn: {
    padding: '10px 22px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    padding: '10px 22px',
    background: colors.lightGrey,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'not-allowed',
  },
  deactivateBtn: {
    padding: '10px 22px',
    background: 'transparent',
    color: colors.error,
    border: `1.5px solid ${colors.error}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  deactivateBtnDisabled: {
    padding: '10px 22px',
    background: 'transparent',
    color: colors.lightGrey,
    border: `1.5px solid ${colors.lightGrey}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'not-allowed',
    marginLeft: 'auto',
  },
  centerMsg: {
    padding: '80px 0',
    textAlign: 'center',
    color: colors.midGrey,
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 12,
    padding: '8px 16px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-block',
  },
  mutationError: {
    marginTop: 12,
    padding: '10px 14px',
    background: '#FEE2E2',
    border: `1px solid #FECACA`,
    borderRadius: 8,
    color: '#991B1B',
    fontSize: 13,
  },
}

const STATUS_OPTIONS = ['active', 'inactive', 'suspended']

// ─── chip sub-component ───────────────────────────────────────────────────────
function StatusChip({ value, selected, onClick }) {
  const chipColors = {
    active:    { bg: selected ? '#D1FAE5' : '#F3F4F6', color: selected ? '#065F46' : colors.midGrey, border: selected ? '#6EE7B7' : colors.border },
    inactive:  { bg: selected ? '#F3F4F6' : '#F3F4F6', color: selected ? colors.darkGrey : colors.midGrey, border: selected ? colors.darkGrey : colors.border },
    suspended: { bg: selected ? '#FEE2E2' : '#F3F4F6', color: selected ? '#991B1B' : colors.midGrey, border: selected ? '#FECACA' : colors.border },
  }
  const c = chipColors[value] ?? chipColors.inactive

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 16px',
        borderRadius: 20,
        border: `1.5px solid ${c.border}`,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        textTransform: 'capitalize',
        transition: 'all 0.15s',
        outline: selected ? `2px solid ${c.border}` : 'none',
        outlineOffset: 1,
      }}
    >
      {value}
    </button>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ userId, userName, onClose }) {
  const [newPw, setNewPw]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [result, setResult]   = useState('')   // shows the new password after reset

  const mutation = useMutation({
    mutationFn: (body) => client.post(`/users/${userId}/reset-password`, body).then(r => r.data),
    onSuccess: (data) => {
      if (data.new_password) {
        setResult(data.new_password)
      } else {
        window.alert('Password updated successfully.')
        onClose()
      }
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to reset password'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (newPw && newPw.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPw && newPw !== confirm) { setError('Passwords do not match'); return }
    mutation.mutate(newPw ? { new_password: newPw } : {})
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }
  const modal = {
    background: colors.white, borderRadius: 14, width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '32px 32px 28px',
  }
  const ms = {
    title:   { fontSize: 17, fontWeight: 800, color: colors.dark, marginBottom: 6 },
    sub:     { fontSize: 13, color: colors.midGrey, marginBottom: 22 },
    label:   { display: 'block', fontSize: 12, fontWeight: 600, color: colors.darkGrey, marginBottom: 6 },
    input:   { width: '100%', padding: '9px 13px', border: `1.5px solid ${colors.border}`,
               borderRadius: 8, fontSize: 14, color: colors.dark, outline: 'none',
               boxSizing: 'border-box', marginBottom: 14 },
    hint:    { fontSize: 12, color: colors.midGrey, marginBottom: 14, marginTop: -10 },
    err:     { padding: '9px 13px', background: '#FEE2E2', border: '1px solid #FECACA',
               borderRadius: 8, color: '#991B1B', fontSize: 13, marginBottom: 14 },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
    saveBtn: { padding: '9px 20px', background: colors.primary, color: '#fff', border: 'none',
               borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    cancelBtn:{ padding: '9px 18px', background: 'transparent', color: colors.midGrey,
               border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' },
    pwBox:   { background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 10,
               padding: '16px 20px', marginBottom: 18 },
    pwLabel: { fontSize: 12, color: '#065F46', fontWeight: 600, marginBottom: 6 },
    pwValue: { fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: colors.primary, letterSpacing: 1 },
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modal}>
        <div style={ms.title}>Reset Password — {userName}</div>
        <div style={ms.sub}>Enter a new password or leave blank to auto-generate one.</div>

        {result ? (
          <>
            <div style={ms.pwBox}>
              <div style={ms.pwLabel}>New auto-generated password:</div>
              <div style={ms.pwValue}>{result}</div>
            </div>
            <div style={{ fontSize: 12, color: colors.midGrey, marginBottom: 18 }}>
              Share this with the user. They should change it after first login.
            </div>
            <div style={ms.actions}>
              <button style={ms.saveBtn} onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={ms.label}>New Password</label>
            <input style={ms.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Leave blank to auto-generate" autoFocus />
            <div style={ms.hint}>Minimum 6 characters, or leave blank for auto-generated password</div>

            {newPw && (
              <>
                <label style={ms.label}>Confirm Password</label>
                <input style={ms.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter new password" />
              </>
            )}

            {error && <div style={ms.err}>⚠️ {error}</div>}

            <div style={ms.actions}>
              <button type="button" style={ms.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" style={{ ...ms.saveBtn, ...(mutation.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }} disabled={mutation.isPending}>
                {mutation.isPending ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showResetPw, setShowResetPw] = useState(false)

  // ── queries ──────────────────────────────────────────────────────────────
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 120_000,
  })

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 120_000,
  })

  // ── form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role_id: '',
    store_ids: [],
    status: 'active',
  })

  // Populate form when user data arrives
  useEffect(() => {
    if (user) {
      setForm({
        name:     user.name     ?? '',
        phone:    user.phone    ?? '',
        role_id:  user.role_id  != null ? String(user.role_id)  : '',
        store_ids: user.store_ids ?? (user.store_id ? [user.store_id] : []),
        status:   user.status   ?? 'active',
      })
    }
  }, [user])

  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleStatusChip = (val) =>
    setForm(prev => ({ ...prev, status: val }))

  // ── save mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (body) => client.put(`/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      window.alert('User updated successfully')
    },
  })

  const handleSave = (e) => {
    e.preventDefault()
    saveMutation.mutate({
      name:     form.name.trim(),
      phone:    form.phone.trim(),
      role_id:  form.role_id  || null,   // UUIDs — never convert with Number()
      store_ids: form.store_ids,
      status:   form.status,
    })
  }

  // ── deactivate mutation ───────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: () => client.put(`/users/${id}/status`, { status: 'inactive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setForm(prev => ({ ...prev, status: 'inactive' }))
    },
  })

  const handleDeactivate = () => {
    if (
      window.confirm(
        `Are you sure you want to deactivate ${user?.name ?? 'this user'}? They will lose access immediately.`,
      )
    ) {
      deactivateMutation.mutate()
    }
  }

  // ── render states ─────────────────────────────────────────────────────────
  if (userLoading) {
    return (
      <div style={s.page}>
        <PageHeader
          title="User Detail"
          subtitle="Edit user account"
          onBack={() => navigate('/admin/users')}
        />
        <div style={s.centerMsg}>Loading…</div>
      </div>
    )
  }

  if (userError) {
    return (
      <div style={s.page}>
        <PageHeader
          title="User Detail"
          subtitle="Edit user account"
          onBack={() => navigate('/admin/users')}
        />
        <div style={s.centerMsg}>
          <div>Failed to load user. Retry?</div>
          <button style={s.retryBtn} onClick={() => refetchUser()}>Retry</button>
        </div>
      </div>
    )
  }

  const isSaving      = saveMutation.isPending
  const isDeactivating = deactivateMutation.isPending
  const isBusy        = isSaving || isDeactivating

  return (
    <div style={s.page}>
      <PageHeader
        title={user?.name || 'User Detail'}
        subtitle="Edit user account"
        onBack={() => navigate('/admin/users')}
      />

      {showResetPw && (
        <ResetPasswordModal
          userId={id}
          userName={user?.name || 'User'}
          onClose={() => setShowResetPw(false)}
        />
      )}

      <form onSubmit={handleSave}>
        <div style={s.card}>

          {/* ── Personal Info ── */}
          <div style={s.section}>
            <div style={s.sectionTitle}>Personal Information</div>
            <div style={s.fieldGroup}>
              {/* Name */}
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input
                  style={s.input}
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Full name"
                  required
                />
              </div>

              {/* Email (readonly) */}
              <div style={s.field}>
                <label style={s.label}>Email Address</label>
                <input
                  style={s.inputReadonly}
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  tabIndex={-1}
                />
              </div>

              {/* Phone */}
              <div style={s.field}>
                <label style={s.label}>Phone</label>
                <input
                  style={s.input}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>
          </div>

          {/* ── Access & Store ── */}
          <div style={s.section}>
            <div style={s.sectionTitle}>Access & Store</div>
            <div style={s.fieldGroup}>
              {/* Role */}
              <div style={s.field}>
                <label style={s.label}>Role</label>
                <select
                  style={s.select}
                  value={form.role_id}
                  onChange={handleChange('role_id')}
                >
                  <option value="">— Select role —</option>
                  {roles.map(r => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stores */}
              <div style={s.field}>
                <label style={s.label}>Stores (hold Ctrl/Cmd to select multiple)</label>
                <select
                  multiple
                  style={{ ...s.select, height: 120 }}
                  value={form.store_ids}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value)
                    setForm(prev => ({ ...prev, store_ids: selected }))
                  }}
                >
                  {stores.map(st => (
                    <option key={st.id} value={String(st.id)}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Account Status ── */}
          <div style={s.section}>
            <div style={s.sectionTitle}>Account Status</div>
            <div style={s.statusChips}>
              {STATUS_OPTIONS.map(opt => (
                <StatusChip
                  key={opt}
                  value={opt}
                  selected={form.status === opt}
                  onClick={() => handleStatusChip(opt)}
                />
              ))}
            </div>
          </div>

          {/* ── Mutation errors ── */}
          {saveMutation.isError && (
            <div style={s.mutationError}>
              Save failed:{' '}
              {saveMutation.error?.response?.data?.message ?? saveMutation.error?.message ?? 'Unknown error'}
            </div>
          )}
          {deactivateMutation.isError && (
            <div style={s.mutationError}>
              Deactivate failed:{' '}
              {deactivateMutation.error?.response?.data?.message ?? deactivateMutation.error?.message ?? 'Unknown error'}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={s.actions}>
            <button
              type="submit"
              style={isBusy ? s.saveBtnDisabled : s.saveBtn}
              disabled={isBusy}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>

            <button
              type="button"
              style={{
                padding: '10px 22px', background: 'transparent', color: colors.info,
                border: `1.5px solid ${colors.info}`, borderRadius: 8, fontSize: 14,
                fontWeight: 700, cursor: 'pointer',
              }}
              onClick={() => setShowResetPw(true)}
              disabled={isBusy}
            >
              🔑 Reset Password
            </button>

            <button
              type="button"
              style={isBusy ? s.deactivateBtnDisabled : s.deactivateBtn}
              disabled={isBusy || form.status === 'inactive'}
              onClick={handleDeactivate}
            >
              {isDeactivating ? 'Deactivating…' : 'Deactivate User'}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}
