import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip   from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const PRIORITY_ICON = { critical: '🔴', warning: '🟡', inactive: '⚪', low: '⚪', medium: '🟡', high: '🔴' };

export default function CorrectiveActionsScreen({ navigation }) {
  const [filter, setFilter] = useState('open');
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['corrective-actions'],
    queryFn: () => client.get('/auditing/corrective-actions').then(r => r.data),
  });
  const actions = data?.data || [];

  const resolve = useMutation({
    mutationFn: (id) => client.post(`/auditing/corrective-actions/${id}/resolve`, {}).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['corrective-actions'] }),
    onError: (err) => Alert.alert('Error', err?.response?.data?.error || 'Failed'),
  });

  const shown = filter === 'all'
    ? actions
    : actions.filter(a => a.status === filter || (filter === 'open' && a.status === 'pending'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Corrective Actions" onBack={() => navigation.goBack()} />
      <View style={styles.filters}>
        {['open', 'completed', 'all'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !data ? (
        <Text style={styles.retryText} onPress={refetch}>Failed to load. Tap to retry.</Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === 'completed' && styles.cardDone]}>
              <View style={styles.cardHeader}>
                <Text style={styles.priorityIcon}>{PRIORITY_ICON[item.priority] || '⚪'}</Text>
                <Text style={styles.store} numberOfLines={1}>{item.store_name || item.store}</Text>
                <StatusChip status={item.status} />
              </View>
              <Text style={styles.issue}>{item.description || item.issue}</Text>
              <View style={styles.cardFooter}>
                {item.due_date ? (
                  <Text style={styles.due}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                ) : (
                  <Text style={styles.due} />
                )}
                {item.status !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.resolveBtn, resolve.isPending && styles.resolveDisabled]}
                    onPress={() => resolve.mutate(item.id)}
                    disabled={resolve.isPending}>
                    <Text style={styles.resolveText}>Mark Resolved</Text>
                  </TouchableOpacity>
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
  safe:            { flex: 1, backgroundColor: colors.background },
  filters:         { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterBtn:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
                     backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  filterActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText:      { fontSize: typography.sm, color: colors.midGrey, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  list:            { padding: 16, paddingTop: 4 },
  card:            { backgroundColor: colors.white, borderRadius: radius.md, padding: 14,
                     marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                     shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardDone:        { opacity: 0.6 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  priorityIcon:    { fontSize: 14 },
  store:           { flex: 1, fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  issue:           { fontSize: typography.sm, color: colors.darkGrey, lineHeight: 20, marginBottom: 10 },
  cardFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  due:             { fontSize: typography.xs, color: colors.midGrey },
  resolveBtn:      { backgroundColor: colors.primaryBg, borderRadius: radius.sm,
                     paddingHorizontal: 12, paddingVertical: 6 },
  resolveDisabled: { opacity: 0.5 },
  resolveText:     { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  retryText:       { textAlign: 'center', marginTop: 40, color: colors.error, fontSize: typography.sm },
});
