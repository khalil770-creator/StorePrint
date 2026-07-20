import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader  from '../../../components/common/ScreenHeader';
import EmptyState    from '../../../components/common/EmptyState';
import StatusChip    from '../../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

// ─── Template Card ────────────────────────────────────────────────────────────
function TemplateCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <StatusChip status={item.status || 'active'} />
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaIcon}>📋</Text>
          <Text style={styles.metaText}>{item.question_count ?? item.questionCount ?? 0} questions</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaBadge}>
          <Text style={styles.metaIcon}>🗂</Text>
          <Text style={styles.metaText}>{item.category_count ?? item.categoryCount ?? 0} categories</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <Text style={styles.cardCta}>Tap to edit →</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AuditTemplatesScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const { data: templates, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-templates'],
    queryFn:  () => client.get('/auditing/templates').then(r => r.data),
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(templates) ? templates : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(t => t.name.toLowerCase().includes(q));
  }, [templates, search]);

  function handleNew() {
    navigation.navigate('AuditTemplateBuilder', { mode: 'create' });
  }

  function handleEdit(item) {
    navigation.navigate('AuditTemplateBuilder', { mode: 'edit', template: item });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Audit Templates"
        onBack={() => navigation.goBack()}
        rightAction={{ label: '＋ New', onPress: handleNew }}
      />

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates…"
          placeholderTextColor={colors.lightGrey}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

      {isError && (
        <Text style={styles.retryText} onPress={refetch}>
          Failed to load templates. Tap to retry.
        </Text>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={filtered.length === 0 ? styles.listEmpty : styles.listContent}
          renderItem={({ item }) => (
            <TemplateCard item={item} onPress={() => handleEdit(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="No templates found"
              message={search ? `No results for "${search}"` : 'Create your first audit template to get started.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  retryText:   { textAlign: 'center', marginTop: 40, color: colors.error, fontSize: typography.sm },
  searchWrap:  {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: radius.md, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 42, fontSize: typography.md, color: colors.dark },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 32 },
  listEmpty:   { flexGrow: 1 },
  card:        { backgroundColor: colors.white, borderRadius: radius.md, padding: 16, marginBottom: 12, ...shadow.sm },
  cardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardName:    { flex: 1, fontSize: typography.md, fontWeight: '700', color: colors.dark, marginRight: 10 },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metaBadge:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  metaIcon:    { fontSize: 12, marginRight: 4 },
  metaText:    { fontSize: typography.xs, fontWeight: '600', color: colors.primary },
  metaDivider: { width: 8 },
  cardDesc:    { fontSize: typography.xs, color: colors.midGrey, marginBottom: 6 },
  cardCta:     { fontSize: typography.xs, color: colors.lightGrey, textAlign: 'right' },
});
