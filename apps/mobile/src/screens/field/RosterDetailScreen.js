import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  : '--';

const SHIFT_DOT = { morning: colors.primary, evening: '#F59E0B', off: colors.lightGrey };

// ─── Add Shift Modal ──────────────────────────────────────────────────────────

function AddShiftModal({ visible, onClose, onSave, storeStaff, isPending, error }) {
  const [form, setForm] = useState({
    user_id: '', date: '', start_time: '', end_time: '', role_label: '', zone: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => onSave(form);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <ScrollView contentContainerStyle={s.sheet}>
          <Text style={s.sheetTitle}>Add Shift</Text>

          <Text style={s.lbl}>Staff Member</Text>
          <View style={s.pickerWrap}>
            {storeStaff.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[s.staffChip, form.user_id === u.id && s.staffChipActive]}
                onPress={() => set('user_id', u.id)}>
                <Text style={[s.staffChipText, form.user_id === u.id && s.staffChipTextActive]}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.lbl}>Date (YYYY-MM-DD)</Text>
          <TextInput style={s.input} placeholder="2026-06-16"
            onChangeText={v => set('date', v)}
            onChange={e => set('date', e.nativeEvent?.text ?? e.target?.value ?? form.date)} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.lbl}>Start Time</Text>
              <TextInput style={s.input} placeholder="09:00"
                onChangeText={v => set('start_time', v)}
                onChange={e => set('start_time', e.nativeEvent?.text ?? e.target?.value ?? form.start_time)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lbl}>End Time</Text>
              <TextInput style={s.input} placeholder="18:00"
                onChangeText={v => set('end_time', v)}
                onChange={e => set('end_time', e.nativeEvent?.text ?? e.target?.value ?? form.end_time)} />
            </View>
          </View>

          <Text style={s.lbl}>Role / Position</Text>
          <TextInput style={s.input} placeholder="e.g. Cashier, Floor Staff"
            onChangeText={v => set('role_label', v)}
            onChange={e => set('role_label', e.nativeEvent?.text ?? e.target?.value ?? form.role_label)} />

          <Text style={s.lbl}>Zone (optional)</Text>
          <TextInput style={s.input} placeholder="e.g. Ground Floor"
            onChangeText={v => set('zone', v)}
            onChange={e => set('zone', e.nativeEvent?.text ?? e.target?.value ?? form.zone)} />

          {!!error && <Text style={s.errorText}>⚠ {error}</Text>}

          <View style={s.btns}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={isPending}>
              {isPending
                ? <ActivityIndicator color={colors.white} />
                : <Text style={s.saveText}>Add Shift</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RosterDetailScreen({ route, navigation }) {
  const rosterId = route.params?.roster?.id;
  const qc = useQueryClient();

  const [showAddShift, setShowAddShift] = useState(false);
  const [shiftError, setShiftError]     = useState('');

  const { data: roster, isLoading } = useQuery({
    queryKey: ['roster', rosterId],
    queryFn: () => client.get(`/field/rosters/${rosterId}`).then(r => r.data),
    enabled: !!rosterId,
  });

  const { data: storeStaffRaw } = useQuery({
    queryKey: ['my-store-staff'],
    queryFn: () => client.get('/field/my-store/staff').then(r => r.data),
  });
  const storeStaff = Array.isArray(storeStaffRaw) ? storeStaffRaw : [];

  const addShift = useMutation({
    mutationFn: (payload) => client.post('/field/shifts', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roster', rosterId] });
      setShowAddShift(false);
      setShiftError('');
    },
    onError: (err) => setShiftError(err.response?.data?.error || 'Failed to add shift'),
  });

  const deleteShift = useMutation({
    mutationFn: (shiftId) => client.delete(`/field/shifts/${shiftId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roster', rosterId] }),
  });

  const publishRoster = useMutation({
    mutationFn: () => client.post(`/field/rosters/${rosterId}/publish`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roster', rosterId] });
      qc.invalidateQueries({ queryKey: ['rosters'] });
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed to publish'),
  });

  const handleAddShift = (form) => {
    setShiftError('');
    if (!form.user_id || !form.date || !form.start_time || !form.end_time) {
      setShiftError('Staff, date, start time and end time are required.');
      return;
    }
    addShift.mutate({
      roster_id:  rosterId,
      store_id:   roster?.store_id,
      user_id:    form.user_id,
      date:       form.date,
      start_time: form.start_time,
      end_time:   form.end_time,
      role_label: form.role_label || null,
      zone:       form.zone || null,
    });
  };

  const confirmDelete = (shift) => {
    Alert.alert('Delete Shift', `Remove ${shift.user_name || 'this shift'} on ${fmtDate(shift.date)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteShift.mutate(shift.id) },
    ]);
  };

  const shifts   = roster?.shifts || [];
  const isDraft  = !roster?.status || roster.status === 'draft';
  const morning  = shifts.filter(s => s.start_time && parseInt(s.start_time) < 14).length;
  const evening  = shifts.filter(s => s.start_time && parseInt(s.start_time) >= 14).length;
  const totalHrs = shifts.reduce((sum, s) => {
    if (!s.start_time || !s.end_time) return sum;
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader
        title={roster?.name || 'Roster Detail'}
        subtitle={roster?.store_name || ''}
        onBack={() => navigation.goBack()}
        rightAction={isDraft ? { label: '+ Shift', onPress: () => setShowAddShift(true) } : null}
      />

      <AddShiftModal
        visible={showAddShift}
        onClose={() => { setShowAddShift(false); setShiftError(''); }}
        onSave={handleAddShift}
        storeStaff={storeStaff}
        isPending={addShift.isPending}
        error={shiftError}
      />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Status banner */}
          <View style={[s.statusBanner, !isDraft && s.statusBannerPublished]}>
            <Text style={s.statusText}>
              {isDraft ? '📝 Draft — not visible to staff yet' : '✅ Published — staff can see their shifts'}
            </Text>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: colors.primary }]}>{morning}</Text>
              <Text style={s.statLabel}>Morning</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: '#F59E0B' }]}>{evening}</Text>
              <Text style={s.statLabel}>Evening</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: colors.dark }]}>{shifts.length}</Text>
              <Text style={s.statLabel}>Total Shifts</Text>
            </View>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: colors.dark }]}>{totalHrs.toFixed(0)}h</Text>
              <Text style={s.statLabel}>Total Hrs</Text>
            </View>
          </View>

          {/* Shifts */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Shifts ({shifts.length})</Text>
            {isDraft && (
              <TouchableOpacity onPress={() => setShowAddShift(true)}>
                <Text style={s.addLink}>+ Add Shift</Text>
              </TouchableOpacity>
            )}
          </View>

          {shifts.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>No shifts yet. Tap "+ Shift" to add one.</Text>
            </View>
          )}

          {shifts.map((shift, i) => {
            const isM = shift.start_time && parseInt(shift.start_time) < 14;
            return (
              <View key={shift.id ?? i} style={s.shiftRow}>
                <View style={[s.dot, { backgroundColor: isM ? colors.primary : '#F59E0B' }]} />
                <View style={s.shiftInfo}>
                  <Text style={s.shiftName}>{shift.user_name || '—'}</Text>
                  <Text style={s.shiftMeta}>
                    {fmtDate(shift.date)}
                    {shift.role_label ? `  ·  ${shift.role_label}` : ''}
                    {shift.zone ? `  ·  ${shift.zone}` : ''}
                  </Text>
                </View>
                <Text style={s.shiftTime}>
                  {shift.start_time || '--'} – {shift.end_time || '--'}
                </Text>
                {isDraft && (
                  <TouchableOpacity onPress={() => confirmDelete(shift)} style={s.delBtn}>
                    <Text style={s.delIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* Publish button */}
          {isDraft && shifts.length > 0 && (
            <TouchableOpacity
              style={s.publishBtn}
              onPress={() => publishRoster.mutate()}
              disabled={publishRoster.isPending}>
              {publishRoster.isPending
                ? <ActivityIndicator color={colors.white} />
                : <Text style={s.publishText}>🚀 Publish Roster — Notify Staff</Text>}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { padding: 16, paddingBottom: 40 },

  statusBanner:   { backgroundColor: '#FEF9C3', borderRadius: radius.md, padding: 12,
                    marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  statusBannerPublished: { backgroundColor: '#DCFCE7', borderLeftColor: colors.primary },
  statusText:     { fontSize: typography.sm, color: colors.darkGrey, fontWeight: '600' },

  statsRow:       { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md,
                    padding: 16, marginBottom: 16, ...shadow.sm },
  statItem:       { flex: 1, alignItems: 'center' },
  statVal:        { fontSize: typography.xl, fontWeight: '800' },
  statLabel:      { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },

  sectionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:   { fontSize: typography.md, fontWeight: '700', color: colors.darkGrey },
  addLink:        { fontSize: typography.sm, color: colors.primary, fontWeight: '700' },

  emptyBox:       { backgroundColor: colors.white, borderRadius: radius.md, padding: 20,
                    alignItems: 'center', marginBottom: 12, ...shadow.sm },
  emptyText:      { fontSize: typography.sm, color: colors.midGrey },

  shiftRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                    borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow.sm },
  dot:            { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  shiftInfo:      { flex: 1 },
  shiftName:      { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  shiftMeta:      { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  shiftTime:      { fontSize: typography.sm, fontWeight: '600', color: colors.darkGrey, marginRight: 8 },
  delBtn:         { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEE2E2',
                    alignItems: 'center', justifyContent: 'center' },
  delIcon:        { fontSize: 12, color: colors.error, fontWeight: '700' },

  publishBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, padding: 16,
                    alignItems: 'center', marginTop: 16, ...shadow.green },
  publishText:    { color: colors.white, fontSize: typography.md, fontWeight: '800' },

  // Modal
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    padding: 24, paddingBottom: 40 },
  sheetTitle:     { fontSize: typography.lg, fontWeight: '800', color: colors.dark, marginBottom: 20 },
  lbl:            { fontSize: 11, fontWeight: '700', color: colors.darkGrey, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: 0.6 },
  input:          { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1.5,
                    borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: typography.md, color: colors.dark, marginBottom: 16 },
  pickerWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  staffChip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
                    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border },
  staffChipActive:{ backgroundColor: colors.primary, borderColor: colors.primary },
  staffChipText:  { fontSize: typography.sm, color: colors.darkGrey, fontWeight: '600' },
  staffChipTextActive: { color: colors.white },
  errorText:      { color: colors.error, fontSize: typography.sm, marginBottom: 12 },
  btns:           { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:      { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                    paddingVertical: 13, alignItems: 'center' },
  cancelText:     { fontSize: typography.md, fontWeight: '700', color: colors.darkGrey },
  saveBtn:        { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
                    paddingVertical: 13, alignItems: 'center' },
  saveText:       { fontSize: typography.md, fontWeight: '700', color: colors.white },
});
