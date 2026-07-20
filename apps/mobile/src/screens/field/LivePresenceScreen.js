import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const fmtTime = (iso) => iso ? new Date(iso).toTimeString().slice(0, 5) : '--';

export default function LivePresenceScreen({ navigation }) {
  const [expanded, setExpanded] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['live-presence'],
    queryFn: () => client.get('/field/live-presence').then(r => r.data),
    refetchInterval: 30000,
  });
  const presence = data || [];

  // Group flat presence list by store_name for display
  const storeMap = presence.reduce((acc, item) => {
    const key = item.store_name || 'Unknown Store';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const stores = Object.entries(storeMap).map(([name, staff], idx) => ({
    id: idx,
    name,
    present: staff.length,
    staff,
  }));

  const total = presence.length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Live Presence" subtitle="Real-time attendance" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Live Presence" subtitle="Real-time attendance" onBack={() => navigation.goBack()} />
      <FlatList
        data={stores}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={false}
        ListHeaderComponent={
          <View style={styles.banner}>
            <Text style={styles.bannerVal}>{total}</Text>
            <Text style={styles.bannerLabel}>Staff currently clocked in</Text>
          </View>
        }
        renderItem={({ item }) => {
          const open = expanded === item.id;
          return (
            <View style={styles.storeCard}>
              <TouchableOpacity
                style={styles.storeHeader}
                onPress={() => setExpanded(open ? null : item.id)}
                activeOpacity={0.8}>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{item.name}</Text>
                  <View style={styles.presenceRow}>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: '100%', backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.count, { color: colors.primary }]}>{item.present}</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {open && item.staff.length > 0 && (
                <View style={styles.staffList}>
                  {item.staff.map((s, i) => (
                    <View key={s.user_id ?? i} style={styles.staffRow}>
                      <View style={styles.onlineDot} />
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>{s.name}</Text>
                        <Text style={styles.staffRole}>
                          {s.hours_on_floor != null ? `${Number(s.hours_on_floor).toFixed(1)}h on floor` : ''}
                        </Text>
                      </View>
                      <Text style={styles.clockedAt}>In {fmtTime(s.clock_in_at)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  list:        { padding: 16, paddingBottom: 32 },
  banner:      { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20,
                 alignItems: 'center', marginBottom: 16, ...shadow.green },
  bannerVal:   { fontSize: typography.xxxl, fontWeight: '800', color: colors.white },
  bannerLabel: { fontSize: typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  storeCard:   { backgroundColor: colors.white, borderRadius: radius.md, marginBottom: 10,
                 overflow: 'hidden', ...shadow.sm },
  storeHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  storeInfo:   { flex: 1 },
  storeName:   { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 8 },
  presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barBg:       { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill:     { height: 8, borderRadius: 4 },
  count:       { fontSize: typography.sm, fontWeight: '800', minWidth: 36 },
  chevron:     { fontSize: 12, color: colors.midGrey, marginLeft: 8 },
  staffList:   { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingBottom: 8 },
  staffRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                 borderBottomWidth: 1, borderBottomColor: colors.border },
  onlineDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 12 },
  staffInfo:   { flex: 1 },
  staffName:   { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  staffRole:   { fontSize: typography.xs, color: colors.midGrey },
  clockedAt:   { fontSize: typography.xs, color: colors.midGrey },
});
