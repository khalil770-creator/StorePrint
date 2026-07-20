import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

// Must match MODULE_MAP keys in apps/mobile/src/utils/permissions.js
const MODULES = ['admin', 'brand_hub', 'auditing', 'field', 'campaigns', 'vm', 'signage', 'training', 'environment', 'cx', 'analytics']
const ACTIONS = ['create', 'read', 'update', 'delete', 'export']

function getData(res) {
  return res?.data?.data ?? res?.data ?? null
}

// ─── Shared Role Modal (create + edit) ───────────────────────────────────────
function RoleModal({ role, onClose, onSaved }) {
  const isEdit = !!role
  const qc = useQueryClient()

  const [name,  setName]  = useState(role?.name        ?? '')
  const [desc,  setDesc]  = useState(role?.description ?? '')
  const [perms, setPerms] = useState(() => {
    if (!role?.permissions) return {}
    // normalise — stored as { module: { action: bool } } or {}
    return typeof role.permissions === 'object' ? role.permissions : {}
  })
  const [error, setError] = useState('')

  // If role prop changes (shouldn't, but safety), re-seed
  useEffect(() => {
    if (role) {
      setName(role.name ?? '')
      setDesc(role.description ?? '')
      setPerms(typeof role.permissions === 'object' ? role.permissions : {})
    }
  }, [role?.id])

  const mutation = useMutation({
    mutationFn: (body) => isEdit
      ? client.put(`/roles/${role.id}`, body).then(r => r.data)
      : client.post('/roles', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      onSaved()
    },
    onError: (err) => setError(err.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} role`),
  })

  const togglePerm = (mod, action) => {
    setPerms(prev => ({
      ...prev,
      [mod]: { ...(prev[mod] || {}), [action]: !(prev[mod]?.[action]) },
    }))
  }

  const toggleAll = (mod) => {
    const allOn = ACTIONS.every(a => perms[mod]?.[a])
    setPerms(prev => ({
      ...prev,
      [mod]: Object.fromEntries(ACTIONS.map(a => [a, !allOn])),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Role name is required'); return }
    mutation.mutate({ name: name.trim(), description: desc.trim(), permissions: perms })
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }
  const modal = {
    background: colors.white, borderRadius: 14, width: '100%', maxWidth: 700,
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    padding: '32px 36px',
  }
  const s = {
    title:    { fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 20 },
    label:    { display: 'block', fontSize: 12, fontWeight: 600, color: colors.darkGrey, marginBottom: 6 },
    input:    { width: '100%', padding: '9px 13px', border: `1.5px solid ${colors.border}`, borderRadius: 8,
                fontSize: 14, color: colors.dark, outline: 'none', boxSizing: 'border-box', marginBottom: 14 },
    secTitle: { fontSize: 11, fontWeight: 700, color: colors.midGrey, textTransform: 'uppercase',
                letterSpacing: 0.8, margin: '20px 0 12px' },
    table:    { width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 },
    th:       { padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: colors.midGrey,
                background: colors.background, borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap' },
    thFirst:  { padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: colors.midGrey,
                background: colors.background, borderBottom: `1px solid ${colors.border}` },
    td:       { padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` },
    tdFirst:  { padding: '7px 12px', textAlign: 'left', fontWeight: 600, color: colors.dark,
                borderBottom: `1px solid ${colors.border}` },
    cb:       { width: 15, height: 15, cursor: 'pointer', accentColor: colors.primary },
    actions:  { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
    saveBtn:  { padding: '10px 22px', background: colors.primary, color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    cancelBtn:{ padding: '10px 20px', background: 'transparent', color: colors.midGrey,
                border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' },
    errMsg:   { marginBottom: 12, padding: '9px 13px', background: '#FEE2E2', border: '1px solid #FECACA',
                borderRadius: 8, color: '#991B1B', fontSize: 13 },
    sysNote:  { marginBottom: 14, padding: '9px 13px', background: '#FEF3C7', border: '1px solid #FCD34D',
                borderRadius: 8, color: '#92400E', fontSize: 13 },
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modal}>
        <div style={s.title}>{isEdit ? `Edit Role — ${role.name}` : 'Create New Role'}</div>

        {isEdit && role.is_system && (
          <div style={s.sysNote}>⚠️ This is a system role. Name and description are editable but consider changing permissions carefully.</div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Role Name *</label>
          <input
            style={s.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Store Manager"
            autoFocus
            readOnly={isEdit && role.is_system}
          />

          <label style={s.label}>Description</label>
          <input
            style={s.input}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Brief description of this role"
          />

          <div style={s.secTitle}>Permissions</div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thFirst}>Module</th>
                {ACTIONS.map(a => <th key={a} style={s.th}>{a}</th>)}
                <th style={s.th}>All</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod}>
                  <td style={s.tdFirst}>{mod}</td>
                  {ACTIONS.map(action => (
                    <td key={action} style={s.td}>
                      <input
                        type="checkbox"
                        style={s.cb}
                        checked={!!perms[mod]?.[action]}
                        onChange={() => togglePerm(mod, action)}
                      />
                    </td>
                  ))}
                  <td style={s.td}>
                    <input
                      type="checkbox"
                      style={s.cb}
                      checked={ACTIONS.every(a => !!perms[mod]?.[a])}
                      onChange={() => toggleAll(mod)}
                      title="Toggle all"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {error && <div style={s.errMsg}>⚠️ {error}</div>}

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              type="submit"
              style={{ ...s.saveBtn, ...(mutation.isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [modalRole, setModalRole] = useState(null)   // null = closed, false = new, role obj = edit
  const showModal = modalRole !== null

  const { data: rolesRaw, isLoading: loadingRoles, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: () => client.get('/roles'),
  })

  const { data: matrixRaw, isLoading: loadingMatrix } = useQuery({
    queryKey: ['permission-matrix'],
    queryFn: () => client.get('/roles/permission-matrix'),
  })

  const roles  = getData(rolesRaw)  || []
  const matrix = getData(matrixRaw) || {}

  const s = {
    page:       { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 40 },
    card:       { background: colors.white, borderRadius: 12, padding: '20px 24px', boxShadow: shadow.sm,
                  border: `1px solid ${colors.border}` },
    cardTop:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    roleName:   { fontSize: 16, fontWeight: 800, color: colors.dark },
    editBtn:    { padding: '4px 12px', background: 'transparent', border: `1.5px solid ${colors.border}`,
                  borderRadius: 6, fontSize: 12, fontWeight: 600, color: colors.midGrey, cursor: 'pointer' },
    roleDesc:   { fontSize: 13, color: colors.midGrey, marginBottom: 12, lineHeight: 1.5 },
    badgeRow:   { display: 'flex', gap: 8, alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 800, color: colors.dark, marginBottom: 16 },
    tableWrap:  { background: colors.white, borderRadius: 12, boxShadow: shadow.sm,
                  border: `1px solid ${colors.border}`, overflowX: 'auto' },
    table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th:         { padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: colors.midGrey,
                  background: colors.background, borderBottom: `1px solid ${colors.border}`,
                  whiteSpace: 'nowrap', textTransform: 'capitalize' },
    thFirst:    { padding: '12px 20px', textAlign: 'left', fontWeight: 700, color: colors.midGrey,
                  background: colors.background, borderBottom: `1px solid ${colors.border}` },
    td:         { padding: '11px 14px', textAlign: 'center', borderBottom: `1px solid ${colors.border}` },
    tdFirst:    { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: colors.dark,
                  borderBottom: `1px solid ${colors.border}` },
    dot:        (on) => ({ display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                           background: on ? colors.success : colors.border }),
    createBtn:  { padding: '9px 18px', background: colors.primary, color: colors.white, border: 'none',
                  borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    errorText:  { color: colors.error, fontSize: 13, padding: '16px 0' },
    loadText:   { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    empty:      { padding: '48px 0', textAlign: 'center', color: colors.lightGrey, fontSize: 14 },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage access control"
        onBack={false}
        actions={
          <button style={s.createBtn} onClick={() => setModalRole(false)}>
            + Create Role
          </button>
        }
      />

      {showModal && (
        <RoleModal
          role={modalRole || null}
          onClose={() => setModalRole(null)}
          onSaved={() => {
            setModalRole(null)
            window.alert(modalRole ? 'Role updated successfully.' : 'Role created successfully.')
          }}
        />
      )}

      {/* Role Cards */}
      {loadingRoles && <div style={s.loadText}>Loading roles…</div>}
      {rolesError   && <div style={s.errorText}>Failed to load roles.</div>}

      {!loadingRoles && !rolesError && roles.length === 0 && (
        <div style={s.empty}>No roles found. Create your first role above.</div>
      )}

      {roles.length > 0 && (
        <div style={s.grid}>
          {roles.map(role => (
            <div key={role.id ?? role.name} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.roleName}>{role.name}</div>
                <button style={s.editBtn} onClick={() => setModalRole(role)}>✏️ Edit</button>
              </div>
              {role.description && <div style={s.roleDesc}>{role.description}</div>}
              <div style={s.badgeRow}>
                <Badge status={role.is_system ? 'admin' : 'active'} label={role.is_system ? 'System' : 'Custom'} />
                {role.user_count != null && (
                  <span style={{ fontSize: 12, color: colors.midGrey }}>
                    {role.user_count} user{role.user_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permission Matrix */}
      <div style={s.sectionTitle}>Permission Matrix</div>
      {loadingMatrix && <div style={s.loadText}>Loading permission matrix…</div>}

      {!loadingMatrix && roles.length > 0 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.thFirst}>Role</th>
                {MODULES.map(mod => <th key={mod} style={s.th}>{mod}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => {
                const perms = role.permissions || {}
                return (
                  <tr key={role.id ?? role.name}>
                    <td style={s.tdFirst}>{role.name}</td>
                    {MODULES.map(mod => {
                      const modPerms = perms[mod]
                      const has = modPerms === true || modPerms === 1 ||
                        (typeof modPerms === 'object' && modPerms !== null && Object.values(modPerms).some(Boolean))
                      return (
                        <td key={mod} style={s.td}>
                          <span style={s.dot(has)} title={has ? 'Has access' : 'No access'} />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loadingMatrix && !loadingRoles && roles.length === 0 && (
        <div style={{ ...s.empty, paddingTop: 16 }}>Create roles to view the permission matrix.</div>
      )}
    </div>
  )
}
