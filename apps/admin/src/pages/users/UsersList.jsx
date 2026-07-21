import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

// ─── data fetcher ────────────────────────────────────────────────────────────
const fetchUsers = async () => {
  const { data } = await client.get('/users')
  // accept { data: [...] } or plain array
  return Array.isArray(data) ? data : (data.data ?? [])
}

// ─── styles ──────────────────────────────────────────────────────────────────
const s = {
  page: {
    padding: '32px 40px',
    background: colors.background,
    minHeight: '100vh',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  addBtn: {
    padding: '9px 18px',
    background: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  searchWrap: {
    marginBottom: 20,
  },
  searchInput: {
    width: '100%',
    maxWidth: 360,
    padding: '9px 14px',
    border: `1.5px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: colors.dark,
    outline: 'none',
    background: colors.white,
    boxSizing: 'border-box',
  },
  card: {
    background: colors.white,
    borderRadius: 12,
    boxShadow: shadow.md,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  thead: {
    background: '#F9FAFB',
    borderBottom: `1.5px solid ${colors.border}`,
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 700,
    fontSize: 11,
    color: colors.midGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.border}`,
    verticalAlign: 'middle',
    color: colors.dark,
  },
  nameCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nameText: {
    fontWeight: 600,
    color: colors.dark,
    fontSize: 14,
  },
  emailText: {
    fontSize: 12,
    color: colors.midGrey,
  },
  editBtn: {
    padding: '6px 14px',
    background: 'none',
    border: `1.5px solid ${colors.border}`,
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    color: colors.darkGrey,
    cursor: 'pointer',
  },
  center: {
    padding: '60px 0',
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
  empty: {
    padding: '60px 0',
    textAlign: 'center',
    color: colors.lightGrey,
    fontSize: 14,
  },
}

// ─── component ───────────────────────────────────────────────────────────────
export default function UsersList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30_000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    )
  }, [users, search])

  const pageActions = (
    <button style={s.addBtn} onClick={() => navigate('/admin/users/new')}>
      + Add User
    </button>
  )

  return (
    <div style={s.page}>
      <PageHeader
        title="Users"
        subtitle={`${users.length} member${users.length !== 1 ? 's' : ''}`}
        onBack={false}
        actions={pageActions}
      />

      {/* Search */}
      <div style={s.searchWrap}>
        <input
          style={s.searchInput}
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search users"
        />
      </div>

      {/* Table card */}
      <div style={s.card}>
        {isLoading && (
          <div style={s.center}>Loading…</div>
        )}

        {isError && !isLoading && (
          <div style={s.center}>
            <div>Failed to load users. Retry?</div>
            <button style={s.retryBtn} onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <table style={s.table}>
            <thead style={s.thead}>
              <tr>
                <th style={s.th}>Name / Email</th>
                <th style={s.th}>Role</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Store</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={s.empty}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={() => navigate(`/admin/users/${user.id}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── row sub-component ────────────────────────────────────────────────────────
function UserRow({ user, onEdit }) {
  const [hovered, setHovered] = useState(false)

  const rowStyle = {
    background: hovered ? '#F9FAFB' : colors.white,
    transition: 'background 0.15s',
    cursor: 'default',
  }

  return (
    <tr
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Name + Email */}
      <td style={s.td}>
        <div style={s.nameCell}>
          <span style={s.nameText}>{user.name || '—'}</span>
          <span style={s.emailText}>{user.email || '—'}</span>
        </div>
      </td>

      {/* Role */}
      <td style={s.td}>
        <Badge status={user.role_name?.toLowerCase()} label={user.role_name || '—'} />
      </td>

      {/* Status */}
      <td style={s.td}>
        <Badge status={user.status?.toLowerCase()} label={user.status || '—'} />
      </td>

      {/* Store */}
      <td style={s.td}>
        <span style={{ color: colors.darkGrey }}>
          {user.store_names?.length ? user.store_names.join(', ') : (user.store_name || '—')}
        </span>
      </td>

      {/* Actions */}
      <td style={s.td}>
        <button style={s.editBtn} onClick={onEdit}>
          Edit
        </button>
      </td>
    </tr>
  )
}
