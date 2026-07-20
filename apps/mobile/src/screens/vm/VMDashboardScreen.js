import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const PRIORITY_ICONS = { high: '🔴', medium: '🟡', low: '⚪' };

export default function VMDashboardScreen({ navigation }) {
  const { data, isLoading } = useQuery({
    queryKey: ['vm-dashboard'],
    queryFn: () => client.get('/vm/dashboard').then(r => r.data),
  });

  const tasks = data?.tasks || [];
  const summaryStats = [
    { label: 'Pending', value: String(data?.pending ?? '—'), color: colors.info },
    { label: 'Overdue', value: String(data?.overdue ?? '—'), color: colors.error },
    { label: 'Avg Score', value: data?.avg_score != null ? `${data.avg_score}%` : '—', color: colors.primary },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Visual Merchandising" subtitle="VM task management" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Visual Merchandising" subtitle="VM task management" onBack={() => navigation.goBack()} />

      <View style={styles.statsRow}>
        {summaryStats.map((s) => (
          <View key={s.label} style={[styles.statCard, shadow.sm]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.listHeader}>Task List</Text>}
        ListEmptyComponent={<EmptyState icon="🖼️" message="No VM tasks found" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, shadow.sm]}
            onPress={() => navigation.navigate('VMTask', { task: item })}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityIcon}>{PRIORITY_ICONS[item.priority]}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.storeName}>{item.store_name || item.store}</Text>
                <Text style={styles.templateName}>{item.template_name || item.template}</Text>
                <Text style={styles.zone}>Zone: {item.zone}</Text>
              </View>
              <View style={styles.cardRight}>
                <StatusChip status={item.status} />
                <Text style={styles.dueDate}>Due: {item.due_date || item.dueDate}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },
  statsRow:     { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  statCard:     { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statValue:    { fontSize: typography.xl, fontWeight: '800' },
  statLabel:    { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  list:         { paddingHorizontal: 16, paddingBottom: 32 },
  listHeader:   { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 10, marginTop: 4 },
  card:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  priorityBadge:{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  priorityIcon: { fontSize: 18 },
  cardInfo:     { flex: 1 },
  storeName:    { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  templateName: { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  zone:         { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  cardRight:    { alignItems: 'flex-end', gap: 6 },
  dueDate:      { fontSize: typography.xs, color: colors.lightGrey },
});
