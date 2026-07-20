import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const CATEGORIES = ['All', 'Window', 'In-Store', 'POS', 'Digital'];

const CATEGORY_COLORS = {
  Window: '#4A90E2',
  'In-Store': '#0052CC',
  POS: '#F5A623',
  Digital: '#9B59B6',
};

export default function SignageLibraryScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['signage-templates'],
    queryFn: () => client.get('/signage/templates').then(r => r.data),
  });
  const templates = data?.data || [];

  const filtered = templates.filter((t) => {
    if (activeCategory === 'All') return true;
    return t.type === activeCategory || t.category === activeCategory;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Signage Library" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Signage Library" subtitle={`${templates.length} templates`} onBack={() => navigation.goBack()} />

      <View style={styles.filterRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterTab, activeCategory === c && styles.filterTabActive]}
            onPress={() => setActiveCategory(c)}
          >
            <Text style={[styles.filterLabel, activeCategory === c && styles.filterLabelActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="🪧" message="No templates found" />}
        renderItem={({ item }) => {
          const cat = item.type || item.category;
          const catColor = CATEGORY_COLORS[cat] || colors.midGrey;
          return (
            <TouchableOpacity
              style={[styles.card, shadow.sm]}
              onPress={() => navigation.navigate('SignageDetail', { template: item })}
              activeOpacity={0.85}
            >
              <View style={[styles.thumbnail, { backgroundColor: catColor + '18' }]}>
                <Text style={styles.thumbnailIcon}>🪧</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.name || item.title}</Text>
                <View style={[styles.catBadge, { backgroundColor: catColor + '18' }]}>
                  <Text style={[styles.catText, { color: catColor }]}>{cat}</Text>
                </View>
                <Text style={styles.dimensions}>{item.dimensions}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PrintRequest', { template: null })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>🖨️ Print Request</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  filterRow:        { flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterTab:        { flex: 1, paddingVertical: 6, borderRadius: radius.sm, alignItems: 'center' },
  filterTabActive:  { backgroundColor: colors.primaryBg },
  filterLabel:      { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  filterLabelActive:{ color: colors.primary },
  list:             { padding: 12, paddingBottom: 96 },
  columnWrapper:    { gap: 12, marginBottom: 12 },
  card:             { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  thumbnail:        { height: 100, alignItems: 'center', justifyContent: 'center' },
  thumbnailIcon:    { fontSize: 36 },
  cardBody:         { padding: 10 },
  cardTitle:        { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 6, lineHeight: 18 },
  catBadge:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, marginBottom: 4 },
  catText:          { fontSize: typography.xs, fontWeight: '700' },
  dimensions:       { fontSize: typography.xs, color: colors.lightGrey },
  fab:              { position: 'absolute', bottom: 24, right: 20, backgroundColor: colors.primary, borderRadius: radius.xl, paddingHorizontal: 20, paddingVertical: 14, ...shadow.green },
  fabText:          { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
});
