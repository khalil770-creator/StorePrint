import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';

const FILTER_TABS = ['All', 'Critical', 'Warning', 'Info', 'Read'];

const SEVERITY_CONFIG = {
  critical: { color: '#D0021B', bgColor: '#FFF0F0', label: 'Critical' },
  warning:  { color: '#F5A623', bgColor: '#FFFBF0', label: 'Warning'  },
  info:     { color: '#4A90E2', bgColor: '#F0F6FF', label: 'Info'     },
};

function chipVariantForModule(module) {
  const map = { Audit: 'active', CX: 'warning', Training: 'inactive', VM: 'active', Environment: 'inactive', Campaigns: 'warning', Attendance: 'inactive' };
  return map[module] || 'inactive';
}

function formatTime(created_at) {
  if (!created_at) return '';
  const d = new Date(created_at);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default function AlertsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-alerts'],
    queryFn: () => client.get('/analytics/alerts').then(r => r.data),
  });
  const alerts = data?.data || [];

  const markRead = useMutation({
    mutationFn: (id) => client.put(`/analytics/alerts/${id}/read`, {}).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['analytics-alerts'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => Promise.all(
      alerts.filter(a => !a.read).map(a => client.put(`/analytics/alerts/${a.id}/read`, {}).then(r => r.data))
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['analytics-alerts'] }),
  });

  const filtered = alerts.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Read') return a.read;
    return a.severity === activeFilter.toLowerCase() && !a.read;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Alerts"
        subtitle={`${unreadCount} unread`}
        onBack={() => navigation.goBack()}
        rightAction={{ label: 'Mark all read', onPress: () => markAllRead.mutate() }}
      />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No alerts in this category</Text>
            </View>
          )}

          {filtered.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            return (
              <View
                key={alert.id}
                style={[styles.alertCard, shadow.sm, { borderLeftColor: cfg.color, opacity: alert.read ? 0.6 : 1 }]}
              >
                <View style={styles.alertTop}>
                  <View style={[styles.severityDot, { backgroundColor: cfg.color }]} />
                  {alert.module ? <StatusChip label={alert.module} variant={chipVariantForModule(alert.module)} /> : null}
                  {alert.read && <Text style={styles.readLabel}>Read</Text>}
                </View>
                <Text style={styles.alertMsg}>{alert.message}</Text>
                <View style={styles.alertFooter}>
                  <View>
                    <Text style={styles.alertStore}>{alert.store_name}</Text>
                    <Text style={styles.alertTime}>{formatTime(alert.created_at)}</Text>
                  </View>
                  {!alert.read && (
                    <TouchableOpacity
                      style={[styles.markReadBtn, { borderColor: cfg.color }]}
                      onPress={() => markRead.mutate(alert.id)}
                    >
                      <Text style={[styles.markReadText, { color: cfg.color }]}>Mark read</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

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
  tabsScroll:       { flexGrow: 0, marginBottom: 2 },
  tabsRow:          { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterTab:        { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.white, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterTabActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText:    { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  filterTabTextActive: { color: colors.white },

  alertCard:        { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, borderLeftWidth: 4 },
  alertTop:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  severityDot:      { width: 8, height: 8, borderRadius: 4 },
  readLabel:        { fontSize: typography.xs, color: colors.lightGrey, marginLeft: 'auto' },
  alertMsg:         { fontSize: typography.sm, fontWeight: '600', color: colors.dark, lineHeight: 19, marginBottom: 10 },
  alertFooter:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  alertStore:       { fontSize: typography.xs, fontWeight: '700', color: colors.dark },
  alertTime:        { fontSize: typography.xs, color: colors.lightGrey, marginTop: 1 },
  markReadBtn:      { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 5 },
  markReadText:     { fontSize: typography.xs, fontWeight: '700' },

  emptyState:       { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon:        { fontSize: 40 },
  emptyText:        { fontSize: typography.md, color: colors.midGrey, fontWeight: '600' },
});
