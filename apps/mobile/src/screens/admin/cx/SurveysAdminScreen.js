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

const TYPE_COLORS = {
  nps:    { bg: '#EEF4FF', text: '#1E40AF' },
  csat:   { bg: '#FFF3E0', text: '#E65100' },
  custom: { bg: '#F3E8FF', text: '#7C3AED' },
};

function TypeBadge({ type }) {
  const key = (type || 'custom').toLowerCase();
  const c   = TYPE_COLORS[key] || TYPE_COLORS.custom;
  return (
    <View style={[styles.typeBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.typeBadgeText, { color: c.text }]}>{(type || 'Custom').toUpperCase()}</Text>
    </View>
  );
}

function SurveyCard({ item, onPress }) {
  const questions = Array.isArray(item.questions) ? item.questions : [];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <Text style={styles.surveyName} numberOfLines={1}>{item.title || item.name}</Text>
        <Text style={styles.deployIcon}>{item.deploy_method === 'link' ? '🔗' : '📲'}</Text>
      </View>
      <View style={[styles.cardRow, { marginTop: 8 }]}>
        <TypeBadge type={item.type} />
        <View style={{ marginLeft: 8 }}>
          <StatusChip status={item.is_active ? 'active' : 'draft'} />
        </View>
      </View>
      <View style={[styles.cardRow, { marginTop: 10 }]}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{questions.length}</Text>
          <Text style={styles.statLabel}>questions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.response_count ?? 0}</Text>
          <Text style={styles.statLabel}>responses</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SurveysAdminScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const { data: surveys, isLoading, isError, refetch } = useQuery({
    queryKey: ['cx-surveys-admin'],
    queryFn:  () => client.get('/cx/surveys').then(r => r.data),
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(surveys) ? surveys : [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(s => (s.title || s.name || '').toLowerCase().includes(q));
  }, [surveys, search]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="CX Surveys"
        onBack={() => navigation.goBack()}
        rightAction={{
          label: '＋ New',
          onPress: () => navigation.navigate('SurveyBuilder', { mode: 'create' }),
        }}
      />

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search surveys…"
          placeholderTextColor={colors.lightGrey}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />}

      {isError && (
        <Text style={styles.retryText} onPress={refetch}>
          Failed to load surveys. Tap to retry.
        </Text>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SurveyCard
              item={item}
              onPress={() => navigation.navigate('SurveyBuilder', { mode: 'edit', survey: item })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="⭐"
              title={search ? 'No surveys found' : 'No surveys yet'}
              message={search ? 'Try a different search term.' : 'Tap ＋ New to create your first survey.'}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  retryText:     { textAlign: 'center', marginTop: 40, color: colors.error, fontSize: typography.sm },
  searchWrap:    {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: radius.md, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  searchIcon:    { fontSize: 15, marginRight: 6 },
  searchInput:   { flex: 1, height: 42, fontSize: typography.md, color: colors.dark },
  list:          { padding: 16, paddingTop: 10, flexGrow: 1 },
  card:          { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  cardRow:       { flexDirection: 'row', alignItems: 'center' },
  surveyName:    { flex: 1, fontSize: typography.md, fontWeight: '700', color: colors.dark },
  deployIcon:    { fontSize: 18, marginLeft: 8 },
  typeBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  typeBadgeText: { fontSize: typography.xs, fontWeight: '700', letterSpacing: 0.5 },
  stat:          { alignItems: 'center' },
  statValue:     { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  statLabel:     { fontSize: typography.xs, color: colors.midGrey, marginTop: 1 },
  statDivider:   { width: 1, height: 28, backgroundColor: colors.border, marginHorizontal: 16 },
  chevron:       { fontSize: 22, color: colors.lightGrey, fontWeight: '300' },
});
