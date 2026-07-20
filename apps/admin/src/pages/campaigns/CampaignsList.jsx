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

const TAB_STYLE = (active) => ({
  padding: '8px 20px',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  color: active ? colors.primary : colors.midGrey,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  fontFamily: fonts.body,
})

const TYPE_COLORS = {
  seasonal:        { bg: '#e8f4fd', text: '#1a73e8' },
  'product-launch': { bg: '#f3e8fd', text: '#7b1fa2' },
  promotion:       { bg: '#fff8e1', text: '#f57f17' },
  brand:           { bg: '#e8f5e9', text: '#2e7d32' },
}

function TypeChip({ type }) {
  const c = TYPE_COLORS[type] || { bg: colors.surfaceLow, text: colors.midGrey }
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, fontFamily: fonts.body }}>
      {type}
    </span>
  )
}

function CompliancePct({ pct }) {
  const bg = pct >= 80 ? colors.successBg : pct >= 50 ? colors.warningBg : colors.errorBg
  const text = pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error
  return (
    <span style={{ background: bg, color: text, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: fonts.mono }}>
      {pct}%
    </span>
  )
}

export default function CampaignsList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('campaigns')

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => client.get('/campaigns'),
  })

  const campaigns = Array.isArray(getData(raw)) ? getData(raw) : []

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    createBtn: {
      padding: '9px 18px', background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    tabBar: { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24, gap: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
    card: {
      background: colors.white, borderRadius: 12, padding: '20px 24px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark },
    meta: { fontSize: 12, color: colors.midGrey },
    chips: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
    dateRange: { fontSize: 12, color: colors.midGrey, fontFamily: fonts.mono },
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
    statsRow: { display: 'flex', gap: 16, fontSize: 12, color: colors.midGrey },
    statItem: { display: 'flex', alignItems: 'center', gap: 4 },
  }

  const statusMap = {
    draft:     'inactive',
    active:    'active',
    completed: 'success',
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Campaigns"
        onBack={false}
        actions={
          tab === 'campaigns' && (
            <button style={s.createBtn} onClick={() => navigate('/admin/campaigns/new')}>
              + New Campaign
            </button>
          )
        }
      />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'campaigns')} onClick={() => setTab('campaigns')}>Campaigns</button>
        <button style={TAB_STYLE(tab === 'compliance')} onClick={() => setTab('compliance')}>Compliance</button>
      </div>

      {/* ── Campaigns Tab ── */}
      {tab === 'campaigns' && (
        <>
          {isLoading && <div style={s.loadText}>Loading campaigns…</div>}
          {error && <div style={s.errorText}>Failed to load campaigns.</div>}
          {!isLoading && !error && campaigns.length === 0 && (
            <div style={s.empty}>No campaigns yet.<br />Click <strong>+ New Campaign</strong> to get started.</div>
          )}
          {campaigns.length > 0 && (
            <div style={s.grid}>
              {campaigns.map((c) => (
                <div key={c.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.name}>{c.title}</div>
                    <Badge status={statusMap[c.status] || 'inactive'} label={c.status} />
                  </div>
                  <div style={s.chips}>
                    <TypeChip type={c.type} />
                  </div>
                  {c.description && <div style={s.meta}>{c.description}</div>}
                  {(c.start_date || c.end_date) && (
                    <div style={s.dateRange}>
                      {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
                      {' → '}
                      {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}
                    </div>
                  )}
                  <div style={s.statsRow}>
                    <span style={s.statItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>store</span>
                      {c.store_count ?? 0} stores
                    </span>
                    <span style={s.statItem}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                      {c.confirmed_count ?? 0} confirmed
                    </span>
                  </div>
                  <div style={s.footer}>
                    <span style={s.meta}></span>
                    <button style={s.editBtn} onClick={() => navigate(`/admin/campaigns/${c.id}`)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Compliance Tab ── */}
      {tab === 'compliance' && (
        <>
          {isLoading && <div style={s.loadText}>Loading compliance data…</div>}
          {error && <div style={s.errorText}>Failed to load data.</div>}
          {!isLoading && !error && campaigns.length === 0 && (
            <div style={s.empty}>No campaigns to show compliance for.</div>
          )}
          {campaigns.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Campaign</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Total Stores</th>
                    <th style={s.th}>Confirmed</th>
                    <th style={s.th}>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const total = c.store_count ?? 0
                    const confirmed = c.confirmed_count ?? 0
                    const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0
                    return (
                      <tr key={c.id}>
                        <td style={{ ...s.td, fontWeight: 600 }}>{c.title}</td>
                        <td style={s.td}><TypeChip type={c.type} /></td>
                        <td style={s.td}>
                          <Badge status={statusMap[c.status] || 'inactive'} label={c.status} />
                        </td>
                        <td style={{ ...s.td, fontFamily: fonts.mono }}>{total}</td>
                        <td style={{ ...s.td, fontFamily: fonts.mono }}>{confirmed}</td>
                        <td style={s.td}><CompliancePct pct={pct} /></td>
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
