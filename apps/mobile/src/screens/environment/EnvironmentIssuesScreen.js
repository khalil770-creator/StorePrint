import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const TABS = ['Open', 'In Progress', 'Resolved'];

const SEVERITY_DOT = { critical: '🔴', high: '🟠', medium: '🟡', low: '⚪' };
const SEVERITY_COLOR = { critical: colors.error, high: '#E65100', medium: colors.warning, low: colors.lightGrey };


const STATUS_OPTIONS = ['open', 'in progress', 'resolved'];

export default function EnvironmentIssuesScreen({ navigation }) {
  const [tab, setTab] = useState('Open');
  const [modalIssue, setModalIssue] = useState(null);

  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['env-issues'],
    queryFn: () => client.get('/environment/issues').then(r => r.data),
  });
  const issues = data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => client.put(`/environment/issues/${id}`, { status }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['env-issues'] });
      setModalIssue(null);
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Update failed'),
  });

  const filtered = issues.filter((i) => (i.status || '').toLowerCase() === tab.toLowerCase());

  const updateStatus = (id, newStatus) => {
    updateMutation.mutate({ id, status: newStatus });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Environment Issues" subtitle="Loading..." onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const openCount = issues.filter((i) => (i.status || '').toLowerCase() === 'open').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Environment Issues" subtitle={`${openCount} open issues`} onBack={() => navigation.goBack()} />

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No {tab.toLowerCase()} issues</Text></View>}
        renderItem={({ item }) => {
          const currentStatus = item.status;
          return (
            <TouchableOpacity
              style={[styles.card, shadow.sm]}
              onPress={() => setModalIssue(item)}
              activeOpacity={0.88}
            >
              <View style={styles.cardTop}>
                <Text style={styles.severityDot}>{SEVERITY_DOT[item.severity]}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.issueText}>{item.text || item.description || item.title}</Text>
                  <Text style={styles.issueMeta}>{item.store || item.store_name}</Text>
                  <Text style={styles.issueDate}>Raised: {item.date || item.created_at}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLOR[item.severity] + '20' }]}>
                  <Text style={[styles.severityText, { color: SEVERITY_COLOR[item.severity] }]}>{item.severity}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!modalIssue} transparent animationType="slide" onRequestClose={() => setModalIssue(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalIssue(null)}>
          <View style={styles.sheet}>
            {modalIssue && (
              <>
                <Text style={styles.sheetTitle}>Update Issue Status</Text>
                <Text style={styles.sheetIssue}>{modalIssue.text || modalIssue.description || modalIssue.title}</Text>
                <Text style={styles.sheetMeta}>{modalIssue.store || modalIssue.store_name} · Raised {modalIssue.date || modalIssue.created_at}</Text>
                <Text style={styles.sheetLabel}>Change status to:</Text>
                {STATUS_OPTIONS.map((s) => {
                  const current = modalIssue.status;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, current === s && styles.statusOptionActive]}
                      onPress={() => updateStatus(modalIssue.id, s)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.statusOptionText, current === s && styles.statusOptionTextActive]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                      {current === s && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: colors.background },
  tabRow:              { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab:                 { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:           { borderBottomWidth: 2.5, borderBottomColor: colors.primary },
  tabText:             { fontSize: typography.sm, fontWeight: '600', color: colors.midGrey },
  tabTextActive:       { color: colors.primary },
  list:                { padding: 16, gap: 10, paddingBottom: 32 },
  empty:               { paddingVertical: 48, alignItems: 'center' },
  emptyText:           { fontSize: typography.sm, color: colors.lightGrey },
  card:                { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14 },
  cardTop:             { flexDirection: 'row', gap: 10 },
  severityDot:         { fontSize: 20, marginTop: 2 },
  cardBody:            { flex: 1 },
  issueText:           { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  issueMeta:           { fontSize: typography.xs, color: colors.midGrey },
  issueDate:           { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  severityBadge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  severityText:        { fontSize: typography.xs, fontWeight: '700', textTransform: 'capitalize' },
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:               { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 24, paddingBottom: 40 },
  sheetTitle:          { fontSize: typography.lg, fontWeight: '800', color: colors.dark, marginBottom: 8 },
  sheetIssue:          { fontSize: typography.sm, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  sheetMeta:           { fontSize: typography.xs, color: colors.midGrey, marginBottom: 16 },
  sheetLabel:          { fontSize: typography.xs, color: colors.lightGrey, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  statusOption:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8 },
  statusOptionActive:  { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  statusOptionText:    { fontSize: typography.sm, fontWeight: '600', color: colors.dark, textTransform: 'capitalize' },
  statusOptionTextActive: { color: colors.primary },
  checkmark:           { fontSize: 16, color: colors.primary, fontWeight: '800' },
});
