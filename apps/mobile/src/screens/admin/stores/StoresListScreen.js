import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import StatusChip   from '../../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

const STATUS_COLORS = { active: colors.primary, inactive: colors.lightGrey, renovating: '#7C3AED' };

export default function StoresListScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: () => client.get('/stores').then(r => r.data),
  });
  const stores = data?.data || [];

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.region_name || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Stores"
        subtitle={`${stores.length} locations`}
        onBack={() => navigation.goBack()}
        rightAction={{ label: '+ Store', onPress: () => navigation.navigate('StoreCreate') }}
      />
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Search stores or regions..."
          placeholderTextColor={colors.lightGrey}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : isError ? (
        <TouchableOpacity onPress={refetch}>
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 40 }}>Failed to load. Tap to retry.</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('StoreDetail', { store: item })}
              activeOpacity={0.8}>
              <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[item.status] || colors.lightGrey }]} />
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <StatusChip status={item.status} />
                </View>
                <Text style={styles.meta}>📍 {item.area_name}  ·  {item.region_name}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.background },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                marginHorizontal: 16, marginTop: 12, marginBottom: 4,
                borderRadius: radius.md, paddingHorizontal: 12, ...shadow.sm },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search:     { flex: 1, paddingVertical: 12, fontSize: typography.md, color: colors.dark },
  list:       { padding: 16, paddingTop: 8 },
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                borderRadius: radius.md, marginBottom: 10, overflow: 'hidden', ...shadow.sm },
  statusBar:  { width: 4, alignSelf: 'stretch' },
  body:       { flex: 1, padding: 14 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name:       { fontSize: typography.md, fontWeight: '700', color: colors.dark, flex: 1, marginRight: 8 },
  meta:       { fontSize: typography.xs, color: colors.midGrey, marginBottom: 2 },
  staff:      { fontSize: typography.xs, color: colors.primary, fontWeight: '600' },
  chevron:    { fontSize: 20, color: colors.lightGrey, paddingRight: 12 },
});
