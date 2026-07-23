import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

const FILTERS = ['All', 'Active', 'Upcoming', 'Closed'];

function pct(confirmed, total) {
  if (!total) return 0;
  return Math.round((confirmed / total) * 100);
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CampaignFeedScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => client.get('/campaigns').then(r => r.data),
  });
  const campaigns = Array.isArray(data) ? data : (data?.data || []);

  const filtered = campaigns.filter((c) => {
    if (activeFilter === 'All') return true;
    return c.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Campaigns" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Campaigns"
        subtitle={`${activeCount} active`}
        onBack={() => navigation.goBack()}
        rightAction={isAdmin ? { label: '+ New', onPress: () => {} } : undefined}
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterLabel, activeFilter === f && styles.filterLabelActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="📣" message="No campaigns found" />}
        renderItem={({ item }) => {
          const confirmedCount = item.confirmed_count ?? item.storesConfirmed ?? 0;
          const totalStores = item.store_count ?? item.total_stores ?? item.storesTotal ?? 0;
          const pc = pct(confirmedCount, totalStores);
          const barColor = item.color || colors.primary;
          return (
            <TouchableOpacity
              style={[styles.card, shadow.sm]}
              onPress={() => navigation.navigate('CampaignDetail', { campaign: item })}
              activeOpacity={0.85}
            >
              <View style={[styles.cardBar, { backgroundColor: barColor }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name || item.title}</Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{item.type}</Text>
                    </View>
                  </View>
                  <StatusChip status={item.status} />
                </View>

                <Text style={styles.dates}>
                  {formatDate(item.start_date)} – {formatDate(item.end_date)}
                </Text>

                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pc}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.progressLabel}>{pc}% confirmed ({confirmedCount}/{totalStores} stores)</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.background },
  filterRow:          { flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterTab:          { flex: 1, paddingVertical: 6, borderRadius: radius.sm, alignItems: 'center' },
  filterTabActive:    { backgroundColor: colors.primaryBg },
  filterLabel:        { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  filterLabelActive:  { color: colors.primary },
  list:               { padding: 16, gap: 12, paddingBottom: 32 },
  card:               { backgroundColor: colors.white, borderRadius: radius.lg, flexDirection: 'row', overflow: 'hidden' },
  cardBar:            { width: 5 },
  cardBody:           { flex: 1, padding: 14 },
  cardTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTopLeft:        { flex: 1, marginRight: 8 },
  cardTitle:          { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  typeBadge:          { backgroundColor: colors.inputBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, alignSelf: 'flex-start' },
  typeText:           { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  dates:              { fontSize: typography.xs, color: colors.lightGrey, marginBottom: 10 },
  progressRow:        { gap: 4 },
  progressTrack:      { height: 5, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:       { height: 5, borderRadius: radius.full },
  progressLabel:      { fontSize: typography.xs, color: colors.midGrey },
});
