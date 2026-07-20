import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import StatusChip   from '../../../components/common/StatusChip';
import StatCard     from '../../../components/common/StatCard';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

export default function StoreDetailScreen({ route, navigation }) {
  const initial = route.params?.store || {};
  const qc = useQueryClient();

  // Local status state so UI updates immediately after mutation
  const [status, setStatusLocal] = useState(initial.status || 'active');

  /* ── Change Status ── */
  const setStatus = useMutation({
    mutationFn: (s) => client.put(`/stores/${initial.id}/status`, { status: s }).then(r => r.data),
    onSuccess: (_, s) => {
      setStatusLocal(s);
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed to update status'),
  });

  /* ── Delete Store ── */
  const remove = useMutation({
    mutationFn: () => client.delete(`/stores/${initial.id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      navigation.goBack();
      setTimeout(() => Alert.alert('Deleted', `"${initial.name}" has been removed.`), 300);
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed to delete store'),
  });

  function confirmDelete() {
    if (Platform.OS === 'web') {
      // Alert.alert multi-button is broken on web — use native browser confirm
      const ok = window.confirm(`Delete "${initial.name}"?\n\nThis cannot be undone.`);
      if (ok) remove.mutate();
    } else {
      Alert.alert(
        'Delete Store',
        `Are you sure you want to delete "${initial.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
        ]
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={initial.name || 'Store Detail'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, shadow.md]}>
          <Text style={styles.heroIcon}>🏪</Text>
          <Text style={styles.heroName}>{initial.name}</Text>
          <StatusChip status={status} />
          <Text style={styles.heroBreadcrumb}>
            Ideas  ›  {initial.region_name || '—'}  ›  {initial.area_name || '—'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Geo Radius"  value={initial.geofence_radius ? `${initial.geofence_radius}m` : '—'} accent={colors.primary} />
          <StatCard label="Audit Score" value="—"   sub="No data yet"   accent={colors.info}    />
          <StatCard label="Compliance"  value="—"   sub="No data yet"   accent={colors.success}  />
        </View>

        {/* Store Details */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Store Details</Text>
          {[
            { label: 'Code',     value: initial.code    || '—' },
            { label: 'Format',   value: initial.format  || '—' },
            { label: 'Address',  value: initial.address || '—' },
            { label: 'City',     value: initial.city    || '—' },
            { label: 'Country',  value: initial.country || '—' },
            { label: 'Area',     value: initial.area_name    || '—' },
            { label: 'Region',   value: initial.region_name  || '—' },
            { label: 'Tags',           value: (initial.tags || []).join(', ') || '—' },
            { label: 'Store Phone',    value: initial.phone          || '—' },
            { label: 'Contact Person', value: initial.contact_person || '—' },
            { label: 'Contact Cell',   value: initial.contact_cell   || '—' },
          ].map(r => (
            <View key={r.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{r.label}</Text>
              <Text style={styles.infoValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Geo-fence */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>GPS & Geo-fence</Text>
          {[
            { label: 'Latitude',  value: initial.lat ? `${parseFloat(initial.lat).toFixed(5)}°` : '—' },
            { label: 'Longitude', value: initial.lng ? `${parseFloat(initial.lng).toFixed(5)}°` : '—' },
            { label: 'Radius',    value: initial.geofence_radius ? `${initial.geofence_radius} m` : '—' },
          ].map(r => (
            <View key={r.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{r.label}</Text>
              <Text style={styles.infoValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Change Status */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Change Status</Text>
          <View style={styles.chipRow}>
            {['active', 'inactive', 'renovating'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, status === s && styles.chipActive]}
                onPress={() => { if (s !== status) setStatus.mutate(s); }}
                disabled={setStatus.isPending}>
                {setStatus.isPending && status !== s
                  ? null
                  : null}
                <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                  {s === 'active' ? '✅ Active' : s === 'inactive' ? '⏸ Inactive' : '🔧 Renovating'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {setStatus.isPending && (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} size="small" />
          )}
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, styles.dangerCard, shadow.sm]}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          <Text style={styles.dangerDesc}>
            Deleting a store permanently removes all associated data including attendance records, audits, and geo-fence settings. This cannot be undone.
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={confirmDelete}
            disabled={remove.isPending}
            activeOpacity={0.85}>
            {remove.isPending
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.deleteBtnText}>🗑  Delete Store</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { padding: 16, paddingBottom: 40 },
  hero:           { backgroundColor: colors.white, borderRadius: radius.lg, padding: 24,
                    alignItems: 'center', marginBottom: 12 },
  heroIcon:       { fontSize: 40, marginBottom: 8 },
  heroName:       { fontSize: typography.xl, fontWeight: '800', color: colors.dark,
                    textAlign: 'center', marginBottom: 8 },
  heroBreadcrumb: { fontSize: typography.xs, color: colors.midGrey, marginTop: 8 },
  statsRow:       { flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 },
  card:           { backgroundColor: colors.white, borderRadius: radius.lg, padding: 18,
                    marginBottom: 12 },
  cardTitle:      { fontSize: typography.sm, fontWeight: '700', color: colors.midGrey,
                    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:      { fontSize: typography.sm, color: colors.midGrey },
  infoValue:      { fontSize: typography.sm, fontWeight: '600', color: colors.dark, flex: 1,
                    textAlign: 'right', marginLeft: 12 },
  chipRow:        { flexDirection: 'row', gap: 8 },
  chip:           { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                    paddingVertical: 10, alignItems: 'center' },
  chipActive:     { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  chipText:       { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  dangerCard:     { borderWidth: 1.5, borderColor: '#FFE0E0', backgroundColor: '#FFF8F8' },
  dangerTitle:    { fontSize: typography.sm, fontWeight: '700', color: colors.error,
                    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  dangerDesc:     { fontSize: typography.xs, color: colors.midGrey, lineHeight: 18, marginBottom: 14 },
  deleteBtn:      { backgroundColor: colors.error, borderRadius: radius.md,
                    paddingVertical: 13, alignItems: 'center' },
  deleteBtnText:  { color: colors.white, fontWeight: '700', fontSize: typography.sm },
});
