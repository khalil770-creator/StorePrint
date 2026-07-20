import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? null
}

const QUESTION_TYPES = ['yes_no', 'score_1_5', 'photo', 'text']
const STATUSES = ['draft', 'published']

function emptyQuestion() {
  return { text: '', type: 'yes_no', weight: 1, required: false }
}

function emptyCategory() {
  return { name: '', questions: [emptyQuestion()] }
}

export default function AuditBuilder() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [categories, setCategories] = useState([emptyCategory()])

  const { data: raw, isLoading } = useQuery({
    queryKey: ['audit-template', id],
    queryFn: () => client.get(`/auditing/templates/${id}`),
    enabled: !isNew,
  })

  useEffect(() => {
    const t = getData(raw)
    if (!t) return
    setName(t.name || '')
    setDescription(t.description || '')
    setStatus(t.status || 'draft')
    setCategories(
      t.categories?.length
        ? t.categories.map((c) => ({
            name: c.name || '',
            questions: c.questions?.length
              ? c.questions.map((q) => ({
                  text: q.text || '',
                  type: q.type || 'yes_no',
                  weight: q.weight ?? 1,
                  required: q.required ?? false,
                }))
              : [emptyQuestion()],
          }))
        : [emptyCategory()]
    )
  }, [raw])

  const mutation = useMutation({
    mutationFn: (body) =>
      isNew
        ? client.post('/auditing/templates', body)
        : client.put(`/auditing/templates/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit-templates'] })
      window.alert(isNew ? 'Template created!' : 'Template updated!')
      navigate('/admin/audit-templates')
    },
    onError: (err) => {
      window.alert('Error: ' + (err?.response?.data?.message || err.message))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { window.alert('Template name is required.'); return }
    mutation.mutate({ name: name.trim(), description, status, categories })
  }

  // Category helpers
  const addCategory = () => setCategories((prev) => [...prev, emptyCategory()])
  const removeCategory = (ci) => {
    if (!window.confirm('Remove this category and all its questions?')) return
    setCategories((prev) => prev.filter((_, i) => i !== ci))
  }
  const updateCategory = (ci, field, value) => {
    setCategories((prev) => prev.map((c, i) => i === ci ? { ...c, [field]: value } : c))
  }

  // Question helpers
  const addQuestion = (ci) => {
    setCategories((prev) =>
      prev.map((c, i) => i === ci ? { ...c, questions: [...c.questions, emptyQuestion()] } : c)
    )
  }
  const removeQuestion = (ci, qi) => {
    setCategories((prev) =>
      prev.map((c, i) =>
        i === ci ? { ...c, questions: c.questions.filter((_, j) => j !== qi) } : c
      )
    )
  }
  const updateQuestion = (ci, qi, field, value) => {
    setCategories((prev) =>
      prev.map((c, i) =>
        i === ci
          ? {
              ...c,
              questions: c.questions.map((q, j) =>
                j === qi ? { ...q, [field]: value } : q
              ),
            }
          : c
      )
    )
  }

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    card: {
      background: colors.white,
      borderRadius: 12,
      padding: '28px 32px',
      boxShadow: shadow.sm,
      border: `1px solid ${colors.border}`,
      marginBottom: 20,
    },
    sectionTitle: { fontSize: 15, fontWeight: 800, color: colors.dark, marginBottom: 16 },
    fieldGroup: { marginBottom: 18 },
    label: { display: 'block', fontSize: 12, fontWeight: 700, color: colors.midGrey, marginBottom: 6 },
    input: {
      width: '100%',
      padding: '9px 12px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: colors.dark,
      outline: 'none',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '9px 12px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: colors.dark,
      outline: 'none',
      resize: 'vertical',
      minHeight: 72,
      boxSizing: 'border-box',
    },
    chipRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    chip: (active) => ({
      padding: '6px 14px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      border: `1.5px solid ${active ? colors.primary : colors.border}`,
      background: active ? colors.primaryBg : colors.white,
      color: active ? colors.primary : colors.midGrey,
      textTransform: 'capitalize',
    }),
    catCard: {
      border: `1.5px solid ${colors.border}`,
      borderRadius: 10,
      padding: '18px 20px',
      marginBottom: 14,
      background: colors.background,
    },
    catHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
    catInput: {
      flex: 1,
      padding: '8px 12px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: colors.dark,
      outline: 'none',
    },
    qRow: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto auto',
      gap: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    qInput: {
      padding: '8px 12px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: colors.dark,
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    select: {
      padding: '8px 10px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 12,
      color: colors.dark,
      outline: 'none',
      background: colors.white,
      cursor: 'pointer',
    },
    weightInput: {
      width: 56,
      padding: '8px 8px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 12,
      color: colors.dark,
      outline: 'none',
      textAlign: 'center',
    },
    toggle: (on) => ({
      width: 36,
      height: 20,
      borderRadius: 10,
      background: on ? colors.primary : colors.border,
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0,
      border: 'none',
      outline: 'none',
    }),
    iconBtn: (color) => ({
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: color || colors.midGrey,
      fontSize: 16,
      padding: '4px',
      lineHeight: 1,
    }),
    addQBtn: {
      marginTop: 6,
      padding: '6px 12px',
      background: 'none',
      border: `1.5px dashed ${colors.border}`,
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      color: colors.midGrey,
      cursor: 'pointer',
    },
    addCatBtn: {
      padding: '9px 18px',
      background: 'none',
      border: `1.5px dashed ${colors.primary}`,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      color: colors.primary,
      cursor: 'pointer',
      marginBottom: 20,
    },
    footer: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '10px 20px',
      background: colors.white,
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      color: colors.midGrey,
    },
    saveBtn: {
      padding: '10px 24px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      opacity: mutation.isPending ? 0.7 : 1,
    },
    reqLabel: { fontSize: 11, color: colors.midGrey, textAlign: 'center', lineHeight: 1.3 },
  }

  if (isLoading) return <div style={{ ...s.page, color: colors.midGrey }}>Loading…</div>

  return (
    <div style={s.page}>
      <PageHeader title={isNew ? 'New Audit Template' : 'Edit Audit Template'} />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Template Details</div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Template Name *</label>
            <input
              style={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Store Audit"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Description</label>
            <textarea
              style={s.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Status</label>
            <div style={s.chipRow}>
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  style={s.chip(status === st)}
                  onClick={() => setStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Categories &amp; Questions</div>

          {categories.map((cat, ci) => (
            <div key={ci} style={s.catCard}>
              <div style={s.catHeader}>
                <input
                  style={s.catInput}
                  value={cat.name}
                  onChange={(e) => updateCategory(ci, 'name', e.target.value)}
                  placeholder={`Category ${ci + 1} name`}
                />
                <button
                  type="button"
                  style={s.iconBtn(colors.error)}
                  onClick={() => removeCategory(ci)}
                  title="Remove category"
                >
                  ✕
                </button>
              </div>

              {/* Column headers */}
              <div style={{ ...s.qRow, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey }}>Question</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textAlign: 'center' }}>Type</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textAlign: 'center' }}>Weight</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textAlign: 'center' }}>Req.</span>
                <span />
              </div>

              {cat.questions.map((q, qi) => (
                <div key={qi} style={s.qRow}>
                  <input
                    style={s.qInput}
                    value={q.text}
                    onChange={(e) => updateQuestion(ci, qi, 'text', e.target.value)}
                    placeholder="Question text…"
                  />
                  <select
                    style={s.select}
                    value={q.type}
                    onChange={(e) => updateQuestion(ci, qi, 'type', e.target.value)}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    style={s.weightInput}
                    type="number"
                    min={1}
                    max={5}
                    value={q.weight}
                    onChange={(e) => updateQuestion(ci, qi, 'weight', Number(e.target.value))}
                    title="Weight 1–5"
                  />
                  <button
                    type="button"
                    style={s.toggle(q.required)}
                    onClick={() => updateQuestion(ci, qi, 'required', !q.required)}
                    title={q.required ? 'Required' : 'Optional'}
                  />
                  <button
                    type="button"
                    style={s.iconBtn(colors.error)}
                    onClick={() => removeQuestion(ci, qi)}
                    title="Remove question"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button type="button" style={s.addQBtn} onClick={() => addQuestion(ci)}>
                + Add Question
              </button>
            </div>
          ))}

          <button type="button" style={s.addCatBtn} onClick={addCategory}>
            + Add Category
          </button>
        </div>

        <div style={s.footer}>
          <button
            type="button"
            style={s.cancelBtn}
            onClick={() => navigate('/admin/audit-templates')}
          >
            Cancel
          </button>
          <button type="submit" style={s.saveBtn} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isNew ? 'Create Template' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
