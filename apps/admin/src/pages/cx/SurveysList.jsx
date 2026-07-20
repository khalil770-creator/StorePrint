import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow, fonts } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? []
}

const TYPE_LABELS = { nps: 'NPS', csat: 'CSAT', custom: 'Custom' }

const TAB_STYLE = (active) => ({
  padding: '8px 20px',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  color: active ? colors.primary : colors.midGrey,
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  background: 'none', border: 'none',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  fontFamily: fonts.body,
})

function ScoreBadge({ score, label }) {
  if (score === null || score === undefined) return <span style={{ color: colors.lightGrey, fontSize: 12 }}>—</span>
  const n = Number(score)
  const bg   = n >= 8 ? colors.successBg : n >= 5 ? colors.warningBg : colors.errorBg
  const text = n >= 8 ? colors.success   : n >= 5 ? colors.warning   : colors.error
  return (
    <span style={{ background: bg, color: text, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: fonts.mono }}>
      {label ?? n}
    </span>
  )
}

export default function SurveysList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('surveys')

  const { data: rawSurveys, isLoading: loadingSurveys, error: errSurveys } = useQuery({
    queryKey: ['cx-surveys'],
    queryFn: () => client.get('/cx/surveys'),
  })

  const { data: rawResponses, isLoading: loadingResponses, error: errResponses } = useQuery({
    queryKey: ['cx-responses'],
    queryFn: () => client.get('/cx/responses'),
    enabled: tab === 'responses',
  })

  const surveys   = Array.isArray(getData(rawSurveys))   ? getData(rawSurveys)   : []
  const responses = Array.isArray(getData(rawResponses)) ? getData(rawResponses) : []

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    createBtn: {
      padding: '9px 18px', background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    tabBar: { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
    card: {
      background: colors.white, borderRadius: 12, padding: '20px 24px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark, flex: 1 },
    metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
    typeChip: {
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, background: colors.primaryBg, color: colors.primary,
    },
    meta: { fontSize: 12, color: colors.midGrey },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    editBtn: {
      padding: '6px 14px', background: colors.primaryBg, color: colors.primary,
      border: `1.5px solid ${colors.primary}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
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
        title="CX Surveys"
        onBack={false}
        actions={
          tab === 'surveys' && (
            <button style={s.createBtn} onClick={() => navigate('/admin/surveys/new')}>
              + New Survey
            </button>
          )
        }
      />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'surveys')}   onClick={() => setTab('surveys')}>Surveys</button>
        <button style={TAB_STYLE(tab === 'responses')} onClick={() => setTab('responses')}>Responses</button>
      </div>

      {/* ── Surveys Tab ── */}
      {tab === 'surveys' && (
        <>
          {loadingSurveys && <div style={s.loadText}>Loading surveys…</div>}
          {errSurveys && <div style={s.errorText}>Failed to load surveys.</div>}
          {!loadingSurveys && !errSurveys && surveys.length === 0 && (
            <div style={s.empty}>No surveys yet.<br />Click <strong>+ New Survey</strong> to create one.</div>
          )}
          {surveys.length > 0 && (
            <div style={s.grid}>
              {surveys.map((sv) => (
                <div key={sv.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.name}>{sv.title || sv.name}</div>
                    <Badge status={sv.is_active ? 'active' : 'inactive'} label={sv.is_active ? 'Published' : 'Draft'} />
                  </div>
                  <div style={s.metaRow}>
                    {sv.type && <span style={s.typeChip}>{TYPE_LABELS[sv.type] || sv.type}</span>}
                    <span style={s.meta}>
                      {(sv.questions?.length ?? 0)} question{(sv.questions?.length ?? 0) === 1 ? '' : 's'}
                    </span>
                    {sv.response_count > 0 && (
                      <span style={{ ...s.meta, color: colors.primary, fontWeight: 700 }}>
                        {sv.response_count} response{sv.response_count === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  {sv.description && <div style={s.meta}>{sv.description}</div>}
                  <div style={s.footer}>
                    <span style={s.meta}>{sv.created_at ? new Date(sv.created_at).toLocaleDateString() : ''}</span>
                    <button style={s.editBtn} onClick={() => navigate(`/admin/surveys/${sv.id}`)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Responses Tab ── */}
      {tab === 'responses' && (
        <>
          {loadingResponses && <div style={s.loadText}>Loading responses…</div>}
          {errResponses && <div style={s.errorText}>Failed to load responses.</div>}
          {!loadingResponses && !errResponses && responses.length === 0 && (
            <div style={s.empty}>
              No responses yet.<br />
              Responses appear here after customers complete a survey on the mobile app.
            </div>
          )}
          {responses.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Survey</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>NPS</th>
                    <th style={s.th}>CSAT</th>
                    <th style={s.th}>Channel</th>
                    <th style={s.th}>Verbatim</th>
                    <th style={s.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => (
                    <tr key={r.id}>
                      <td style={s.td}>{r.survey_title || '—'}</td>
                      <td style={s.td}>{r.store_name || '—'}</td>
                      <td style={s.td}><ScoreBadge score={r.nps_score} /></td>
                      <td style={s.td}><ScoreBadge score={r.csat_score} /></td>
                      <td style={s.td}>
                        <Badge status={r.channel === 'in-store' ? 'active' : 'open'} label={r.channel || 'in-store'} />
                      </td>
                      <td style={{ ...s.td, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.midGrey }}>
                        {r.verbatim || <span style={{ color: colors.border }}>—</span>}
                      </td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12, color: colors.midGrey }}>
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
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
