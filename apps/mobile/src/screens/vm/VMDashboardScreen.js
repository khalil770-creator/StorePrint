import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#6B7280' };
const PRIORITY_ICONS = { high: '🔴', medium: '🟡', low: '⚪' };

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function VMDashboardScreen({ navigation }) {
  const [tab, setTab] = useState('tasks');

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['vm-tasks'],
    queryFn: () => client.get('/vm/tasks').then(r => r.data),
  });
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['vm-templates'],
    queryFn: () => client.get('/vm/templates').then(r => r.data),
  });

  const tasks     = Array.isArray(tasksData)     ? tasksData     : [];
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const isLoading = loadingTasks || loadingTemplates;

  const pending  = tasks.filter(t => t.status === 'pending').length;
  const overdue  = tasks.filter(t => t.status === 'overdue').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Visual Merchandising" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Visual Merchandising" onBack={() => navigation.goBack()} />

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, shadow.sm]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <Text style={[styles.statValue, { color: colors.error }]}>{overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
        <View style={[styles.statCard, shadow.sm]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{templates.length}</Text>
          <Text style={styles.statLabel}>Templates</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {['tasks', 'templates'].map(t => (
          <TouchableOpacity key={t} style={[styles.tabItem, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'tasks' ? 'Tasks' : 'Templates'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="✅" message="No VM tasks assigned" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, shadow.sm]}
              onPress={() => navigation.navigate('VMTask', { task: item })}
              activeOpacity={0.85}
            >
              <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLOR[item.priority] || colors.border }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
                  <StatusChip status={item.status} />
                </View>
                <Text style={styles.taskMeta}>{item.store_name} · {item.template_title || '—'}</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.priorityText}>{PRIORITY_ICONS[item.priority]} {item.priority}</Text>
                  <Text style={styles.dueDate}>Due: {fmtDate(item.due_date)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="🖼️" message="No VM templates" />}
          renderItem={({ item }) => (
            <View style={[styles.card, shadow.sm]}>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
                  <StatusChip status={item.is_active ? 'active' : 'inactive'} />
                </View>
                <Text style={styles.taskMeta}>{item.zone_name || '—'}</Text>
                {!!item.description && <Text style={styles.templateDesc} numberOfLines={2}>{item.description}</Text>}
                {!!item.instructions && (
                  <Text style={styles.instructions} numberOfLines={3}>📋 {item.instructions}</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  statsRow:         { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  statCard:         { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statValue:        { fontSize: typography.xl, fontWeight: '800' },
  statLabel:        { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  tabBar:           { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabItem:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:        { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabLabel:         { fontSize: typography.sm, fontWeight: '600', color: colors.midGrey },
  tabLabelActive:   { color: colors.primary },
  list:             { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  card:             { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: 10, flexDirection: 'row', overflow: 'hidden' },
  priorityBar:      { width: 4 },
  cardBody:         { flex: 1, padding: 14 },
  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  taskTitle:        { flex: 1, fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginRight: 8 },
  taskMeta:         { fontSize: typography.xs, color: colors.midGrey, marginBottom: 6 },
  cardBottom:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  priorityText:     { fontSize: typography.xs, color: colors.darkGrey, textTransform: 'capitalize' },
  dueDate:          { fontSize: typography.xs, color: colors.lightGrey },
  templateDesc:     { fontSize: typography.xs, color: colors.darkGrey, marginTop: 4 },
  instructions:     { fontSize: typography.xs, color: colors.midGrey, marginTop: 6, lineHeight: 18 },
});
