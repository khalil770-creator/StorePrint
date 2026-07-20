import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';

const MODULE_COLORS = {
  Auditing:    '#0052CC',
  VM:          '#4A90E2',
  CX:          '#E67E22',
  Training:    '#9B59B6',
  Environment: '#1ABC9C',
  Attendance:  '#0052CC',
};

function getStatus(actual, target) {
  const ratio = actual / target;
  if (ratio >= 1) return { label: 'On Target', variant: 'active' };
  if (ratio >= 0.9) return { label: 'Near Target', variant: 'warning' };
  return { label: 'Below Target', variant: 'inactive' };
}

function KpiRow({ item, onEdit }) {
  const actual = item.actual ?? item.current ?? 0;
  const target = item.target ?? 0;
  const status = getStatus(actual, target);
  const progress = target > 0 ? Math.min(actual / target, 1) : 0;
  const barColor = progress >= 1 ? colors.success : progress >= 0.9 ? colors.warning : colors.error;
  const moduleColor = MODULE_COLORS[item.module] || colors.primary;

  return (
    <View style={[styles.kpiRow, shadow.sm]}>
      <View style={[styles.kpiModuleBar, { backgroundColor: moduleColor }]} />
      <View style={styles.kpiBody}>
        <View style={styles.kpiTopRow}>
          <Text style={styles.kpiMetric}>{item.metric}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
            <Text style={styles.editBtnText}>Edit ✏️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.kpiValRow}>
          <Text style={styles.kpiCurrentVal}>{actual}{item.unit}</Text>
          <Text style={styles.kpiDivider}>/</Text>
          <Text style={styles.kpiTargetVal}>Target: {target}{item.unit}</Text>
          <View style={styles.chipWrap}>
            <StatusChip label={status.label} variant={status.variant} />
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(progress * 100)}% of target</Text>
      </View>
    </View>
  );
}

function groupByModule(targets) {
  return targets.reduce((acc, t) => {
    const key = t.module || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
}

export default function KpiTargetsScreen({ navigation }) {
  const [editingMetric, setEditingMetric] = useState(null);
  const [editValue, setEditValue] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['kpi-targets'],
    queryFn: () => client.get('/analytics/kpi-targets').then(r => r.data),
  });
  const targets = data?.targets || [];

  const upsert = useMutation({
    mutationFn: ({ metric, target }) => client.put(`/analytics/kpi-targets/${metric}`, { target }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi-targets'] });
      setEditingMetric(null);
      setEditValue('');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed to save target'),
  });

  function handleEdit(item) {
    setEditingMetric(item.metric);
    setEditValue(String(item.target ?? ''));
  }

  function handleSave() {
    const newTarget = parseFloat(editValue);
    if (!isNaN(newTarget) && newTarget > 0) {
      upsert.mutate({ metric: editingMetric, target: newTarget });
    }
  }

  const grouped = groupByModule(targets);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="KPI Targets" subtitle="Manage performance targets" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Edit Panel */}
          {editingMetric && (
            <View style={[styles.editPanel, shadow.md]}>
              <Text style={styles.editPanelTitle}>Edit Target</Text>
              <Text style={styles.editPanelSub}>{editingMetric}</Text>
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="numeric"
                  placeholder="New target"
                  placeholderTextColor={colors.lightGrey}
                  autoFocus
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={upsert.isPending}>
                  <Text style={styles.saveBtnText}>{upsert.isPending ? 'Saving…' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingMetric(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Summary banner */}
          <View style={[styles.summaryBanner, shadow.sm]}>
            {[
              { label: 'On Target',    count: targets.filter((t) => getStatus(t.actual ?? t.current ?? 0, t.target).label === 'On Target').length,    color: colors.success },
              { label: 'Near Target',  count: targets.filter((t) => getStatus(t.actual ?? t.current ?? 0, t.target).label === 'Near Target').length,  color: colors.warning },
              { label: 'Below Target', count: targets.filter((t) => getStatus(t.actual ?? t.current ?? 0, t.target).label === 'Below Target').length, color: colors.error   },
            ].map((s) => (
              <View key={s.label} style={styles.summaryItem}>
                <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Grouped KPI rows */}
          {Object.entries(grouped).map(([module, items]) => (
            <View key={module} style={styles.moduleGroup}>
              <View style={[styles.moduleGroupHeader, { borderLeftColor: MODULE_COLORS[module] || colors.primary }]}>
                <Text style={styles.moduleGroupTitle}>{module}</Text>
              </View>
              {items.map((item) => (
                <KpiRow key={item.metric} item={item} onEdit={handleEdit} />
              ))}
            </View>
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  scroll:           { flex: 1 },
  content:          { padding: 16, gap: 12 },

  editPanel:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
  editPanelTitle:   { fontSize: typography.md, fontWeight: '800', color: colors.dark },
  editPanelSub:     { fontSize: typography.sm, color: colors.midGrey, marginTop: 2, marginBottom: 12 },
  editRow:          { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editInput:        { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: typography.md, color: colors.dark, backgroundColor: colors.inputBg },
  saveBtn:          { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 9 },
  saveBtnText:      { color: colors.white, fontWeight: '700', fontSize: typography.sm },
  cancelBtn:        { paddingHorizontal: 12, paddingVertical: 9 },
  cancelBtnText:    { color: colors.midGrey, fontWeight: '600', fontSize: typography.sm },

  summaryBanner:    { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem:      { alignItems: 'center' },
  summaryCount:     { fontSize: typography.xl, fontWeight: '900' },
  summaryLabel:     { fontSize: typography.xs, color: colors.midGrey, marginTop: 3 },

  moduleGroup:      { gap: 8 },
  moduleGroupHeader:{ borderLeftWidth: 4, paddingLeft: 10, marginBottom: 4 },
  moduleGroupTitle: { fontSize: typography.md, fontWeight: '800', color: colors.dark },

  kpiRow:           { backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', overflow: 'hidden' },
  kpiModuleBar:     { width: 4 },
  kpiBody:          { flex: 1, padding: 14 },
  kpiTopRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  kpiMetric:        { fontSize: typography.sm, fontWeight: '700', color: colors.dark, flex: 1 },
  editBtn:          { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.background, borderRadius: radius.sm },
  editBtnText:      { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  kpiValRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  kpiCurrentVal:    { fontSize: typography.lg, fontWeight: '900', color: colors.dark },
  kpiDivider:       { fontSize: typography.md, color: colors.border },
  kpiTargetVal:     { fontSize: typography.xs, color: colors.midGrey, flex: 1 },
  chipWrap:         {},
  progressTrack:    { height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:     { height: 6, borderRadius: radius.full },
  progressPct:      { fontSize: typography.xs, color: colors.lightGrey, marginTop: 4 },
});
