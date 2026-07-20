import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? null
}

const CONTENT_TYPES = ['video', 'pdf', 'text', 'quiz']
const STATUSES = ['draft', 'published']

const CATEGORIES = [
  'compliance', 'sales', 'operations', 'product', 'safety', 'hr', 'finance', 'other',
]

function emptyModule() {
  return { title: '', content_type: 'video', has_quiz: false }
}

export default function CourseBuilder() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [passMark, setPassMark] = useState(70)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [status, setStatus] = useState('draft')
  const [modules, setModules] = useState([emptyModule()])

  const { data: raw, isLoading } = useQuery({
    queryKey: ['training-course', id],
    queryFn: () => client.get(`/training/courses/${id}`),
    enabled: !isNew,
  })

  useEffect(() => {
    const c = getData(raw)
    if (!c) return
    setTitle(c.title || '')
    setDescription(c.description || '')
    setCategory(c.category || '')
    setPassMark(c.pass_mark ?? 70)
    setDurationMinutes(c.duration_minutes ?? 30)
    setStatus(c.status || 'draft')
    setModules(
      c.modules?.length
        ? c.modules.map((m) => ({
            title: m.title || '',
            content_type: m.content_type || 'video',
            has_quiz: m.has_quiz ?? false,
          }))
        : [emptyModule()]
    )
  }, [raw])

  const mutation = useMutation({
    mutationFn: (body) =>
      isNew
        ? client.post('/training/courses', body)
        : client.put(`/training/courses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-courses'] })
      window.alert(isNew ? 'Course created!' : 'Course updated!')
      navigate('/admin/courses')
    },
    onError: (err) => {
      window.alert('Error: ' + (err?.response?.data?.message || err.message))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) { window.alert('Course title is required.'); return }
    if (passMark < 0 || passMark > 100) { window.alert('Pass mark must be between 0 and 100.'); return }
    mutation.mutate({
      title: title.trim(),
      description,
      category,
      pass_mark: Number(passMark),
      duration_minutes: Number(durationMinutes),
      status,
      modules,
    })
  }

  const addModule = () => setModules((prev) => [...prev, emptyModule()])
  const removeModule = (i) => {
    if (!window.confirm('Remove this module?')) return
    setModules((prev) => prev.filter((_, idx) => idx !== i))
  }
  const updateModule = (i, field, value) => {
    setModules((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
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
    row2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 18,
    },
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
    select: {
      width: '100%',
      padding: '9px 12px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: colors.dark,
      outline: 'none',
      background: colors.white,
      cursor: 'pointer',
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
    modCard: {
      border: `1.5px solid ${colors.border}`,
      borderRadius: 10,
      padding: '16px 18px',
      marginBottom: 10,
      background: colors.background,
      display: 'grid',
      gridTemplateColumns: '28px 1fr auto auto auto',
      gap: 10,
      alignItems: 'center',
    },
    modNum: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: colors.primary,
      color: colors.white,
      fontSize: 12,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    modInput: {
      padding: '8px 12px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 13,
      color: colors.dark,
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    modSelect: {
      padding: '8px 10px',
      border: `1.5px solid ${colors.border}`,
      borderRadius: 8,
      fontSize: 12,
      color: colors.dark,
      outline: 'none',
      background: colors.white,
      cursor: 'pointer',
    },
    quizToggleWrap: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
    },
    toggle: (on) => ({
      width: 36,
      height: 20,
      borderRadius: 10,
      background: on ? colors.primary : colors.border,
      cursor: 'pointer',
      flexShrink: 0,
      border: 'none',
      outline: 'none',
    }),
    toggleLabel: { fontSize: 10, color: colors.midGrey, fontWeight: 600 },
    iconBtn: (color) => ({
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: color || colors.midGrey,
      fontSize: 16,
      padding: '4px',
      lineHeight: 1,
    }),
    addModBtn: {
      marginTop: 4,
      padding: '8px 16px',
      background: 'none',
      border: `1.5px dashed ${colors.primary}`,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      color: colors.primary,
      cursor: 'pointer',
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
  }

  if (isLoading) return <div style={{ ...s.page, color: colors.midGrey }}>Loading…</div>

  return (
    <div style={s.page}>
      <PageHeader title={isNew ? 'New Training Course' : 'Edit Training Course'} />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Course Details</div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Course Title *</label>
            <input
              style={s.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Store Operations Fundamentals"
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
            <label style={s.label}>Category</label>
            <select
              style={s.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">— Select category —</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} style={{ textTransform: 'capitalize' }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={s.row2}>
            <div>
              <label style={s.label}>Pass Mark (%)</label>
              <input
                style={s.input}
                type="number"
                min={0}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(e.target.value)}
              />
            </div>
            <div>
              <label style={s.label}>Duration (minutes)</label>
              <input
                style={s.input}
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
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

        {/* Modules */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Modules</div>

          {modules.map((mod, i) => (
            <div key={i} style={s.modCard}>
              <div style={s.modNum}>{i + 1}</div>
              <input
                style={s.modInput}
                value={mod.title}
                onChange={(e) => updateModule(i, 'title', e.target.value)}
                placeholder={`Module ${i + 1} title`}
              />
              <select
                style={s.modSelect}
                value={mod.content_type}
                onChange={(e) => updateModule(i, 'content_type', e.target.value)}
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
              <div style={s.quizToggleWrap}>
                <button
                  type="button"
                  style={s.toggle(mod.has_quiz)}
                  onClick={() => updateModule(i, 'has_quiz', !mod.has_quiz)}
                  title={mod.has_quiz ? 'Has quiz' : 'No quiz'}
                />
                <span style={s.toggleLabel}>Quiz</span>
              </div>
              <button
                type="button"
                style={s.iconBtn(colors.error)}
                onClick={() => removeModule(i)}
                title="Remove module"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" style={s.addModBtn} onClick={addModule}>
            + Add Module
          </button>
        </div>

        <div style={s.footer}>
          <button
            type="button"
            style={s.cancelBtn}
            onClick={() => navigate('/admin/courses')}
          >
            Cancel
          </button>
          <button type="submit" style={s.saveBtn} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isNew ? 'Create Course' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
