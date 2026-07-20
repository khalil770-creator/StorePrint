import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow, fonts } from '../../theme'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? null
}

const TYPES = ['seasonal', 'product-launch', 'promotion', 'brand']
const STATUSES = ['draft', 'active', 'completed']

function ChipSelector({ options, value, onChange, colorMap }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = value === opt
        const c = colorMap?.[opt]
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: active ? `2px solid ${c?.text || colors.primary}` : `2px solid ${colors.border}`,
              background: active ? (c?.bg || colors.primaryBg) : colors.white,
              color: active ? (c?.text || colors.primary) : colors.midGrey,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: fonts.body,
              transition: 'all 0.12s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const TYPE_COLORS = {
  seasonal:          { bg: '#e8f4fd', text: '#1a73e8' },
  'product-launch':  { bg: '#f3e8fd', text: '#7b1fa2' },
  promotion:         { bg: '#fff8e1', text: '#f57f17' },
  brand:             { bg: '#e8f5e9', text: '#2e7d32' },
}
const STATUS_COLORS = {
  draft:     { bg: colors.surfaceLow, text: colors.midGrey },
  active:    { bg: colors.successBg,  text: colors.success },
  completed: { bg: '#e8f4fd',         text: '#1a73e8' },
}

export default function CampaignBuilder() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'seasonal',
    status: 'draft',
    start_date: '',
    end_date: '',
    brief_url: '',
  })
  const [errors, setErrors] = useState({})

  const { data: raw, isLoading: loadingExisting } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => client.get(`/campaigns/${id}`),
    enabled: isEdit,
  })

  useEffect(() => {
    if (raw) {
      const d = getData(raw)
      if (d) {
        setForm({
          title:       d.title || '',
          description: d.description || '',
          type:        d.type || 'seasonal',
          status:      d.status || 'draft',
          start_date:  d.start_date ? d.start_date.slice(0, 10) : '',
          end_date:    d.end_date   ? d.end_date.slice(0, 10)   : '',
          brief_url:   d.brief_url || '',
        })
      }
    }
  }, [raw])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? client.put(`/campaigns/${id}`, payload)
        : client.post('/campaigns', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      navigate('/admin/campaigns')
    },
  })

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    mutation.mutate(form)
  }

  function field(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    card: {
      background: colors.white, borderRadius: 12, padding: '32px 36px',
      boxShadow: shadow.sm, border: `1px solid ${colors.border}`, maxWidth: 720,
    },
    section: { marginBottom: 24 },
    label: { fontSize: 12, fontWeight: 700, color: colors.dark, marginBottom: 6, display: 'block', fontFamily: fonts.label, textTransform: 'uppercase', letterSpacing: '0.06em' },
    input: {
      width: '100%', padding: '10px 14px', borderRadius: 8,
      border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body,
      color: colors.dark, background: colors.white, outline: 'none', boxSizing: 'border-box',
    },
    inputError: { borderColor: colors.error },
    errorMsg: { fontSize: 11, color: colors.error, marginTop: 4 },
    textarea: {
      width: '100%', padding: '10px 14px', borderRadius: 8,
      border: `1.5px solid ${colors.border}`, fontSize: 14, fontFamily: fonts.body,
      color: colors.dark, background: colors.white, outline: 'none', resize: 'vertical',
      minHeight: 90, boxSizing: 'border-box',
    },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    actions: { display: 'flex', gap: 12, marginTop: 32 },
    submitBtn: {
      padding: '10px 24px', background: colors.primary, color: colors.white,
      border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
      fontFamily: fonts.body,
    },
    cancelBtn: {
      padding: '10px 24px', background: colors.white, color: colors.midGrey,
      border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600,
      cursor: 'pointer', fontFamily: fonts.body,
    },
    errBanner: { background: colors.errorBg, color: colors.error, borderRadius: 8, padding: '10px 16px', fontSize: 13, marginBottom: 20 },
  }

  if (isEdit && loadingExisting) {
    return <div style={s.page}><div style={{ color: colors.midGrey, fontSize: 14 }}>Loading campaign…</div></div>
  }

  return (
    <div style={s.page}>
      <PageHeader
        title={isEdit ? 'Edit Campaign' : 'New Campaign'}
        onBack={() => navigate('/admin/campaigns')}
      />

      <div style={s.card}>
        {mutation.isError && (
          <div style={s.errBanner}>Failed to save campaign. Please try again.</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={s.section}>
            <label style={s.label}>Title *</label>
            <input
              style={{ ...s.input, ...(errors.title ? s.inputError : {}) }}
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder="Campaign title"
            />
            {errors.title && <div style={s.errorMsg}>{errors.title}</div>}
          </div>

          {/* Description */}
          <div style={s.section}>
            <label style={s.label}>Description</label>
            <textarea
              style={s.textarea}
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              placeholder="Brief description of the campaign"
            />
          </div>

          {/* Type */}
          <div style={s.section}>
            <label style={s.label}>Type</label>
            <ChipSelector
              options={TYPES}
              value={form.type}
              onChange={(v) => field('type', v)}
              colorMap={TYPE_COLORS}
            />
          </div>

          {/* Status */}
          <div style={s.section}>
            <label style={s.label}>Status</label>
            <ChipSelector
              options={STATUSES}
              value={form.status}
              onChange={(v) => field('status', v)}
              colorMap={STATUS_COLORS}
            />
          </div>

          {/* Date range */}
          <div style={{ ...s.section, ...s.row }}>
            <div>
              <label style={s.label}>Start Date</label>
              <input
                type="date"
                style={s.input}
                value={form.start_date}
                onChange={(e) => field('start_date', e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>End Date</label>
              <input
                type="date"
                style={s.input}
                value={form.end_date}
                onChange={(e) => field('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Brief URL */}
          <div style={s.section}>
            <label style={s.label}>Brief URL (optional)</label>
            <input
              style={s.input}
              value={form.brief_url}
              onChange={(e) => field('brief_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div style={s.actions}>
            <button type="submit" style={s.submitBtn} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Campaign'}
            </button>
            <button type="button" style={s.cancelBtn} onClick={() => navigate('/admin/campaigns')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
