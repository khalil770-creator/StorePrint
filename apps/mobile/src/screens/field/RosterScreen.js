import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  : '--';

const fmtDateShort = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  : '--';

// ─── My Shifts View (staff) ───────────────────────────────────────────────────

function MyShiftsView() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-shifts'],
    queryFn: () => client.get('/field/shifts', { params: { from: today } }).then(r => r.data),
  });
  const shifts = Array.isArray(data) ? data : [];

  const upcoming = shifts.filter(s => s.date >= today);
  const past     = shifts.filter(s => s.date < today);

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {upcoming.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>No upcoming shifts</Text>
          <Text style={s.emptyMsg}>Your manager hasn't published any shifts yet.</Text>
        </View>
      )}

      {upcoming.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Upcoming Shifts</Text>
          {upcoming.map((shift, i) => (
            <ShiftCard key={shift.id ?? i} shift={shift} upcoming />
          ))}
        </>
      )}

      {past.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Past Shifts</Text>
          {past.map((shift, i) => (
            <ShiftCard key={shift.id ?? i} shift={shift} />
          ))}
        </>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function ShiftCard({ shift, upcoming }) {
  const isM = shift.start_time && parseInt(shift.start_time) < 14;
  const dotColor = upcoming ? (isM ? colors.primary : '#F59E0B') : colors.lightGrey;
  return (
    <View style={[s.shiftCard, !upcoming && { opacity: 0.6 }]}>
      <View style={[s.shiftAccent, { backgroundColor: dotColor }]} />
      <View style={s.shiftCardBody}>
        <Text style={s.shiftCardDate}>{fmtDate(shift.date)}</Text>
        <Text style={s.shiftCardStore}>{shift.store_name || ''}</Text>
        {shift.role_label ? <Text style={s.shiftCardRole}>{shift.role_label}</Text> : null}
      </View>
      <View style={s.shiftCardRight}>
        <Text style={s.shiftCardTime}>{shift.start_time?.slice(0,5) || '--'}</Text>
        <Text style={s.shiftCardTimeSep}>–</Text>
        <Text style={s.shiftCardTime}>{shift.end_time?.slice(0,5) || '--'}</Text>
      </View>
    </View>
  );
}

// ─── Roster Management View (managers) ───────────────────────────────────────

function RosterManageView({ navigation, openCreateRef }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showModal, setShowModal]     = useState(false);
  React.useEffect(() => { openCreateRef.current = () => setShowModal(true); }, []);
  const [form, setForm]               = useState({ name: '', start_date: '', end_date: '' });
  const [formError, setFormError]     = useState('');
  const qc = useQueryClient();

  const { data: myStore } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => client.get('/field/my-store').then(r => r.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['rosters'],
    queryFn: () => client.get('/field/rosters').then(r => r.data),
  });
  const rosters = Array.isArray(data) ? data : [];

  const createRoster = useMutation({
    mutationFn: (payload) => client.post('/field/rosters', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rosters'] });
      setShowModal(false);
      setForm({ name: '', start_date: '', end_date: '' });
      setFormError('');
    },
    onError: (err) => setFormError(err.response?.data?.error || 'Failed to create roster'),
  });

  const handleCreate = () => {
    setFormError('');
    if (!form.name || !form.start_date || !form.end_date) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (!myStore?.id) {
      setFormError('No store assigned to your account.');
      return;
    }
    createRoster.mutate({ store_id: myStore.id, ...form });
  };

  return (
    <>
      {/* Day selector */}
      <View style={s.dayRow}>
        {DAYS.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={[s.dayBtn, selectedDay === i && s.dayBtnActive]}
            onPress={() => setSelectedDay(i)}>
            <Text style={[s.dayText, selectedDay === i && s.dayTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid header */}
      <View style={s.gridHeader}>
        <Text style={[s.gridCell, s.nameCell]}>Roster</Text>
        {DAYS.map(d => <Text key={d} style={[s.gridCell, s.shiftCell]}>{d}</Text>)}
      </View>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>New Roster</Text>
            <Text style={s.fieldLabel}>Roster Name</Text>
            <TextInput style={s.fieldInput} placeholder="e.g. Week 24 – Main Store"
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              onChange={e => setForm(f => ({ ...f, name: e.nativeEvent?.text ?? e.target?.value ?? f.name }))} />
            <Text style={s.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput style={s.fieldInput} placeholder="2026-06-16"
              onChangeText={v => setForm(f => ({ ...f, start_date: v }))}
              onChange={e => setForm(f => ({ ...f, start_date: e.nativeEvent?.text ?? e.target?.value ?? f.start_date }))}
              keyboardType="numbers-and-punctuation" />
            <Text style={s.fieldLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput style={s.fieldInput} placeholder="2026-06-22"
              onChangeText={v => setForm(f => ({ ...f, end_date: v }))}
              onChange={e => setForm(f => ({ ...f, end_date: e.nativeEvent?.text ?? e.target?.value ?? f.end_date }))}
              keyboardType="numbers-and-punctuation" />
            {!!formError && <Text style={s.formError}>⚠ {formError}</Text>}
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowModal(false); setFormError(''); }}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleCreate} disabled={createRoster.isPending}>
                {createRoster.isPending
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={s.saveText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rosters}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>No rosters yet</Text>
              <Text style={s.emptyMsg}>Tap "+ Roster" to create your first roster.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPublished = item.status === 'published';
            return (
              <TouchableOpacity
                style={s.rosterRow}
                onPress={() => navigation.navigate('RosterDetail', { roster: item })}
                activeOpacity={0.8}>
                <View style={s.nameCol}>
                  <Text style={s.rosterName}>{item.name || item.store_name || `Roster #${item.id}`}</Text>
                  <Text style={s.rosterMeta}>
                    {item.store_name}
                    {item.start_date ? `  ·  ${fmtDateShort(item.start_date)} – ${fmtDateShort(item.end_date)}` : ''}
                  </Text>
                </View>
                <View style={[s.statusBadge, isPublished && s.statusBadgePublished]}>
                  <Text style={[s.statusBadgeText, isPublished && s.statusBadgeTextPublished]}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </>
  );
}

// ─── Root Screen ──────────────────────────────────────────────────────────────

export default function RosterScreen({ navigation }) {
  const { user } = useAuthStore();
  const perms = user?.permissions;
  const openCreateRef = useRef(null);

  const isManager = !perms
    || Object.keys(perms).length === 0
    || perms['*']?.['*']
    || perms['admin']
    || perms['field']?.create;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader
        title={isManager ? 'Roster Management' : 'My Shifts'}
        subtitle={isManager ? 'Create and manage staff rosters' : 'Your upcoming schedule'}
        onBack={() => navigation.goBack()}
        rightAction={isManager ? { label: '+ Roster', onPress: () => openCreateRef.current?.() } : null}
      />
      {isManager
        ? <RosterManageView navigation={navigation} openCreateRef={openCreateRef} />
        : <MyShiftsView />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  scroll:      { padding: 16, paddingBottom: 32 },

  sectionTitle: { fontSize: typography.md, fontWeight: '700', color: colors.darkGrey, marginBottom: 10 },

  emptyBox:    { alignItems: 'center', paddingVertical: 48 },
  emptyIcon:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontSize: typography.lg, fontWeight: '700', color: colors.dark, marginBottom: 6 },
  emptyMsg:    { fontSize: typography.sm, color: colors.midGrey, textAlign: 'center', paddingHorizontal: 32 },

  // Shift cards (staff view)
  shiftCard:   { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.md,
                 marginBottom: 10, overflow: 'hidden', ...shadow.sm },
  shiftAccent: { width: 5 },
  shiftCardBody: { flex: 1, padding: 14 },
  shiftCardDate: { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  shiftCardStore: { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  shiftCardRole: { fontSize: typography.xs, color: colors.primary, marginTop: 3, fontWeight: '600' },
  shiftCardRight: { padding: 14, alignItems: 'flex-end', justifyContent: 'center' },
  shiftCardTime: { fontSize: typography.sm, fontWeight: '700', color: colors.darkGrey },
  shiftCardTimeSep: { fontSize: typography.xs, color: colors.lightGrey },

  // Manager grid
  dayRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  dayBtn:      { flex: 1, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.white,
                 alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayText:     { fontSize: 10, fontWeight: '700', color: colors.midGrey },
  dayTextActive: { color: colors.white },

  gridHeader:  { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 6,
                 borderBottomWidth: 1, borderBottomColor: colors.border },
  gridCell:    { fontSize: 10, fontWeight: '700', color: colors.lightGrey, textTransform: 'uppercase' },
  nameCell:    { flex: 1 },
  shiftCell:   { width: 32, textAlign: 'center' },

  list:        { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 32 },
  rosterRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                 borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow.sm },
  nameCol:     { flex: 1 },
  rosterName:  { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  rosterMeta:  { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
                 backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B' },
  statusBadgePublished: { backgroundColor: '#DCFCE7', borderColor: colors.primary },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  statusBadgeTextPublished: { color: colors.primary },

  // Modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                 padding: 24, paddingBottom: 40 },
  sheetTitle:  { fontSize: typography.lg, fontWeight: '800', color: colors.dark, marginBottom: 20 },
  fieldLabel:  { fontSize: 11, fontWeight: '700', color: colors.darkGrey, marginBottom: 6,
                 textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldInput:  { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1.5,
                 borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
                 fontSize: typography.md, color: colors.dark, marginBottom: 16 },
  formError:   { color: colors.error, fontSize: typography.sm, marginBottom: 12 },
  sheetBtns:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:   { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                 paddingVertical: 13, alignItems: 'center' },
  cancelText:  { fontSize: typography.md, fontWeight: '700', color: colors.darkGrey },
  saveBtn:     { flex: 1, backgroundColor: colors.primary, borderRadius: radius.md,
                 paddingVertical: 13, alignItems: 'center' },
  saveText:    { fontSize: typography.md, fontWeight: '700', color: colors.white },
});
