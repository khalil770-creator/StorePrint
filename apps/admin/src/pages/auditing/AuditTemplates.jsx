import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? []
}

export default function AuditTemplates() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"? This cannot be undone.`)) return
    setDeletingId(t.id)
    try {
      await client.delete(`/auditing/templates/${t.id}`)
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] })
    } catch {
      alert('Failed to delete template.')
    } finally {
      setDeletingId(null)
    }
  }

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['audit-templates'],
    queryFn: () => client.get('/auditing/templates'),
  })

  const templates = Array.isArray(getData(raw)) ? getData(raw) : []

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    createBtn: {
      padding: '9px 18px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 16,
    },
    card: {
      background: colors.white,
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: shadow.sm,
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark },
    meta: { fontSize: 12, color: colors.midGrey },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    editBtn: {
      padding: '6px 14px',
      background: colors.primaryBg,
      color: colors.primary,
      border: `1.5px solid ${colors.primary}`,
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
    },
    deleteBtn: {
      padding: '6px 12px',
      background: 'transparent',
      color: colors.error || '#EF4444',
      border: `1.5px solid ${colors.error || '#EF4444'}`,
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
    },
    empty: {
      textAlign: 'center',
      padding: '72px 0',
      color: colors.lightGrey,
      fontSize: 14,
    },
    errorText: { color: colors.error, fontSize: 13, padding: '16px 0' },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Audit Templates"
        onBack={false}
        actions={
          <button
            style={s.createBtn}
            onClick={() => navigate('/admin/audit-templates/new')}
          >
            + New Template
          </button>
        }
      />

      {isLoading && <div style={s.loadText}>Loading templates…</div>}
      {error && <div style={s.errorText}>Failed to load audit templates.</div>}

      {!isLoading && !error && templates.length === 0 && (
        <div style={s.empty}>
          No audit templates yet.<br />
          Click <strong>+ New Template</strong> to create one.
        </div>
      )}

      {templates.length > 0 && (
        <div style={s.grid}>
          {templates.map((t) => (
            <div key={t.id ?? t._id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.name}>{t.name}</div>
                <Badge status={t.status} label={t.status} />
              </div>
              {t.description && (
                <div style={s.meta}>{t.description}</div>
              )}
              <div style={s.meta}>
                {(t.categories?.length ?? t.category_count ?? 0)} categor
                {(t.categories?.length ?? t.category_count ?? 0) === 1 ? 'y' : 'ies'}
              </div>
              <div style={s.footer}>
                <span style={s.meta}>
                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={s.deleteBtn}
                    disabled={deletingId === t.id}
                    onClick={() => handleDelete(t)}
                  >
                    {deletingId === t.id ? '…' : 'Delete'}
                  </button>
                  <button
                    style={s.editBtn}
                    onClick={() => navigate(`/admin/audit-templates/${t.id ?? t._id}`)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
