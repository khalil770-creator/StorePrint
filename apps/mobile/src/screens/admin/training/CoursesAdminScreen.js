import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/common/ScreenHeader';
import EmptyState   from '../../../components/common/EmptyState';
import StatusChip   from '../../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../../constants/theme';

// ─── Category meta ───────────────────────────────────────────────────────────
const CATEGORY_META = {
  'Brand Standards': { bg: '#E8F0FF', text: '#1E3EA1', icon: '🏷️' },
  'Product':         { bg: '#FFF3E0', text: '#E65100', icon: '📦' },
  'Compliance':      { bg: '#FCE4EC', text: '#B71C1C', icon: '⚖️' },
  'Soft Skills':     { bg: '#F3E8FF', text: '#6A1B9A', icon: '💬' },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_COURSES = [
  {
    id: 'c1',
    title: 'Brand Standards 101',
    category: 'Brand Standards',
    modules: 4,
    passMark: 80,
    durationMin: 45,
    status: 'active',
    enrolled: 24,
  },
  {
    id: 'c2',
    title: 'VM & Planogram Basics',
    category: 'Product',
    modules: 3,
    passMark: 75,
    durationMin: 30,
    status: 'active',
    enrolled: 18,
  },
  {
    id: 'c3',
    title: 'Compliance & Safety',
    category: 'Compliance',
    modules: 5,
    passMark: 85,
    durationMin: 60,
    status: 'active',
    enrolled: 31,
  },
  {
    id: 'c4',
    title: 'Customer Service Excellence',
    category: 'Soft Skills',
    modules: 3,
    passMark: 70,
    durationMin: 35,
    status: 'draft',
    enrolled: 0,
  },
];

// ─── Course card ──────────────────────────────────────────────────────────────
function CourseCard({ item, onPress }) {
  const cat = CATEGORY_META[item.category] || CATEGORY_META['Brand Standards'];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Top row: title + status */}
      <View style={styles.cardTop}>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
        <StatusChip status={item.status} />
      </View>

      {/* Category chip */}
      <View style={[styles.catChip, { backgroundColor: cat.bg }]}>
        <Text style={[styles.catChipText, { color: cat.text }]}>
          {cat.icon} {item.category}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statText}>{item.modules} modules</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statText}>Pass: {item.passMark}%</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>⏱</Text>
          <Text style={styles.statText}>~{item.durationMin} min</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statText}>{item.enrolled} enrolled</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CoursesAdminScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const filtered = MOCK_COURSES.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Training Courses"
        subtitle={`${MOCK_COURSES.length} courses`}
        onBack={() => navigation.goBack()}
        rightAction={{
          label: '＋ New',
          onPress: () => navigation.navigate('CourseBuilder', { mode: 'create' }),
        }}
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Search courses..."
          placeholderTextColor={colors.lightGrey}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🎓"
            title="No courses found"
            message="Try a different search term or create a new course."
          />
        }
        renderItem={({ item }) => (
          <CourseCard
            item={item}
            onPress={() => navigation.navigate('CourseBuilder', { mode: 'edit', course: item })}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },

  searchWrap:   {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: radius.md, paddingHorizontal: 12, ...shadow.sm,
  },
  searchIcon:   { fontSize: 15, marginRight: 8 },
  search:       { flex: 1, paddingVertical: 12, fontSize: typography.md, color: colors.dark },
  clearIcon:    { fontSize: 13, color: colors.lightGrey, paddingLeft: 8 },

  list:         { padding: 16, paddingTop: 8 },

  card:         {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 14, marginBottom: 12, ...shadow.sm,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  courseTitle:  { flex: 1, fontSize: typography.md, fontWeight: '700', color: colors.dark, marginRight: 8 },

  catChip:      {
    alignSelf: 'flex-start', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  catChipText:  { fontSize: typography.xs, fontWeight: '700' },

  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statIcon:     { fontSize: 12 },
  statText:     { fontSize: typography.xs, color: colors.midGrey, fontWeight: '500' },
});
