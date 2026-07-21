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
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  background: 'none', border: 'none', fontFamily: fonts.body,
})

const OVERLAY = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const MODAL = { background: colors.white, borderRadius: 14, padding: '32px 36px', boxShadow: shadow.lg || shadow.sm, width: 500, maxHeight: '90vh', overflowY: 'auto' }
const INPUT = { width: '100%', padding: '9px 13px', borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, color: colors.dark, background: colors.white, outline: 'none', boxSizing: 'border-box' }
const SELECT = { ...INPUT, cursor: 'pointer' }

export default function RosterPage() {
  const [tab, setTab] = useState('rosters')
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [copyRosterTarget, setCopyRosterTarget] = useState(null)
  const [copyStoreIds, setCopyStoreIds] = useState([])
  const [selectedRoster, setSelectedRoster] = useState(null)
  const qc = useQueryClient()

  const emptyRoster = { name: '', store_id: '', start_date: '', end_date: '' }
  const [rForm, setRForm] = useState(emptyRoster)

  const emptyShift = { roster_id: '', store_id: '', user_id: '', shift_start: '', shift_end: '', start_time: '', end_time: '', role_label: '', zone: '' }
  const [sForm, setSForm] = useState(emptyShift)

  const { data: rawRosters, isLoading: loadingRosters } = useQuery({
    queryKey: ['rosters'],
    queryFn: () => client.get('/field/rosters'),
  })
  const rosters = Array.isArray(getData(rawRosters)) ? getData(rawRosters) : []

  const { data: rawStores } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => client.get('/stores'),
  })
  const stores = Array.isArray(getData(rawStores)) ? getData(rawStores) : []

  const { data: rawUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => client.get('/users'),
  })
  const users = Array.isArray(getData(rawUsers)) ? getData(rawUsers) : []

  const { data: rawShifts, isLoading: loadingShifts } = useQuery({
    queryKey: ['shifts', selectedRoster?.id],
    queryFn: () => client.get(`/field/rosters/${selectedRoster.id}`),
    enabled: !!selectedRoster,
  })
  const rosterDetail = getData(rawShifts)
  const shifts = Array.isArray(rosterDetail?.shifts) ? rosterDetail.shifts : []

  const createRoster = useMutation({
    mutationFn: (p) => client.post('/field/rosters', p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rosters'] }); setShowRosterModal(false); setRForm(emptyRoster) },
    onError: () => alert('Failed to create roster.'),
  })

  const publishRoster = useMutation({
    mutationFn: (id) => client.post(`/field/rosters/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rosters'] }),
    onError: () => alert('Failed to publish roster.'),
  })

  const createShift = useMutation({
    mutationFn: async (p) => {
      // Generate one shift per day in the date range
      const start = new Date(p.shift_start)
      const end = new Date(p.shift_end)
      const days = []
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(d.toISOString().slice(0, 10))
      }
      for (const date of days) {
        await client.post('/field/shifts', {
          roster_id: p.roster_id, store_id: selectedRoster?.store_id,
          user_id: p.user_id, date,
          start_time: p.start_time, end_time: p.end_time,
          role_label: p.role_label, zone: p.zone,
        })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shifts', selectedRoster?.id] }); setShowShiftModal(false); setSForm(emptyShift) },
    onError: () => alert('Failed to create shift.'),
  })

  const copyRoster = useMutation({
    mutationFn: ({ id, store_ids }) => client.post(`/field/rosters/${id}/copy`, { store_ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rosters'] }); setShowCopyModal(false); setCopyStoreIds([]) },
    onError: () => alert('Failed to copy roster.'),
  })

  const deleteShift = async (id) => {
    if (!window.confirm('Delete this shift?')) return
    try {
      await client.delete(`/field/shifts/${id}`)
      qc.invalidateQueries({ queryKey: ['shifts', selectedRoster?.id] })
    } catch { alert('Failed to delete shift.') }
  }

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    tabBar: { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24 },
    createBtn: { padding: '9px 18px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    card: { background: colors.white, borderRadius: 12, padding: '20px 24px', boxShadow: shadow.sm, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 10 },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark },
    meta: { fontSize: 12, color: colors.midGrey },
    cardFooter: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' },
    viewBtn: { padding: '6px 14px', background: colors.primaryBg, color: colors.primary, border: `1.5px solid ${colors.primary}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    copyBtn: { padding: '6px 12px', background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #1D4ED8', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    publishBtn: { padding: '6px 14px', background: colors.successBg || '#D1FAE5', color: colors.success || '#10B981', border: `1.5px solid ${colors.success || '#10B981'}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    backBtn: { padding: '7px 16px', background: colors.white, color: colors.midGrey, border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20 },
    table: { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td: { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    empty: { textAlign: 'center', padding: '72px 0', color: colors.lightGrey, fontSize: 14 },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    label: { display: 'block', fontSize: 11, fontWeight: 700, color: colors.dark, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' },
    fieldGroup: { marginBottom: 16 },
    modalTitle: { fontSize: 17, fontWeight: 800, color: colors.dark, marginBottom: 24 },
    modalActions: { display: 'flex', gap: 10, marginTop: 8 },
    submitBtn: { padding: '9px 22px', background: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    cancelBtn: { padding: '9px 22px', background: colors.white, color: colors.midGrey, border: `1.5px solid ${colors.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    deleteBtn: { padding: '5px 10px', background: 'transparent', color: colors.error || '#EF4444', border: `1px solid ${colors.error || '#EF4444'}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Roster Management"
        subtitle="Create and manage staff rosters and shifts"
        onBack={false}
        actions={
          selectedRoster
            ? <button style={s.createBtn} onClick={() => { setSForm({ ...emptyShift, roster_id: selectedRoster.id, store_id: selectedRoster.store_id }); setShowShiftModal(true) }}>+ Add Shift</button>
            : tab === 'rosters' && <button style={s.createBtn} onClick={() => setShowRosterModal(true)}>+ New Roster</button>
        }
      />

      {!selectedRoster && (
        <div style={s.tabBar}>
          <button style={TAB_STYLE(tab === 'rosters')} onClick={() => setTab('rosters')}>Rosters</button>
        </div>
      )}

      {/* Roster List */}
      {!selectedRoster && (
        <>
          {loadingRosters && <div style={s.loadText}>Loading rosters…</div>}
          {!loadingRosters && rosters.length === 0 && (
            <div style={s.empty}>No rosters yet.<br />Click <strong>+ New Roster</strong> to create one.</div>
          )}
          {rosters.length > 0 && (
            <div style={s.grid}>
              {rosters.map((r) => (
                <div key={r.id} style={s.card}>
                  <div style={s.cardTop}>
                    <div style={s.name}>{r.name}</div>
                    <Badge status={r.status === 'published' ? 'active' : 'inactive'} label={r.status || 'draft'} />
                  </div>
                  {r.store_name && <div style={s.meta}>📍 {r.store_name}</div>}
                  {r.start_date && <div style={s.meta}>{new Date(r.start_date).toLocaleDateString()} → {r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}</div>}
                  {r.shift_count != null && <div style={s.meta}>{r.shift_count} shifts</div>}
                  <div style={s.cardFooter}>
                    {r.status !== 'published' && (
                      <button style={s.publishBtn} onClick={() => publishRoster.mutate(r.id)}>Publish</button>
                    )}
                    <button style={s.copyBtn} onClick={() => { setCopyRosterTarget(r); setCopyStoreIds([]); setShowCopyModal(true) }}>Copy to Stores</button>
                    <button style={s.viewBtn} onClick={() => setSelectedRoster(r)}>View Shifts</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Roster Detail — Shifts */}
      {selectedRoster && (
        <>
          <button style={s.backBtn} onClick={() => setSelectedRoster(null)}>← Back to Rosters</button>
          <div style={{ marginBottom: 16, fontSize: 15, fontWeight: 700, color: colors.dark }}>
            {selectedRoster.name} — Shifts
          </div>
          {loadingShifts && <div style={s.loadText}>Loading shifts…</div>}
          {!loadingShifts && shifts.length === 0 && (
            <div style={s.empty}>No shifts yet.<br />Click <strong>+ Add Shift</strong> to add one.</div>
          )}
          {shifts.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Staff</th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Start</th>
                    <th style={s.th}>End</th>
                    <th style={s.th}>Role</th>
                    <th style={s.th}>Zone</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((sh) => (
                    <tr key={sh.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{sh.user_name || '—'}</td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                        {sh.date ? new Date(sh.date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>{sh.start_time || '—'}</td>
                      <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>{sh.end_time || '—'}</td>
                      <td style={s.td}>{sh.role || '—'}</td>
                      <td style={s.td}>{sh.zone || '—'}</td>
                      <td style={s.td}>
                        <button style={s.deleteBtn} onClick={() => deleteShift(sh.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* New Roster Modal */}
      {showRosterModal && (
        <div style={OVERLAY} onClick={() => setShowRosterModal(false)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>New Roster</div>
            <form onSubmit={(e) => { e.preventDefault(); if (!rForm.name.trim()) return; createRoster.mutate(rForm) }}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Roster Name *</label>
                <input style={INPUT} value={rForm.name} onChange={(e) => setRForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Week 30 Roster" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Store</label>
                <select style={SELECT} value={rForm.store_id} onChange={(e) => setRForm(f => ({ ...f, store_id: e.target.value }))}>
                  <option value="">— Select Store —</option>
                  {stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={s.label}>Start Date *</label>
                  <input type="date" style={INPUT} value={rForm.start_date} onChange={(e) => setRForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>End Date *</label>
                  <input type="date" style={INPUT} value={rForm.end_date} onChange={(e) => setRForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div style={s.modalActions}>
                <button type="submit" style={s.submitBtn} disabled={createRoster.isPending}>
                  {createRoster.isPending ? 'Creating…' : 'Create Roster'}
                </button>
                <button type="button" style={s.cancelBtn} onClick={() => setShowRosterModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Shift Modal */}
      {showShiftModal && (
        <div style={OVERLAY} onClick={() => setShowShiftModal(false)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>Add Shift</div>
            <form onSubmit={(e) => { e.preventDefault(); createShift.mutate(sForm) }}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Staff Member</label>
                <select style={SELECT} value={sForm.user_id} onChange={(e) => setSForm(f => ({ ...f, user_id: e.target.value }))}>
                  <option value="">— Select Staff —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={s.label}>From Date *</label>
                  <input type="date" style={INPUT} value={sForm.shift_start}
                    min={selectedRoster?.start_date} max={selectedRoster?.end_date}
                    onChange={(e) => setSForm(f => ({ ...f, shift_start: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>To Date *</label>
                  <input type="date" style={INPUT} value={sForm.shift_end}
                    min={selectedRoster?.start_date} max={selectedRoster?.end_date}
                    onChange={(e) => setSForm(f => ({ ...f, shift_end: e.target.value }))} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: colors.midGrey, marginBottom: 14, marginTop: -10 }}>
                Roster period: {selectedRoster?.start_date} → {selectedRoster?.end_date}. A shift will be created for each day in this range.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={s.label}>Start Time</label>
                  <input type="time" style={INPUT} value={sForm.start_time} onChange={(e) => setSForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>End Time</label>
                  <input type="time" style={INPUT} value={sForm.end_time} onChange={(e) => setSForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Role</label>
                <input style={INPUT} value={sForm.role_label} onChange={(e) => setSForm(f => ({ ...f, role_label: e.target.value }))} placeholder="e.g. Sales Associate" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Zone</label>
                <input style={INPUT} value={sForm.zone} onChange={(e) => setSForm(f => ({ ...f, zone: e.target.value }))} placeholder="e.g. Ground Floor" />
              </div>
              <div style={s.modalActions}>
                <button type="submit" style={s.submitBtn} disabled={createShift.isPending}>
                  {createShift.isPending ? 'Adding…' : 'Add Shift'}
                </button>
                <button type="button" style={s.cancelBtn} onClick={() => setShowShiftModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Roster Modal */}
      {showCopyModal && copyRosterTarget && (
        <div style={OVERLAY} onClick={() => setShowCopyModal(false)}>
          <div style={MODAL} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalTitle}>Copy "{copyRosterTarget.name}" to Stores</div>
            <div style={{ fontSize: 12, color: colors.midGrey, marginBottom: 16 }}>
              Select one or more stores to copy this roster (with all its shifts) to:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 240, overflowY: 'auto' }}>
              {stores.filter(st => st.id !== copyRosterTarget.store_id).map(st => (
                <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: copyStoreIds.includes(st.id) ? colors.primaryBg : colors.surfaceLow || '#F9FAFB', border: `1.5px solid ${copyStoreIds.includes(st.id) ? colors.primary : colors.border}` }}>
                  <input type="checkbox" checked={copyStoreIds.includes(st.id)}
                    onChange={(e) => setCopyStoreIds(prev => e.target.checked ? [...prev, st.id] : prev.filter(id => id !== st.id))}
                  />
                  {st.name}
                </label>
              ))}
            </div>
            <div style={s.modalActions}>
              <button
                style={s.submitBtn}
                disabled={copyStoreIds.length === 0 || copyRoster.isPending}
                onClick={() => copyRoster.mutate({ id: copyRosterTarget.id, store_ids: copyStoreIds })}
              >
                {copyRoster.isPending ? 'Copying…' : `Copy to ${copyStoreIds.length} Store${copyStoreIds.length !== 1 ? 's' : ''}`}
              </button>
              <button style={s.cancelBtn} onClick={() => setShowCopyModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
