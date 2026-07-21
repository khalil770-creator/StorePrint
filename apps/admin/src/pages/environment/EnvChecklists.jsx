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
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  fontFamily: fonts.body,
})

function ScoreBadge({ score }) {
  const bg = score >= 80 ? colors.successBg : score >= 50 ? colors.warningBg : colors.errorBg
  const text = score >= 80 ? colors.success : score >= 50 ? colors.warning : colors.error
  return (
    <span style={{ background: bg, color: text, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: fonts.mono }}>
      {score}%
    </span>
  )
}

export default function EnvChecklists() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('templates')
  const [actionId, setActionId] = useState(null)

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete checklist "${c.title || c.name}"? This cannot be undone.`)) return
    setActionId(c.id)
    try {
      await client.delete(`/environment/checklists/${c.id}`)
      queryClient.invalidateQueries({ queryKey: ['env-checklists'] })
    } catch { alert('Failed to delete checklist.') }
    finally { setActionId(null) }
  }

  const handleTogglePublish = async (c) => {
    setActionId(c.id)
    try {
      await client.put(`/environment/checklists/${c.id}`, { ...c, is_active: !c.is_active })
      queryClient.invalidateQueries({ queryKey: ['env-checklists'] })
    } catch { alert('Failed to update checklist.') }
    finally { setActionId(null) }
  }

  const { data: rawTemplates, isLoading: loadingTemplates, error: errTemplates } = useQuery({
    queryKey: ['env-checklists'],
    queryFn: () => client.get('/environment/checklists'),
  })

  const { data: rawSubs, isLoading: loadingSubs, error: errSubs } = useQuery({
    queryKey: ['env-submissions'],
    queryFn: () => client.get('/environment/submissions'),
    enabled: tab === 'submissions',
  })

  const { data: rawIssues, isLoading: loadingIssues, error: errIssues } = useQuery({
    queryKey: ['env-issues'],
    queryFn: () => client.get('/environment/issues'),
    enabled: tab === 'issues',
  })

  const checklists  = Array.isArray(getData(rawTemplates)) ? getData(rawTemplates) : []
  const submissions = Array.isArray(getData(rawSubs))      ? getData(rawSubs)      : []
  const issues      = Array.isArray(getData(rawIssues))    ? getData(rawIssues)    : []

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    createBtn: {
      padding: '9px 18px', background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    tabBar: {
      display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24, gap: 0,
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
    publishBtn: {
      padding: '6px 12px', background: 'transparent', color: colors.success || '#10B981',
      border: `1.5px solid ${colors.success || '#10B981'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    unpublishBtn: {
      padding: '6px 12px', background: 'transparent', color: colors.warning || '#F59E0B',
      border: `1.5px solid ${colors.warning || '#F59E0B'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    deleteBtn: {
      padding: '6px 12px', background: 'transparent', color: colors.error || '#EF4444',
      border: `1.5px solid ${colors.error || '#EF4444'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
    table: { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td: { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    empty: { textAlign: 'center', padding: '72px 0', color: colors.lightGrey, fontSize: 14 },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    errorText: { color: colors.error, fontSize: 13, padding: '16px 0' },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Environment Checklists"
        onBack={false}
        actions={
          tab === 'templates' && (
            <button style={s.createBtn} onClick={() => navigate('/admin/env-checklists/new')}>
              + New Checklist
            </button>
          )
        }
      />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'templates')}   onClick={() => setTab('templates')}>Templates</button>
        <button style={TAB_STYLE(tab === 'submissions')} onClick={() => setTab('submissions')}>Submissions</button>
        <button style={TAB_STYLE(tab === 'issues')}      onClick={() => setTab('issues')}>Issues</button>
      </div>

      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <>
          {loadingTemplates && <div style={s.loadText}>Loading checklists…</div>}
          {errTemplates && <div style={s.errorText}>Failed to load checklists.</div>}
          {!loadingTemplates && !errTemplates && checklists.length === 0 && (
            <div style={s.empty}>No checklists yet.<br />Click <strong>+ New Checklist</strong> to create one.</div>
          )}
          {checklists.length > 0 && (
            <div style={s.grid}>
              {checklists.map((c) => (
                <div key={c.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.name}>{c.title || c.name}</div>
                    <Badge status={c.is_active ? 'active' : 'inactive'} label={c.is_active ? 'Published' : 'Draft'} />
                  </div>
                  {c.description && <div style={s.meta}>{c.description}</div>}
                  <div style={s.meta}>{c.item_count ?? 0} items</div>
                  <div style={s.footer}>
                    <span style={s.meta}>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={s.deleteBtn}
                        disabled={actionId === c.id}
                        onClick={() => handleDelete(c)}
                      >{actionId === c.id ? '…' : 'Delete'}</button>
                      <button
                        style={c.is_active ? s.unpublishBtn : s.publishBtn}
                        disabled={actionId === c.id}
                        onClick={() => handleTogglePublish(c)}
                      >{c.is_active ? 'Unpublish' : 'Publish'}</button>
                      <button style={s.editBtn} onClick={() => navigate(`/admin/env-checklists/${c.id}`)}>Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Submissions Tab ── */}
      {tab === 'submissions' && (
        <>
          {loadingSubs && <div style={s.loadText}>Loading submissions…</div>}
          {errSubs && <div style={s.errorText}>Failed to load submissions.</div>}
          {!loadingSubs && !errSubs && submissions.length === 0 && (
            <div style={s.empty}>No submissions yet.<br />Field staff submit checklists via the mobile app.</div>
          )}
          {submissions.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Checklist</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Submitted By</th>
                    <th style={s.th}>Score</th>
                    <th style={s.th}>Result</th>
                    <th style={s.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={s.td}>{sub.checklist_title}</td>
                      <td style={s.td}>{sub.store_name}</td>
                      <td style={s.td}>{sub.submitted_by_name || '—'}</td>
                      <td style={s.td}><ScoreBadge score={sub.score ?? 0} /></td>
                      <td style={s.td}>
                        <Badge
                          status={sub.overall_status === 'pass' ? 'active' : sub.overall_status === 'partial' ? 'warning' : 'error'}
                          label={sub.overall_status?.toUpperCase() ?? '—'}
                        />
                      </td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12, color: colors.midGrey }}>
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* ── Issues Tab ── */}
      {tab === 'issues' && (
        <>
          {loadingIssues && <div style={s.loadText}>Loading issues…</div>}
          {errIssues && <div style={s.errorText}>Failed to load issues.</div>}
          {!loadingIssues && !errIssues && issues.length === 0 && (
            <div style={s.empty}>No open issues.<br />Issues are auto-created when field staff flag problems during a submission.</div>
          )}
          {issues.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Item</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Severity</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id}>
                      <td style={{ ...s.td, maxWidth: 280 }}>{issue.item_text || '—'}</td>
                      <td style={s.td}>{issue.store_name || '—'}</td>
                      <td style={s.td}>
                        <Badge
                          status={issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'open' : 'inactive'}
                          label={issue.severity || 'medium'}
                        />
                      </td>
                      <td style={s.td}>
                        <Badge
                          status={issue.status === 'resolved' ? 'active' : issue.status === 'in_progress' ? 'open' : 'inactive'}
                          label={issue.status || 'open'}
                        />
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: colors.midGrey, fontFamily: fonts.mono }}>
                        {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
