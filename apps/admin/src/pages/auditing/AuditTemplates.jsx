import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow, fonts } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? []
}

const TAB_STYLE = (active) => ({
  padding: '8px 20px',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  color: active ? colors.primary : colors.midGrey,
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  background: 'none', border: 'none',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  fontFamily: fonts?.body,
})

function ScoreBadge({ score, passed }) {
  if (score === null || score === undefined) return <span style={{ color: colors.lightGrey }}>—</span>
  const n = Number(score)
  const bg   = passed ? colors.successBg : colors.errorBg
  const text = passed ? colors.success   : colors.error
  return (
    <span style={{ background: bg, color: text, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: fonts?.mono }}>
      {n.toFixed(0)}%
    </span>
  )
}

export default function AuditTemplates() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('templates')
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const handleTogglePublish = async (t) => {
    const newStatus = t.status === 'published' ? 'draft' : 'published'
    setTogglingId(t.id)
    try {
      await client.put(`/auditing/templates/${t.id}`, { ...t, status: newStatus })
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] })
    } catch { alert('Failed to update template.') }
    finally { setTogglingId(null) }
  }

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"? This cannot be undone.`)) return
    setDeletingId(t.id)
    try {
      await client.delete(`/auditing/templates/${t.id}`)
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] })
    } catch { alert('Failed to delete template.') }
    finally { setDeletingId(null) }
  }

  const { data: rawTemplates, isLoading, error } = useQuery({
    queryKey: ['audit-templates'],
    queryFn: () => client.get('/auditing/templates'),
  })

  const { data: rawAudits, isLoading: loadingAudits } = useQuery({
    queryKey: ['audits'],
    queryFn: () => client.get('/auditing/'),
    enabled: tab === 'results',
  })

  const { data: rawCAs, isLoading: loadingCAs } = useQuery({
    queryKey: ['corrective-actions'],
    queryFn: () => client.get('/auditing/corrective-actions'),
    enabled: tab === 'corrective-actions',
  })

  const templates         = Array.isArray(getData(rawTemplates)) ? getData(rawTemplates) : []
  const audits            = Array.isArray(getData(rawAudits))    ? getData(rawAudits)    : []
  const correctiveActions = Array.isArray(getData(rawCAs))       ? getData(rawCAs)       : []

  const s = {
    page:  { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    tabBar: { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24 },
    createBtn: {
      padding: '9px 18px', background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
    card: {
      background: colors.white, borderRadius: 12, padding: '20px 24px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark },
    meta: { fontSize: 12, color: colors.midGrey },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    editBtn: {
      padding: '6px 14px', background: colors.primaryBg, color: colors.primary,
      border: `1.5px solid ${colors.primary}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    viewBtn: {
      padding: '6px 14px', background: colors.primaryBg, color: colors.primary,
      border: `1.5px solid ${colors.primary}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    deleteBtn: {
      padding: '6px 12px', background: 'transparent', color: colors.error || '#EF4444',
      border: `1.5px solid ${colors.error || '#EF4444'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    publishBtn: {
      padding: '6px 12px', background: 'transparent', color: colors.success || '#10B981',
      border: `1.5px solid ${colors.success || '#10B981'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    unpublishBtn: {
      padding: '6px 12px', background: 'transparent', color: colors.warning || '#F59E0B',
      border: `1.5px solid ${colors.warning || '#F59E0B'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    table: { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td: { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    empty: { textAlign: 'center', padding: '72px 0', color: colors.lightGrey, fontSize: 14 },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    errorText: { color: colors.error, fontSize: 13, padding: '16px 0' },
    overdueBadge: {
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, background: colors.errorBg, color: colors.error,
    },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Auditing"
        onBack={false}
        actions={
          tab === 'templates' && (
            <button style={s.createBtn} onClick={() => navigate('/admin/audit-templates/new')}>
              + New Template
            </button>
          )
        }
      />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'templates')}          onClick={() => setTab('templates')}>Templates</button>
        <button style={TAB_STYLE(tab === 'results')}            onClick={() => setTab('results')}>Submitted Audits</button>
        <button style={TAB_STYLE(tab === 'corrective-actions')} onClick={() => setTab('corrective-actions')}>Corrective Actions</button>
      </div>

      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <>
          {isLoading && <div style={s.loadText}>Loading templates…</div>}
          {error && <div style={s.errorText}>Failed to load audit templates.</div>}
          {!isLoading && !error && templates.length === 0 && (
            <div style={s.empty}>No audit templates yet.<br />Click <strong>+ New Template</strong> to create one.</div>
          )}
          {templates.length > 0 && (
            <div style={s.grid}>
              {templates.map((t) => (
                <div key={t.id ?? t._id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.name}>{t.name}</div>
                    <Badge status={t.status} label={t.status} />
                  </div>
                  {t.description && <div style={s.meta}>{t.description}</div>}
                  <div style={s.meta}>
                    {(t.categories?.length ?? t.category_count ?? 0)} categor
                    {(t.categories?.length ?? t.category_count ?? 0) === 1 ? 'y' : 'ies'}
                  </div>
                  <div style={s.footer}>
                    <span style={s.meta}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={s.deleteBtn} disabled={deletingId === t.id || togglingId === t.id} onClick={() => handleDelete(t)}>
                        {deletingId === t.id ? '…' : 'Delete'}
                      </button>
                      <button
                        style={t.status === 'published' ? s.unpublishBtn : s.publishBtn}
                        disabled={togglingId === t.id || deletingId === t.id}
                        onClick={() => handleTogglePublish(t)}
                      >
                        {togglingId === t.id ? '…' : t.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button style={s.editBtn} onClick={() => navigate(`/admin/audit-templates/${t.id ?? t._id}`)}>Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Submitted Audits Tab ── */}
      {tab === 'results' && (
        <>
          {loadingAudits && <div style={s.loadText}>Loading submitted audits…</div>}
          {!loadingAudits && audits.length === 0 && (
            <div style={s.empty}>No audits submitted yet.<br />Compliance officers submit audits via the mobile app.</div>
          )}
          {audits.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Template</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Auditor</th>
                    <th style={s.th}>Score</th>
                    <th style={s.th}>Result</th>
                    <th style={s.th}>GPS</th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a) => (
                    <tr key={a.id}>
                      <td style={s.td}>{a.template_name || '—'}</td>
                      <td style={s.td}>{a.store_name || '—'}</td>
                      <td style={s.td}>{a.auditor_name || '—'}</td>
                      <td style={s.td}><ScoreBadge score={a.score} passed={a.passed} /></td>
                      <td style={s.td}>
                        <Badge
                          status={a.passed ? 'active' : a.status === 'in_progress' ? 'open' : 'error'}
                          label={a.status === 'submitted' ? (a.passed ? 'PASS' : 'FAIL') : a.status?.replace('_', ' ') || '—'}
                        />
                      </td>
                      <td style={s.td}>
                        <Badge status={a.gps_verified ? 'active' : 'inactive'} label={a.gps_verified ? 'Verified' : 'No GPS'} />
                      </td>
                      <td style={{ ...s.td, fontFamily: fonts?.mono, fontSize: 12, color: colors.midGrey }}>
                        {a.started_at ? new Date(a.started_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={s.td}>
                        <button style={s.viewBtn} onClick={() => navigate(`/admin/audits/${a.id}`)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Corrective Actions Tab ── */}
      {tab === 'corrective-actions' && (
        <>
          {loadingCAs && <div style={s.loadText}>Loading corrective actions…</div>}
          {!loadingCAs && correctiveActions.length === 0 && (
            <div style={s.empty}>No corrective actions.<br />They are auto-created when critical questions fail during an audit.</div>
          )}
          {correctiveActions.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Description</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Assigned To</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {correctiveActions.map((ca) => {
                    const isOverdue = ca.due_at && new Date(ca.due_at) < new Date() && ca.status !== 'resolved'
                    return (
                      <tr key={ca.id}>
                        <td style={{ ...s.td, maxWidth: 320 }}>{ca.description || '—'}</td>
                        <td style={s.td}>{ca.store_name || '—'}</td>
                        <td style={s.td}>{ca.assigned_to_name || <span style={{ color: colors.lightGrey }}>Unassigned</span>}</td>
                        <td style={s.td}>
                          <Badge
                            status={ca.status === 'resolved' ? 'active' : ca.status === 'in_progress' ? 'open' : 'inactive'}
                            label={ca.status || 'open'}
                          />
                        </td>
                        <td style={s.td}>
                          {ca.due_at ? (
                            <span>
                              {new Date(ca.due_at).toLocaleDateString()}
                              {isOverdue && <span style={{ ...s.overdueBadge, marginLeft: 6 }}>Overdue</span>}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
