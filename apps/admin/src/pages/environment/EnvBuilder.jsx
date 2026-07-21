import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? null
}

const ITEM_TYPES = ['pass_fail', 'note', 'photo']
const FREQUENCIES = ['daily', 'weekly', 'monthly']
const STATUSES = ['draft', 'published']

function emptyItem() {
  return { text: '', type: 'pass_fail', frequency: 'daily', required: false }
}

export default function EnvBuilder() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [items, setItems] = useState([emptyItem()])

  const { data: raw, isLoading } = useQuery({
    queryKey: ['env-checklist', id],
    queryFn: () => client.get(`/environment/checklists/${id}`),
    enabled: !isNew,
  })

  useEffect(() => {
    const cl = getData(raw)
    if (!cl) return
    setName(cl.title || cl.name || '')
    setDescription(cl.description || '')
    setIsActive(cl.is_active ?? false)
    setItems(
      cl.items?.length
        ? cl.items.map((it) => ({
            text: it.item_text || it.text || '',
            type: it.type || 'pass_fail',
            frequency: it.frequency || 'daily',
            required: it.required ?? false,
          }))
        : [emptyItem()]
    )
  }, [raw])

  const mutation = useMutation({
    mutationFn: (body) =>
      isNew
        ? client.post('/environment/checklists', body)
        : client.put(`/environment/checklists/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['env-checklists'] })
      if (!isNew) qc.invalidateQueries({ queryKey: ['env-checklist', id] })
      window.alert(isNew ? 'Checklist created!' : 'Checklist updated!')
      navigate('/admin/env-checklists')
    },
    onError: (err) => {
      window.alert('Error: ' + (err?.response?.data?.message || err.message))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) { window.alert('Checklist name is required.'); return }
    if (items.every((it) => !it.text.trim())) { window.alert('Add at least one item.'); return }
    const mappedItems = items
      .filter((it) => it.text.trim())
      .map((it, idx) => ({
        item_text: it.text.trim(),
        order_index: idx,
        requires_photo: it.type === 'photo',
        requires_measurement: it.type === 'measurement',
        unit: null,
      }))
    mutation.mutate({ title: name.trim(), description, is_active: isActive, items: mappedItems })
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (i) => {
    if (!window.confirm('Remove this item?')) return
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }
  const updateItem = (i, field, value) => {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
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
    itemRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 120px 110px 44px 32px',
      gap: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    itemInput: {
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
      width: '100%',
      boxSizing: 'border-box',
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
    addItemBtn: {
      marginTop: 6,
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
      <PageHeader title={isNew ? 'New Environment Checklist' : 'Edit Environment Checklist'} />

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Checklist Details</div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Checklist Name *</label>
            <input
              style={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Cleanliness Check"
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
              <button
                type="button"
                style={s.chip(!isActive)}
                onClick={() => setIsActive(false)}
              >
                Draft
              </button>
              <button
                type="button"
                style={s.chip(isActive)}
                onClick={() => setIsActive(true)}
              >
                Published
              </button>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Checklist Items</div>

          {/* Column headers */}
          <div style={{ ...s.itemRow, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Req.</span>
            <span />
          </div>

          {items.map((item, i) => (
            <div key={i} style={s.itemRow}>
              <input
                style={s.itemInput}
                value={item.text}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                placeholder="Item description…"
              />
              <select
                style={s.select}
                value={item.type}
                onChange={(e) => updateItem(i, 'type', e.target.value)}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                style={s.select}
                value={item.frequency}
                onChange={(e) => updateItem(i, 'frequency', e.target.value)}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button
                type="button"
                style={s.toggle(item.required)}
                onClick={() => updateItem(i, 'required', !item.required)}
                title={item.required ? 'Required' : 'Optional'}
              />
              <button
                type="button"
                style={s.iconBtn(colors.error)}
                onClick={() => removeItem(i)}
                title="Remove item"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" style={s.addItemBtn} onClick={addItem}>
            + Add Item
          </button>
        </div>

        <div style={s.footer}>
          <button
            type="button"
            style={s.cancelBtn}
            onClick={() => navigate('/admin/env-checklists')}
          >
            Cancel
          </button>
          <button type="submit" style={s.saveBtn} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isNew ? 'Create Checklist' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
