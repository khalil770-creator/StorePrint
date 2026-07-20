import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? null
}

const SURVEY_TYPES = ['nps', 'csat', 'custom']
const STATUSES = ['draft', 'published']
const QUESTION_TYPES = ['rating', 'text', 'multiple_choice']

const NPS_DEFAULT_QUESTION = {
  text: 'How likely are you to recommend us to a friend or colleague? (0–10)',
  type: 'rating',
  required: true,
  _nps: true,
}

function emptyQuestion() {
  return { text: '', type: 'rating', required: false, scale: 5, options: [] }
}

export default function SurveyBuilder() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('csat')
  const [isActive, setIsActive] = useState(false)
  const [questions, setQuestions] = useState([emptyQuestion()])

  const { data: raw, isLoading } = useQuery({
    queryKey: ['cx-survey', id],
    queryFn: () => client.get(`/cx/surveys/${id}`),
    enabled: !isNew,
  })

  useEffect(() => {
    const sv = getData(raw)
    if (!sv) return
    setName(sv.title || sv.name || '')
    setDescription(sv.description || '')
    setType(sv.type || 'csat')
    setIsActive(sv.is_active ?? false)
    setQuestions(
      sv.questions?.length
        ? sv.questions.map((q) => ({
            text: q.text || '',
            type: q.type || 'rating',
            required: q.required ?? false,
            scale: q.scale || 5,
            options: q.options || [],
          }))
        : [emptyQuestion()]
    )
  }, [raw])

  // Auto-insert/remove NPS question when type changes to/from nps
  const handleTypeChange = (newType) => {
    setType(newType)
    if (newType === 'nps') {
      setQuestions((prev) => {
        const hasNps = prev.some((q) => q._nps)
        if (hasNps) return prev
        return [{ ...NPS_DEFAULT_QUESTION }, ...prev.filter((q) => !q._nps)]
      })
    } else {
      setQuestions((prev) => prev.filter((q) => !q._nps))
    }
  }

  const mutation = useMutation({
    mutationFn: (body) =>
      isNew
        ? client.post('/cx/surveys', body)
        : client.put(`/cx/surveys/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cx-surveys'] })
      window.alert(isNew ? 'Survey created!' : 'Survey updated!')
      navigate('/admin/surveys')
    },
    onError: (err) => {
      window.alert('Error: ' + (err?.response?.data?.message || err.message))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { window.alert('Survey name is required.'); return }
    const cleanQuestions = questions.map(({ _nps, ...q }) => q)
    mutation.mutate({ title: name.trim(), description, type, is_active: isActive, questions: cleanQuestions })
  }

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()])
  const removeQuestion = (i) => {
    if (questions[i]?._nps) { window.alert('The NPS question is auto-added and cannot be removed. Switch to a different survey type to remove it.'); return }
    if (!window.confirm('Remove this question?')) return
    setQuestions((prev) => prev.filter((_, idx) => idx !== i))
  }
  const updateQuestion = (i, field, value) => {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }
  const addOption = (i) => {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, options: [...(q.options || []), ''] } : q))
  }
  const updateOption = (qi, oi, value) => {
    setQuestions((prev) => prev.map((q, idx) => idx === qi
      ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) }
      : q))
  }
  const removeOption = (qi, oi) => {
    setQuestions((prev) => prev.map((q, idx) => idx === qi
      ? { ...q, options: q.options.filter((_, j) => j !== oi) }
      : q))
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
    chip: (active, accent) => ({
      padding: '6px 16px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      border: `1.5px solid ${active ? (accent || colors.primary) : colors.border}`,
      background: active ? (accent ? accent + '22' : colors.primaryBg) : colors.white,
      color: active ? (accent || colors.primary) : colors.midGrey,
      textTransform: 'uppercase',
    }),
    qRow: {
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto',
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
      marginTop: 8,
      padding: '8px 16px',
      background: 'none',
      border: `1.5px dashed ${colors.primary}`,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      color: colors.primary,
      cursor: 'pointer',
    },
    npsNote: {
      fontSize: 12,
      color: colors.info,
      background: '#EFF6FF',
      border: `1px solid #BFDBFE`,
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 12,
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
      <PageHeader title={isNew ? 'New Survey' : 'Edit Survey'} />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Survey Details</div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Survey Name *</label>
            <input
              style={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Post-Visit NPS Survey"
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
            <label style={s.label}>Survey Type</label>
            <div style={s.chipRow}>
              {SURVEY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  style={s.chip(type === t, t === 'nps' ? colors.info : t === 'csat' ? colors.success : undefined)}
                  onClick={() => handleTypeChange(t)}
                >
                  {t === 'nps' ? 'NPS' : t === 'csat' ? 'CSAT' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Status</label>
            <div style={s.chipRow}>
              <button type="button" style={s.chip(!isActive)} onClick={() => setIsActive(false)}>Draft</button>
              <button type="button" style={s.chip(isActive)} onClick={() => setIsActive(true)}>Published</button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Questions</div>

          {type === 'nps' && (
            <div style={s.npsNote}>
              NPS surveys automatically include a 0–10 recommendation rating question at the top.
            </div>
          )}

          {/* Column headers */}
          <div style={{ ...s.qRow, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey }}>Question</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textAlign: 'center' }}>Type</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textAlign: 'center' }}>Req.</span>
            <span />
          </div>

          {questions.map((q, i) => (
            <React.Fragment key={i}>
            <div
              style={{
                ...s.qRow,
                opacity: q._nps ? 0.75 : 1,
                background: q._nps ? colors.background : 'transparent',
                borderRadius: q._nps ? 8 : 0,
                padding: q._nps ? '4px 8px' : 0,
              }}
            >
              <input
                style={{ ...s.qInput, background: q._nps ? colors.background : colors.white }}
                value={q.text}
                onChange={(e) => !q._nps && updateQuestion(i, 'text', e.target.value)}
                placeholder="Question text…"
                readOnly={!!q._nps}
              />
              <select
                style={s.select}
                value={q.type}
                onChange={(e) => !q._nps && updateQuestion(i, 'type', e.target.value)}
                disabled={!!q._nps}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="button"
                style={s.toggle(q.required)}
                onClick={() => !q._nps && updateQuestion(i, 'required', !q.required)}
                title={q.required ? 'Required' : 'Optional'}
                disabled={!!q._nps}
              />
              <button
                type="button"
                style={s.iconBtn(colors.error)}
                onClick={() => removeQuestion(i)}
                title="Remove question"
              >
                ✕
              </button>
            </div>

            {/* Rating scale selector */}
            {q.type === 'rating' && !q._nps && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingLeft: 4 }}>
                <span style={{ fontSize: 12, color: colors.midGrey, fontWeight: 600 }}>Scale:</span>
                {[5, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateQuestion(i, 'scale', n)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${q.scale === n ? colors.primary : colors.border}`,
                      background: q.scale === n ? colors.primaryBg : colors.white,
                      color: q.scale === n ? colors.primary : colors.midGrey,
                    }}
                  >
                    1 – {n}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple choice options */}
            {q.type === 'multiple_choice' && !q._nps && (
              <div style={{ marginTop: 8, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: colors.lightGrey, width: 20, textAlign: 'right' }}>{oi + 1}.</span>
                    <input
                      style={{ ...s.qInput, flex: 1 }}
                      value={opt}
                      onChange={(e) => updateOption(i, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                    />
                    <button type="button" style={s.iconBtn(colors.error)} onClick={() => removeOption(i, oi)}>✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(i)}
                  style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: colors.primary, background: 'none', border: `1.5px dashed ${colors.primary}`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', marginTop: 2 }}
                >
                  + Add Option
                </button>
                {(q.options || []).length === 0 && (
                  <span style={{ fontSize: 12, color: colors.lightGrey, fontStyle: 'italic' }}>No options yet — click Add Option</span>
                )}
              </div>
            )}
            </React.Fragment>
          ))}

          <button type="button" style={s.addQBtn} onClick={addQuestion}>
            + Add Question
          </button>
        </div>

        <div style={s.footer}>
          <button
            type="button"
            style={s.cancelBtn}
            onClick={() => navigate('/admin/surveys')}
          >
            Cancel
          </button>
          <button type="submit" style={s.saveBtn} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isNew ? 'Create Survey' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
