import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const CATEGORIES = ['window', 'in-store', 'pos', 'digital']

const CAT_COLORS = {
  window:    { bg: '#e8f4fd', text: '#1a73e8' },
  'in-store':{ bg: '#e8f5e9', text: '#2e7d32' },
  pos:       { bg: '#fff8e1', text: '#f57f17' },
  digital:   { bg: '#fce4ec', text: '#c62828' },
}

function CatChip({ category }) {
  const c = CAT_COLORS[category] || { bg: colors.surfaceLow, text: colors.midGrey }
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, fontFamily: fonts.body }}>
      {category}
    </span>
  )
}

const PRINT_STATUS_MAP = {
  pending:       'inactive',
  approved:      'warning',
  in_production: 'active',
  delivered:     'success',
  cancelled:     'error',
}

const OVERLAY = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
}
const MODAL = {
  background: colors.white, borderRadius: 14, padding: '32px 36px',
  boxShadow: shadow.lg || shadow.sm, width: 520, maxHeight: '90vh', overflowY: 'auto',
}

function FormField({ label, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: colors.dark, marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: fonts.label }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: colors.error, marginTop: 3 }}>{error}</div>}
    </div>
  )
}

const INPUT = {
  width: '100%', padding: '9px 13px', borderRadius: 8,
  border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body,
  color: colors.dark, background: colors.white, outline: 'none', boxSizing: 'border-box',
}
const TEXTAREA = { ...INPUT, resize: 'vertical', minHeight: 72 }
const SELECT_STYLE = { ...INPUT, cursor: 'pointer' }

const STATUS_COLORS = {
  pending:       { bg: '#F3F4F6', text: '#6B7280' },
  approved:      { bg: '#FEF3C7', text: '#D97706' },
  in_production: { bg: '#DBEAFE', text: '#1D4ED8' },
  delivered:     { bg: '#D1FAE5', text: '#065F46' },
  cancelled:     { bg: '#FEE2E2', text: '#991B1B' },
}

export default function SignagePage() {
  const [tab, setTab] = useState('templates')
  const [showModal, setShowModal] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const qc = useQueryClient()

  // ── Templates ──
  const [tForm, setTForm] = useState({ title: '', description: '', category: 'window', dimensions: '', file_url: '', thumbnail_url: '' })
  const [tErrors, setTErrors] = useState({})

  const { data: rawTemplates, isLoading: loadingTemplates, error: errTemplates } = useQuery({
    queryKey: ['signage-templates'],
    queryFn: () => client.get('/signage/templates'),
  })
  const templates = Array.isArray(getData(rawTemplates)) ? getData(rawTemplates) : []

  const createTemplate = useMutation({
    mutationFn: (payload) => client.post('/signage/templates', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signage-templates'] })
      setShowModal(false)
      setTForm({ title: '', description: '', category: 'window', dimensions: '', file_url: '', thumbnail_url: '' })
    },
  })

  function submitTemplate(e) {
    e.preventDefault()
    const errs = {}
    if (!tForm.title.trim()) errs.title = 'Required'
    if (Object.keys(errs).length) { setTErrors(errs); return }
    setTErrors({})
    createTemplate.mutate(tForm)
  }

  // ── Print Requests ──
  const { data: rawRequests, isLoading: loadingRequests, error: errRequests } = useQuery({
    queryKey: ['signage-print-requests'],
    queryFn: () => client.get('/signage/print-requests'),
    enabled: tab === 'print-requests',
  })
  const requests = Array.isArray(getData(rawRequests)) ? getData(rawRequests) : []

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => client.put(`/signage/print-requests/${id}/status`, { status }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['signage-print-requests'] })
      setSavedId(id)
      setTimeout(() => setSavedId(null), 2000)
    },
  })

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    createBtn: {
      padding: '9px 18px', background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    tabBar: { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24, gap: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    card: {
      background: colors.white, borderRadius: 12, padding: '20px 24px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark },
    meta: { fontSize: 12, color: colors.midGrey },
    thumbWrap: { borderRadius: 8, overflow: 'hidden', height: 120, background: colors.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    thumb: { width: '100%', height: '100%', objectFit: 'cover' },
    thumbPlaceholder: { color: colors.lightGrey, fontSize: 12 },
    table: { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td: { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    empty: { textAlign: 'center', padding: '72px 0', color: colors.lightGrey, fontSize: 14 },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    errorText: { color: colors.error, fontSize: 13, padding: '16px 0' },
    modalTitle: { fontSize: 17, fontWeight: 800, color: colors.dark, marginBottom: 24 },
    modalActions: { display: 'flex', gap: 10, marginTop: 8 },
    submitBtn: { padding: '9px 22px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    cancelBtn: { padding: '9px 22px', background: colors.white, color: colors.midGrey, border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    statusSelect: {
      padding: '5px 10px', borderRadius: 7, border: `1.5px solid ${colors.border}`,
      fontSize: 12, fontFamily: fonts.body, cursor: 'pointer', background: colors.white, color: colors.dark,
    },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Signage"
        onBack={false}
        actions={
          tab === 'templates' && (
            <button style={s.createBtn} onClick={() => setShowModal(true)}>+ New Template</button>
          )
        }
      />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'templates')} onClick={() => setTab('templates')}>Templates</button>
        <button style={TAB_STYLE(tab === 'print-requests')} onClick={() => setTab('print-requests')}>Print Requests</button>
      </div>

      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <>
          {loadingTemplates && <div style={s.loadText}>Loading templates…</div>}
          {errTemplates && <div style={s.errorText}>Failed to load templates.</div>}
          {!loadingTemplates && !errTemplates && templates.length === 0 && (
            <div style={s.empty}>No signage templates yet.<br />Click <strong>+ New Template</strong> to create one.</div>
          )}
          {templates.length > 0 && (
            <div style={s.grid}>
              {templates.map((t) => (
                <div key={t.id} style={s.card}>
                  {t.thumbnail_url ? (
                    <div style={s.thumbWrap}>
                      <img src={t.thumbnail_url} alt={t.title} style={s.thumb} />
                    </div>
                  ) : (
                    <div style={s.thumbWrap}>
                      <span style={s.thumbPlaceholder}>No preview</span>
                    </div>
                  )}
                  <div style={s.cardTop}>
                    <div style={s.name}>{t.title}</div>
                    <Badge status={t.is_active ? 'active' : 'inactive'} label={t.is_active ? 'Active' : 'Inactive'} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CatChip category={t.category} />
                    {t.dimensions && <span style={s.meta}>{t.dimensions}</span>}
                  </div>
                  {t.description && <div style={s.meta}>{t.description}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Print Requests Tab ── */}
      {tab === 'print-requests' && (
        <>
          {loadingRequests && <div style={s.loadText}>Loading print requests…</div>}
          {errRequests && <div style={s.errorText}>Failed to load print requests.</div>}
          {!loadingRequests && !errRequests && requests.length === 0 && (
            <div style={s.empty}>No print requests yet.</div>
          )}
          {requests.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Template</th>
                    <th style={s.th}>Quantity</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{r.store_name || r.store_id || '—'}</td>
                      <td style={s.td}>{r.template_title || r.template_id || '—'}</td>
                      <td style={{ ...s.td, fontFamily: fonts.mono }}>{r.quantity ?? '—'}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <select
                            style={{
                              ...s.statusSelect,
                              background: STATUS_COLORS[r.status]?.bg || '#F3F4F6',
                              color: STATUS_COLORS[r.status]?.text || colors.dark,
                              fontWeight: 700,
                              border: `1.5px solid ${STATUS_COLORS[r.status]?.text || colors.border}`,
                            }}
                            value={r.status}
                            onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                            disabled={updateStatus.isPending}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="in_production">In Production</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {savedId === r.id && (
                            <span style={{ fontSize: 11, color: colors.success, fontWeight: 700 }}>✓ Saved</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12, color: colors.midGrey }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── New Template Modal ── */}
      {showModal && (
        <div style={OVERLAY} onClick={() => setShowModal(false)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>New Signage Template</div>
            {createTemplate.isError && (
              <div style={{ background: colors.errorBg, color: colors.error, borderRadius: 8, padding: '9px 14px', fontSize: 12, marginBottom: 16 }}>
                Failed to create template.
              </div>
            )}
            <form onSubmit={submitTemplate}>
              <FormField label="Title *" error={tErrors.title}>
                <input
                  style={{ ...INPUT, ...(tErrors.title ? { borderColor: colors.error } : {}) }}
                  value={tForm.title}
                  onChange={(e) => setTForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Template title"
                />
              </FormField>
              <FormField label="Description">
                <textarea style={TEXTAREA} value={tForm.description} onChange={(e) => setTForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe this signage template" />
              </FormField>
              <FormField label="Category">
                <select style={SELECT_STYLE} value={tForm.category} onChange={(e) => setTForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Dimensions">
                <input style={INPUT} value={tForm.dimensions} onChange={(e) => setTForm((f) => ({ ...f, dimensions: e.target.value }))} placeholder="e.g. 600mm x 900mm" />
              </FormField>
              <FormField label="File URL">
                <input style={INPUT} value={tForm.file_url} onChange={(e) => setTForm((f) => ({ ...f, file_url: e.target.value }))} placeholder="https://..." />
              </FormField>
              <FormField label="Thumbnail URL">
                <input style={INPUT} value={tForm.thumbnail_url} onChange={(e) => setTForm((f) => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." />
              </FormField>
              <div style={s.modalActions}>
                <button type="submit" style={s.submitBtn} disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? 'Creating…' : 'Create Template'}
                </button>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
