import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow, fonts } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

function getData(res) { return res?.data?.data ?? res?.data ?? null }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const TAB_STYLE = (active) => ({
  padding: '10px 22px',
  borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
  color: active ? colors.primary : colors.midGrey,
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  background: 'none', border: 'none', fontFamily: fonts.body,
})

const TYPE_COLORS = {
  seasonal:         { bg: '#e8f4fd', text: '#1a73e8' },
  'product-launch': { bg: '#f3e8fd', text: '#7b1fa2' },
  promotion:        { bg: '#fff8e1', text: '#f57f17' },
  brand:            { bg: '#e8f5e9', text: '#2e7d32' },
}

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [lightboxImg, setLightboxImg] = useState(null)

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => client.get(`/campaigns/${id}`),
    enabled: !!id,
  })
  const campaign = getData(raw) || {}
  const confirmations = campaign.confirmations || []
  const assignments   = campaign.store_assignments || []
  const assets        = campaign.assets || []

  const totalStores    = assignments.length || campaign.store_count || 0
  const confirmedCount = confirmations.length
  const pct            = totalStores > 0 ? Math.round((confirmedCount / totalStores) * 100) : 0
  const typeStyle      = TYPE_COLORS[campaign.type] || { bg: colors.surfaceLow, text: colors.midGrey }
  const statusMap      = { draft: 'inactive', active: 'active', completed: 'success' }

  const s = {
    page:      { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    editBtn:   { padding: '9px 18px', background: colors.primaryBg, color: colors.primary, border: `1.5px solid ${colors.primary}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    hero:      { background: colors.white, borderRadius: 12, padding: '24px 28px', boxShadow: shadow.sm, border: `1px solid ${colors.border}`, marginBottom: 24, borderLeft: `4px solid ${campaign.color || colors.primary}` },
    heroTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    heroTitle: { fontSize: 22, fontWeight: 800, color: colors.dark },
    heroDesc:  { fontSize: 13, color: colors.midGrey, marginBottom: 16, lineHeight: 1.6 },
    statsRow:  { display: 'flex', gap: 16, flexWrap: 'wrap' },
    statCard:  { background: colors.surfaceLow, borderRadius: 10, padding: '14px 20px', minWidth: 120, textAlign: 'center' },
    statVal:   { fontSize: 24, fontWeight: 800, color: colors.primary },
    statLabel: { fontSize: 11, color: colors.midGrey, fontWeight: 600, marginTop: 2 },
    tabBar:    { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24 },
    table:     { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th:        { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td:        { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}`, verticalAlign: 'middle' },
    chip:      (bg, text) => ({ background: bg, color: text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'inline-block' }),
    gpsLink:   { color: colors.primary, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 },
    photoThumb:{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: `1px solid ${colors.border}` },
    noPhoto:   { width: 56, height: 56, borderRadius: 8, background: colors.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: colors.lightGrey },
    pctBar:    { height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden', width: '100%', marginTop: 8 },
    pctFill:   (p) => ({ height: 8, borderRadius: 4, width: `${p}%`, background: p >= 80 ? colors.success : p >= 50 ? colors.warning : colors.error }),
    detailGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    detailCard:{ background: colors.white, borderRadius: 10, padding: '16px 20px', boxShadow: shadow.sm, border: `1px solid ${colors.border}` },
    detailLabel:{ fontSize: 11, color: colors.midGrey, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 },
    detailVal: { fontSize: 14, fontWeight: 600, color: colors.dark },
    empty:     { textAlign: 'center', padding: '48px 0', color: colors.lightGrey, fontSize: 14 },
    lightbox:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' },
    lightboxImg:{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' },
  }

  if (isLoading) return <div style={s.page}><p style={{ color: colors.midGrey }}>Loading campaign…</p></div>
  if (error)     return <div style={s.page}><p style={{ color: colors.error }}>Failed to load campaign.</p></div>

  return (
    <div style={s.page}>
      {lightboxImg && (
        <div style={s.lightbox} onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Evidence" style={s.lightboxImg} />
        </div>
      )}

      <PageHeader
        title={campaign.title || 'Campaign Detail'}
        onBack={() => navigate('/admin/campaigns')}
        actions={
          <button style={s.editBtn} onClick={() => navigate(`/admin/campaigns/${id}/edit`)}>
            ✏️ Edit Campaign
          </button>
        }
      />

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroTop}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={s.chip(typeStyle.bg, typeStyle.text)}>{campaign.type}</span>
              <Badge status={statusMap[campaign.status] || 'inactive'} label={campaign.status} />
            </div>
            <div style={s.heroTitle}>{campaign.title}</div>
          </div>
        </div>
        {campaign.description && <div style={s.heroDesc}>{campaign.description}</div>}

        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statVal}>{totalStores}</div>
            <div style={s.statLabel}>Total Stores</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statVal, color: confirmedCount === totalStores && totalStores > 0 ? colors.success : colors.primary }}>{confirmedCount}</div>
            <div style={s.statLabel}>Confirmed</div>
          </div>
          <div style={{ ...s.statCard, minWidth: 160 }}>
            <div style={{ ...s.statVal, color: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error }}>{pct}%</div>
            <div style={s.statLabel}>Compliance</div>
            <div style={s.pctBar}><div style={s.pctFill(pct)} /></div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statVal, fontSize: 16, paddingTop: 4 }}>{fmtDate(campaign.start_date)}</div>
            <div style={s.statLabel}>Start Date</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statVal, fontSize: 16, paddingTop: 4 }}>{fmtDate(campaign.end_date)}</div>
            <div style={s.statLabel}>End Date</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'overview')}      onClick={() => setTab('overview')}>Overview</button>
        <button style={TAB_STYLE(tab === 'confirmations')} onClick={() => setTab('confirmations')}>
          Execution Confirmations
          {confirmedCount > 0 && (
            <span style={{ marginLeft: 6, background: colors.primary, color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11 }}>
              {confirmedCount}
            </span>
          )}
        </button>
        <button style={TAB_STYLE(tab === 'stores')}  onClick={() => setTab('stores')}>Store Assignments</button>
        <button style={TAB_STYLE(tab === 'assets')}  onClick={() => setTab('assets')}>Assets</button>
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div style={s.detailGrid}>
          <div style={s.detailCard}>
            <div style={s.detailLabel}>Campaign Type</div>
            <div style={s.detailVal}><span style={s.chip(typeStyle.bg, typeStyle.text)}>{campaign.type || '—'}</span></div>
          </div>
          <div style={s.detailCard}>
            <div style={s.detailLabel}>Status</div>
            <div style={s.detailVal}><Badge status={statusMap[campaign.status] || 'inactive'} label={campaign.status || '—'} /></div>
          </div>
          <div style={s.detailCard}>
            <div style={s.detailLabel}>Start Date</div>
            <div style={s.detailVal}>{fmtDate(campaign.start_date)}</div>
          </div>
          <div style={s.detailCard}>
            <div style={s.detailLabel}>End Date</div>
            <div style={s.detailVal}>{fmtDate(campaign.end_date)}</div>
          </div>
          <div style={{ ...s.detailCard, gridColumn: '1 / -1' }}>
            <div style={s.detailLabel}>Description</div>
            <div style={{ ...s.detailVal, fontWeight: 400, lineHeight: 1.6 }}>{campaign.description || '—'}</div>
          </div>
          {campaign.brief_url && (
            <div style={{ ...s.detailCard, gridColumn: '1 / -1' }}>
              <div style={s.detailLabel}>Campaign Brief URL</div>
              <a href={campaign.brief_url} target="_blank" rel="noreferrer" style={{ color: colors.primary, fontSize: 13 }}>{campaign.brief_url}</a>
            </div>
          )}
          <div style={s.detailCard}>
            <div style={s.detailLabel}>Execution Compliance</div>
            <div style={{ ...s.statVal, color: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error }}>{pct}%</div>
            <div style={s.pctBar}><div style={s.pctFill(pct)} /></div>
            <div style={{ fontSize: 11, color: colors.midGrey, marginTop: 6 }}>{confirmedCount} of {totalStores} stores confirmed</div>
          </div>
          <div style={s.detailCard}>
            <div style={s.detailLabel}>Created By</div>
            <div style={s.detailVal}>{campaign.created_by_name || '—'}</div>
          </div>
        </div>
      )}

      {/* ── Confirmations Tab ── */}
      {tab === 'confirmations' && (
        <>
          {confirmations.length === 0 ? (
            <div style={s.empty}>No execution confirmations yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Confirmed By</th>
                    <th style={s.th}>Confirmed At</th>
                    <th style={s.th}>GPS Verified</th>
                    <th style={s.th}>Location</th>
                    <th style={s.th}>Photo Evidence</th>
                    <th style={s.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmations.map((c) => (
                    <tr key={c.id}>
                      <td style={{ ...s.td, fontWeight: 700 }}>{c.store_name || '—'}</td>
                      <td style={s.td}>{c.confirmed_by_name || '—'}</td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>{fmtDateTime(c.confirmed_at)}</td>
                      <td style={s.td}>
                        {c.gps_verified
                          ? <span style={s.chip('#D1FAE5', '#065F46')}>✅ Verified</span>
                          : <span style={s.chip('#FEE2E2', '#991B1B')}>❌ Not verified</span>
                        }
                      </td>
                      <td style={s.td}>
                        {c.gps_lat && c.gps_lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${c.gps_lat},${c.gps_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            style={s.gpsLink}
                          >
                            📍 {parseFloat(c.gps_lat).toFixed(5)}, {parseFloat(c.gps_lng).toFixed(5)}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={s.td}>
                        {c.photo_url ? (
                          <img
                            src={c.photo_url}
                            alt="Evidence"
                            style={s.photoThumb}
                            onClick={() => setLightboxImg(c.photo_url)}
                            title="Click to enlarge"
                          />
                        ) : (
                          <div style={s.noPhoto} title="No photo">📷</div>
                        )}
                      </td>
                      <td style={{ ...s.td, maxWidth: 200, fontSize: 12, color: colors.midGrey }}>
                        {c.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Store Assignments Tab ── */}
      {tab === 'stores' && (
        <>
          {assignments.length === 0 ? (
            <div style={s.empty}>No stores assigned to this campaign.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Assigned At</th>
                    <th style={s.th}>Confirmation Status</th>
                    <th style={s.th}>Confirmed At</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const conf = confirmations.find((c) => c.store_id === a.store_id)
                    return (
                      <tr key={a.id}>
                        <td style={{ ...s.td, fontWeight: 700 }}>{a.store_name || '—'}</td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>{fmtDate(a.assigned_at || a.created_at)}</td>
                        <td style={s.td}>
                          {conf
                            ? <span style={s.chip('#D1FAE5', '#065F46')}>✅ Confirmed</span>
                            : <span style={s.chip('#FEF3C7', '#92400E')}>⏳ Pending</span>
                          }
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: colors.midGrey }}>
                          {conf ? fmtDateTime(conf.confirmed_at) : '—'}
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

      {/* ── Assets Tab ── */}
      {tab === 'assets' && (
        <>
          {assets.length === 0 ? (
            <div style={s.empty}>No assets attached to this campaign.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {assets.map((a) => (
                <div key={a.id} style={{ background: colors.white, borderRadius: 10, padding: 16, boxShadow: shadow.sm, border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>
                    {a.type === 'PDF' ? '📄' : a.type === 'PSD' ? '🎨' : a.type === 'ZIP' ? '📦' : '🖼️'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: colors.dark, marginBottom: 4 }}>{a.name}</div>
                  {a.size && <div style={{ fontSize: 11, color: colors.lightGrey }}>{a.size}</div>}
                  {a.file_url && (
                    <a href={a.file_url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: colors.primary, fontWeight: 700 }}>
                      ⬇️ Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
