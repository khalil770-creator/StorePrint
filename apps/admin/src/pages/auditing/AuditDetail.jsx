import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow, fonts } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

function getData(res) { return res?.data?.data ?? res?.data ?? null }

function ScoreBadge({ score, passed }) {
  if (score === null || score === undefined) return <span style={{ color: colors.lightGrey }}>—</span>
  const n = Number(score)
  const bg   = passed ? colors.successBg : colors.errorBg
  const text = passed ? colors.success   : colors.error
  return (
    <span style={{ background: bg, color: text, borderRadius: 999, padding: '4px 14px', fontSize: 14, fontWeight: 800, fontFamily: fonts?.mono }}>
      {n.toFixed(0)}%
    </span>
  )
}

function AnswerBadge({ type, value }) {
  if (!value && value !== 0) return <span style={{ color: colors.lightGrey }}>—</span>
  if (type === 'yes_no') {
    const yes = value === 'yes' || value === true || value === 'true'
    return <Badge status={yes ? 'active' : 'error'} label={yes ? 'Yes' : 'No'} />
  }
  if (type === 'score') {
    const n = Number(value)
    const color = n >= 4 ? colors.success : n >= 3 ? colors.warning : colors.error
    return <span style={{ fontWeight: 700, color, fontFamily: fonts?.mono }}>{n}/5</span>
  }
  if (type === 'photo') {
    return value
      ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontSize: 12 }}>View Photo</a>
      : <span style={{ color: colors.lightGrey }}>No photo</span>
  }
  return <span style={{ color: colors.dark }}>{value}</span>
}

export default function AuditDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => client.get(`/auditing/${id}`),
    enabled: !!id,
  })

  const audit = getData(raw)

  const s = {
    page:    { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    summary: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 16, marginBottom: 24,
    },
    statCard: {
      background: colors.white, borderRadius: 12, padding: '18px 20px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`,
    },
    statLabel: { fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: 800, color: colors.dark },
    card: {
      background: colors.white, borderRadius: 12, padding: '24px 28px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`, marginBottom: 20,
    },
    sectionTitle: { fontSize: 14, fontWeight: 800, color: colors.dark, marginBottom: 16 },
    catHeader: {
      fontSize: 13, fontWeight: 700, color: colors.primary,
      padding: '8px 0', borderBottom: `1px solid ${colors.border}`, marginBottom: 8,
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}` },
    td: { padding: '12px 12px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 8 },
    metaItem: { fontSize: 12 },
    metaLabel: { color: colors.lightGrey, fontWeight: 700, marginBottom: 2 },
    metaValue: { color: colors.dark, fontWeight: 600 },
    empty: { textAlign: 'center', padding: '48px 0', color: colors.lightGrey, fontSize: 14 },
  }

  if (isLoading) return <div style={{ ...s.page, color: colors.midGrey }}>Loading audit…</div>
  if (error || !audit) return <div style={{ ...s.page, color: colors.error }}>Audit not found.</div>

  const categories = audit.categories || []
  const allResponses = audit.responses || []

  return (
    <div style={s.page}>
      <PageHeader title="Audit Detail" />

      {/* Summary Cards */}
      <div style={s.summary}>
        <div style={s.statCard}>
          <div style={s.statLabel}>Score</div>
          <ScoreBadge score={audit.score} passed={audit.passed} />
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Result</div>
          <Badge
            status={audit.passed ? 'active' : 'error'}
            label={audit.status === 'submitted' ? (audit.passed ? 'PASS' : 'FAIL') : audit.status || '—'}
          />
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Store</div>
          <div style={{ ...s.statValue, fontSize: 14 }}>{audit.store_name || '—'}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Auditor</div>
          <div style={{ ...s.statValue, fontSize: 14 }}>{audit.auditor_name || '—'}</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>GPS</div>
          <Badge status={audit.gps_verified ? 'active' : 'inactive'} label={audit.gps_verified ? 'Verified' : 'Not Verified'} />
        </div>
        <div style={s.statCard}>
          <div style={s.statLabel}>Date</div>
          <div style={{ ...s.statValue, fontSize: 13 }}>
            {audit.started_at ? new Date(audit.started_at).toLocaleString() : '—'}
          </div>
        </div>
      </div>

      {/* Responses by Category */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Responses</div>

        {categories.length === 0 && allResponses.length === 0 && (
          <div style={s.empty}>No responses recorded for this audit.</div>
        )}

        {categories.length > 0 ? (
          categories.map((cat) => {
            const catResponses = allResponses.filter((r) => r.category_id === cat.id)
            return (
              <div key={cat.id} style={{ marginBottom: 24 }}>
                <div style={s.catHeader}>{cat.name}</div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Question</th>
                      <th style={s.th}>Type</th>
                      <th style={s.th}>Answer</th>
                      <th style={s.th}>Critical</th>
                      <th style={s.th}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.questions?.map((q) => {
                      const resp = catResponses.find((r) => r.question_id === q.id)
                      return (
                        <tr key={q.id}>
                          <td style={s.td}>{q.text}</td>
                          <td style={{ ...s.td, color: colors.midGrey }}>{q.type}</td>
                          <td style={s.td}><AnswerBadge type={q.type} value={resp?.answer} /></td>
                          <td style={s.td}>{q.is_critical ? <Badge status="error" label="Critical" /> : '—'}</td>
                          <td style={{ ...s.td, color: colors.midGrey, maxWidth: 200 }}>{resp?.notes || '—'}</td>
                        </tr>
                      )
                    })}
                    {(!cat.questions || cat.questions.length === 0) && (
                      <tr><td colSpan={5} style={{ ...s.td, color: colors.lightGrey, textAlign: 'center' }}>No questions in this category</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          })
        ) : (
          allResponses.length > 0 && (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Question</th>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>Answer</th>
                  <th style={s.th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {allResponses.map((r) => (
                  <tr key={r.id}>
                    <td style={s.td}>{r.question_text || '—'}</td>
                    <td style={{ ...s.td, color: colors.midGrey }}>{r.question_type || '—'}</td>
                    <td style={s.td}><AnswerBadge type={r.question_type} value={r.answer} /></td>
                    <td style={{ ...s.td, color: colors.midGrey }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}
