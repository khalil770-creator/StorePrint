import React, { useState } from 'react'
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
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
  background: 'none', border: 'none', fontFamily: fonts.body,
})

function StatusDot({ present }) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: present ? colors.success || '#10B981' : colors.error || '#EF4444',
      marginRight: 6,
    }} />
  )
}

export default function FieldAttendancePage() {
  const [tab, setTab] = useState('live')

  const { data: rawLive, isLoading: loadingLive } = useQuery({
    queryKey: ['field-live'],
    queryFn: () => client.get('/field/live-presence'),
    enabled: tab === 'live',
    refetchInterval: 30000,
  })
  const liveData = Array.isArray(getData(rawLive)) ? getData(rawLive) : []

  const { data: rawStores } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => client.get('/stores'),
  })
  const stores = Array.isArray(getData(rawStores)) ? getData(rawStores) : []

  const [selectedStore, setSelectedStore] = useState('')

  const { data: rawAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['field-attendance', selectedStore],
    queryFn: () => client.get(`/field/attendance/store/${selectedStore}`),
    enabled: tab === 'log' && !!selectedStore,
  })
  const attendance = Array.isArray(getData(rawAttendance)) ? getData(rawAttendance) : []

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    tabBar: { display: 'flex', borderBottom: `1px solid ${colors.border}`, marginBottom: 24 },
    table: { width: '100%', borderCollapse: 'collapse', background: colors.white, borderRadius: 12, overflow: 'hidden', boxShadow: shadow.sm },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: colors.lightGrey, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${colors.border}`, background: colors.surfaceLow },
    td: { padding: '13px 16px', fontSize: 13, color: colors.dark, borderBottom: `1px solid ${colors.border}` },
    empty: { textAlign: 'center', padding: '72px 0', color: colors.lightGrey, fontSize: 14 },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
    select: { padding: '9px 13px', borderRadius: 8, border: `1.5px solid ${colors.border}`, fontSize: 13, fontFamily: fonts.body, color: colors.dark, background: colors.white, outline: 'none', marginBottom: 20, minWidth: 240 },
    statsRow: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
    statCard: { background: colors.white, borderRadius: 12, padding: '18px 24px', boxShadow: shadow.sm, border: `1px solid ${colors.border}`, minWidth: 140 },
    statNum: { fontSize: 28, fontWeight: 800, color: colors.dark },
    statLabel: { fontSize: 12, color: colors.midGrey, marginTop: 2 },
  }

  const presentCount = liveData.filter(r => r.is_present).length
  const absentCount = liveData.length - presentCount

  return (
    <div style={s.page}>
      <PageHeader title="Field Attendance" subtitle="Track staff presence across stores" onBack={false} />

      <div style={s.tabBar}>
        <button style={TAB_STYLE(tab === 'live')} onClick={() => setTab('live')}>Live Presence</button>
        <button style={TAB_STYLE(tab === 'log')} onClick={() => setTab('log')}>Attendance Log</button>
      </div>

      {/* Live Presence */}
      {tab === 'live' && (
        <>
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={{ ...s.statNum, color: colors.success || '#10B981' }}>{presentCount}</div>
              <div style={s.statLabel}>Currently Present</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statNum, color: colors.error || '#EF4444' }}>{absentCount}</div>
              <div style={s.statLabel}>Absent / Off</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statNum}>{liveData.length}</div>
              <div style={s.statLabel}>Total Staff</div>
            </div>
          </div>

          {loadingLive && <div style={s.loadText}>Loading live presence…</div>}
          {!loadingLive && liveData.length === 0 && (
            <div style={s.empty}>No live presence data available.</div>
          )}
          {liveData.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Staff</th>
                    <th style={s.th}>Store</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Clock In</th>
                    <th style={s.th}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {liveData.map((r, i) => {
                    const clockIn = r.clock_in ? new Date(r.clock_in) : null
                    const duration = clockIn ? Math.round((Date.now() - clockIn.getTime()) / 60000) : null
                    return (
                      <tr key={r.id || i}>
                        <td style={{ ...s.td, fontWeight: 600 }}>{r.user_name || r.name || '—'}</td>
                        <td style={s.td}>{r.store_name || '—'}</td>
                        <td style={s.td}>
                          <StatusDot present={r.is_present} />
                          {r.is_present ? 'Present' : 'Absent'}
                        </td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                          {clockIn ? clockIn.toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                          {duration != null ? `${duration} min` : '—'}
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

      {/* Attendance Log */}
      {tab === 'log' && (
        <>
          <select style={s.select} value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
            <option value="">— Select a Store —</option>
            {stores.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>

          {!selectedStore && <div style={s.empty}>Select a store to view attendance log.</div>}
          {selectedStore && loadingAttendance && <div style={s.loadText}>Loading attendance…</div>}
          {selectedStore && !loadingAttendance && attendance.length === 0 && (
            <div style={s.empty}>No attendance records for this store.</div>
          )}
          {attendance.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Staff</th>
                    <th style={s.th}>Date</th>
                    <th style={s.th}>Clock In</th>
                    <th style={s.th}>Clock Out</th>
                    <th style={s.th}>Duration</th>
                    <th style={s.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((r, i) => {
                    const inn = r.clock_in ? new Date(r.clock_in) : null
                    const out = r.clock_out ? new Date(r.clock_out) : null
                    const mins = inn && out ? Math.round((out - inn) / 60000) : null
                    return (
                      <tr key={r.id || i}>
                        <td style={{ ...s.td, fontWeight: 600 }}>{r.user_name || r.name || '—'}</td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                          {inn ? inn.toLocaleDateString() : '—'}
                        </td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                          {inn ? inn.toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                          {out ? out.toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ ...s.td, fontFamily: fonts.mono, fontSize: 12 }}>
                          {mins != null ? `${mins} min` : '—'}
                        </td>
                        <td style={s.td}>
                          <Badge
                            status={r.status === 'present' ? 'active' : r.status === 'late' ? 'warning' : 'inactive'}
                            label={r.status || '—'}
                          />
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
    </div>
  )
}
