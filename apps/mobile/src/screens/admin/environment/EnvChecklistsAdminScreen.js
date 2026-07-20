import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import EmptyState   from '../../../components/common/EmptyState';
import StatusChip   from '../../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

const FREQ_COLORS = {
  daily:   { bg: colors.statusActive, text: colors.statusActiveText },
  weekly:  { bg: '#EEF4FF',           text: '#1E40AF' },
  monthly: { bg: '#FFF4EC',           text: '#C05621' },
};

function FreqBadge({ frequency }) {
  const c = FREQ_COLORS[frequency] || FREQ_COLORS.daily;
  return (
    <View style={[styles.freqBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.freqText, { color: c.text }]}>
        {(frequency || 'daily').charAt(0).toUpperCase() + (frequency || 'daily').slice(1)}
      </Text>
    </View>
  );
}

function ChecklistCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>{item.title || item.name}</Text>
        <StatusChip status={item.is_active === false ? 'draft' : 'active'} />
      </View>
      <View style={styles.cardMeta}>
        <FreqBadge frequency={item.frequency} />
        <Text style={styles.metaText}>· {item.item_count ?? 0} items</Text>
      </View>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function EnvChecklistsAdminScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const { data: checklists, isLoading, isError, refetch } = useQuery({
    queryKey: ['env-checklists'],
    queryFn:  () => client.get('/environment/checklists').then(r => r.data),
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(checklists) ? checklists : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(c => (c.title || c.name || '').toLowerCase().includes(q));
  }, [checklists, search]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Environment Checklists"
        onBack={() => navigation.goBack()}
        rightAction={{
          label: '＋ New',
          onPress: () => navigation.navigate('EnvChecklistBuilder', { mode: 'create' }),
        }}
      />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search checklists…"
          placeholderTextColor={colors.lightGrey}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

      {isError && (
        <Text style={styles.retryText} onPress={refetch}>
          Failed to load. Tap to retry.
        </Text>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="🌿"
              title="No checklists found"
              message={search ? `No results for "${search}"` : 'Create your first environment checklist to get started.'}
            />
          }
          renderItem={({ item }) => (
            <ChecklistCard
              item={item}
              onPress={() => navigation.navigate('EnvChecklistBuilder', { mode: 'edit', checklist: item })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  retryText:   { textAlign: 'center', marginTop: 40, color: colors.error, fontSize: typography.sm },
  searchRow:   {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.inputBg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 9,
    fontSize: typography.md, color: colors.dark,
  },
  listContent: { padding: 16, gap: 12, flexGrow: 1 },
  card:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, ...shadow.sm },
  cardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardName:    { fontSize: typography.md, fontWeight: '700', color: colors.dark, flex: 1, marginRight: 8 },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  cardDesc:    { fontSize: typography.xs, color: colors.midGrey, marginTop: 6 },
  freqBadge:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full },
  freqText:    { fontSize: typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaText:    { fontSize: typography.sm, color: colors.midGrey },
});
