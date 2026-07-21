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

const PRIORITY_COLORS = {
  low:    { bg: '#e8f5e9', text: '#2e7d32' },
  medium: { bg: '#fff8e1', text: '#f57f17' },
  high:   { bg: '#fce4ec', text: '#c62828' },
}

function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || { bg: colors.surfaceLow, text: colors.midGrey }
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, fontFamily: fonts.body }}>
      {priority}
    </span>
  )
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
const SELECT = { ...INPUT, cursor: 'pointer' }

export default function VMPage() {
  const [tab, setTab] = useState('templates')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState(null)
  const qc = useQueryClient()

  const emptyTForm = { title: '', description: '', zone_name: '', planogram_url: '', instructions: '' }

  // ── Templates ──
  const [tForm, setTForm] = useState(emptyTForm)
  const [tErrors, setTErrors] = useState({})

  const { data: rawTemplates, isLoading: loadingTemplates, error: errTemplates } = useQuery({
    queryKey: ['vm-templates'],
    queryFn: () => client.get('/vm/templates'),
  })
  const templates = Array.isArray(getData(rawTemplates)) ? getData(rawTemplates) : []

  const createTemplate = useMutation({
    mutationFn: (payload) => client.post('/vm/templates', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vm-templates'] }); setShowTemplateModal(false); setTForm(emptyTForm) },
  })

  const updateTemplate = useMutation({
    mutationFn: ({ id, payload }) => client.put(`/vm/templates/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vm-templates'] }); setEditingTemplate(null); setTForm(emptyTForm) },
  })

  const deleteTemplate = async (t) => {
    if (!window.confirm(`Delete template "${t.title}"? This cannot be undone.`)) return
    setDeletingTemplateId(t.id)
    try {
      await client.delete(`/vm/templates/${t.id}`)
      qc.invalidateQueries({ queryKey: ['vm-templates'] })
    } catch { alert('Failed to delete template.') }
    finally { setDeletingTemplateId(null) }
  }

  function openEditTemplate(t) {
    setTForm({ title: t.title || '', description: t.description || '', zone_name: t.zone_name || '', planogram_url: t.planogram_url || '', instructions: t.instructions || '' })
    setEditingTemplate(t)
  }

  function submitTemplate(e) {
    e.preventDefault()
    const errs = {}
    if (!tForm.title.trim()) errs.title = 'Required'
    if (Object.keys(errs).length) { setTErrors(errs); return }
    setTErrors({})
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, payload: tForm })
    } else {
      createTemplate.mutate(tForm)
    }
  }

  // ── Tasks ──
  const [taskForm, setTaskForm] = useState({ title: '', store_id: '', template_id: '', assigned_to: '', due_date: '', priority: 'medium' })
  const [taskErrors, setTaskErrors] = useState({})

  const { data: rawTasks, isLoading: loadingTasks, error: errTasks } = useQuery({
    queryKey: ['vm-tasks'],
    queryFn: () => client.get('/vm/tasks'),
    enabled: tab === 'tasks',
  })
  const tasks = Array.isArray(getData(rawTasks)) ? getData(rawTasks) : []

  const { data: rawStores } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => client.get('/stores'),
    enabled: showTaskModal,
  })
  const stores = Array.isArray(getData(rawStores)) ? getData(rawStores) : []

  const { data: rawUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => client.get('/users'),
    enabled: showTaskModal,
  })
  const users = Array.isArray(getData(rawUsers)) ? getData(rawUsers) : []

  const createTask = useMutation({
    mutationFn: (payload) => client.post('/vm/tasks', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vm-tasks'] }); setShowTaskModal(false); setTaskForm({ title: '', store_id: '', template_id: '', assigned_to: '', due_date: '', priority: 'medium' }) },
  })

  function submitTask(e) {
    e.preventDefault()
    const errs = {}
    if (!taskForm.title.trim()) errs.title = 'Required'
    if (Object.keys(errs).length) { setTaskErrors(errs); return }
    setTaskErrors({})
    createTask.mutate(taskForm)
  }

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
    chip: { background: colors.primaryBg, color: colors.primary, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, fontFamily: fonts.body },
    table: { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td: { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    empty: { textAlign: 'center', padding: '72px 0', color: colors.lightGrey, fontSize: 14 },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    errorText: { color: colors.error, fontSize: 13, padding: '16px 0' },
    editBtn: { padding: '6px 14px', background: colors.primaryBg, color: colors.primary, border: `1.5px solid ${colors.primary}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    deleteBtn: { padding: '6px 12px', background: 'transparent', color: colors.error || '#EF4444', border: `1.5px solid ${colors.error || '#EF4444'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    cardFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
    modalTitle: { fontSize: 17, fontWeight: 800, color: colors.dark, marginBottom: 24 },
    modalActions: { display: 'flex', gap: 10, marginTop: 8 },
    submitBtn: { padding: '9px 22px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    cancelBtn: { padding: '9px 22px', background: colors.white, color: colors.midGrey, border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  }

  const taskStatusMap = { pending: 'inactive', in_progress: 'warning', completed: 'active', cancelled: 'error' }

  return (
    <div style={s.page}>
      <PageHeader
        title="Visual Merchandising"
        onBack={false}
        actions={
          tab === 'templates'
            ? <button style={s.createBtn} onClick={() => setShowTemplateModal(true)}>+ New Template</button>
            : <button style={s.createBtn} onClick={() => setShowTaskModal(true)}>+ New Task</button>
        }
      />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'templates')} onClick={() => setTab('templates')}>Templates</button>
        <button style={TAB_STYLE(tab === 'tasks')} onClick={() => setTab('tasks')}>Tasks</button>
      </div>

      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <>
          {loadingTemplates && <div style={s.loadText}>Loading templates…</div>}
          {errTemplates && <div style={s.errorText}>Failed to load templates.</div>}
          {!loadingTemplates && !errTemplates && templates.length === 0 && (
            <div style={s.empty}>No VM templates yet.<br />Click <strong>+ New Template</strong> to create one.</div>
          )}
          {templates.length > 0 && (
            <div style={s.grid}>
              {templates.map((t) => (
                <div key={t.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.name}>{t.title}</div>
                    <Badge status={t.is_active ? 'active' : 'inactive'} label={t.is_active ? 'Active' : 'Inactive'} />
                  </div>
                  {t.zone_name && <span style={s.chip}>{t.zone_name}</span>}
                  {t.description && <div style={s.meta}>{t.description}</div>}
                  {t.instructions && (
                    <div style={{ fontSize: 12, color: colors.midGrey, borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
                      <strong style={{ color: colors.dark }}>Instructions:</strong> {t.instructions}
                    </div>
                  )}
                  {t.planogram_url && (
                    <a href={t.planogram_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: colors.primary }}>View Planogram →</a>
                  )}
                  <div style={s.cardFooter}>
                    <button style={s.deleteBtn} disabled={deletingTemplateId === t.id} onClick={() => deleteTemplate(t)}>
                      {deletingTemplateId === t.id ? '…' : 'Delete'}
                    </button>
                    <button style={s.editBtn} onClick={() => openEditTemplate(t)}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tasks Tab ── */}
      {tab === 'tasks' && (
        <>
          {loadingTasks && <div style={s.loadText}>Loading tasks…</div>}
          {errTasks && <div style={s.errorText}>Failed to load tasks.</div>}
          {!loadingTasks && !errTasks && tasks.length === 0 && (
            <div style={s.empty}>No VM tasks yet.<br />Click <strong>+ New Task</strong> to create one.</div>
          )}
          {tasks.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Title</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Template</th>
                    <th style={s.th}>Assigned To</th>
                    <th style={s.th}>Priority</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{t.title}</td>
                      <td style={s.td}>{t.store_name || t.store_id || '—'}</td>
                      <td style={s.td}>{t.template_title || t.template_id || '—'}</td>
                      <td style={s.td}>{t.assigned_to_name || t.assigned_to || '—'}</td>
                      <td style={s.td}><PriorityBadge priority={t.priority} /></td>
                      <td style={s.td}>
                        <Badge status={taskStatusMap[t.status] || 'inactive'} label={t.status || '—'} />
                      </td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12, color: colors.midGrey }}>
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── New / Edit Template Modal ── */}
      {(showTemplateModal || editingTemplate) && (
        <div style={OVERLAY} onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); setTForm(emptyTForm) }}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>{editingTemplate ? 'Edit VM Template' : 'New VM Template'}</div>
            {(createTemplate.isError || updateTemplate.isError) && (
              <div style={{ background: colors.errorBg, color: colors.error, borderRadius: 8, padding: '9px 14px', fontSize: 12, marginBottom: 16 }}>
                Failed to {editingTemplate ? 'update' : 'create'} template.
              </div>
            )}
            <form onSubmit={submitTemplate}>
              <FormField label="Title *" error={tErrors.title}>
                <input style={{ ...INPUT, ...(tErrors.title ? { borderColor: colors.error } : {}) }} value={tForm.title} onChange={(e) => setTForm((f) => ({ ...f, title: e.target.value }))} placeholder="Template title" />
              </FormField>
              <FormField label="Description">
                <textarea style={TEXTAREA} value={tForm.description} onChange={(e) => setTForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe this VM template" />
              </FormField>
              <FormField label="Zone Name">
                <input style={INPUT} value={tForm.zone_name} onChange={(e) => setTForm((f) => ({ ...f, zone_name: e.target.value }))} placeholder="e.g. Window Display, Counter" />
              </FormField>
              <FormField label="Planogram URL">
                <input style={INPUT} value={tForm.planogram_url} onChange={(e) => setTForm((f) => ({ ...f, planogram_url: e.target.value }))} placeholder="https://..." />
              </FormField>
              <FormField label="Instructions">
                <textarea style={TEXTAREA} value={tForm.instructions} onChange={(e) => setTForm((f) => ({ ...f, instructions: e.target.value }))} placeholder="Step-by-step instructions" />
              </FormField>
              <div style={s.modalActions}>
                <button type="submit" style={s.submitBtn} disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {(createTemplate.isPending || updateTemplate.isPending) ? 'Saving…' : editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
                <button type="button" style={s.cancelBtn} onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); setTForm(emptyTForm) }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Task Modal ── */}
      {showTaskModal && (
        <div style={OVERLAY} onClick={() => setShowTaskModal(false)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>New VM Task</div>
            {createTask.isError && (
              <div style={{ background: colors.errorBg, color: colors.error, borderRadius: 8, padding: '9px 14px', fontSize: 12, marginBottom: 16 }}>
                Failed to create task.
              </div>
            )}
            <form onSubmit={submitTask}>
              <FormField label="Title *" error={taskErrors.title}>
                <input style={{ ...INPUT, ...(taskErrors.title ? { borderColor: colors.error } : {}) }} value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" />
              </FormField>
              <FormField label="Store">
                <select style={SELECT} value={taskForm.store_id} onChange={(e) => setTaskForm((f) => ({ ...f, store_id: e.target.value }))}>
                  <option value="">— Select Store —</option>
                  {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </FormField>
              <FormField label="Template">
                <select style={SELECT} value={taskForm.template_id} onChange={(e) => setTaskForm((f) => ({ ...f, template_id: e.target.value }))}>
                  <option value="">— Select Template —</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </FormField>
              <FormField label="Assigned To">
                <select style={SELECT} value={taskForm.assigned_to} onChange={(e) => setTaskForm((f) => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">— Select User —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </FormField>
              <FormField label="Due Date">
                <input type="date" style={INPUT} value={taskForm.due_date} onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))} />
              </FormField>
              <FormField label="Priority">
                <select style={SELECT} value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </FormField>
              <div style={s.modalActions}>
                <button type="submit" style={s.submitBtn} disabled={createTask.isPending}>
                  {createTask.isPending ? 'Creating…' : 'Create Task'}
                </button>
                <button type="button" style={s.cancelBtn} onClick={() => setShowTaskModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
