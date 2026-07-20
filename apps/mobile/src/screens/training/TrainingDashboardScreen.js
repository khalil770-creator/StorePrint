import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatCard from '../../components/common/StatCard';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const CATEGORIES = ['All', 'Onboarding', 'Brand Culture', 'Compliance', 'Safety'];

const CAT_COLOR = {
  Onboarding: '#4A90E2', 'Brand Culture': '#9B59B6', Compliance: '#F5A623', Safety: '#E74C3C',
};

export default function TrainingDashboardScreen({ navigation }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['training-courses'],
    queryFn: () => client.get('/training/courses').then(r => r.data),
  });
  const { data: enrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => client.get('/training/enrollments/me').then(r => r.data),
  });
  const courseList = courses?.data || [];
  const enrollmentList = enrollments || [];

  const enrolledIds = new Set(enrollmentList.map((e) => e.course_id || e.id));
  const myCourses = courseList.filter((c) => enrolledIds.has(c.id));
  const availableCourses = courseList.filter((c) => !enrolledIds.has(c.id));

  const completedCount = enrollmentList.filter((e) => e.progress === 100).length;

  const filteredAvailable = availableCourses.filter(
    (c) => activeCategory === 'All' || c.category === activeCategory,
  );
  const filteredMy = myCourses.filter(
    (c) => activeCategory === 'All' || c.category === activeCategory,
  );

  if (loadingCourses) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Training" subtitle="Learn & grow" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Training" subtitle="Learn & grow" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard label="Enrolled" value={String(myCourses.length)} icon="📚" />
          <StatCard label="Completed" value={String(completedCount)} accent={colors.success} />
          <StatCard label="Available" value={String(availableCourses.length)} accent="#9B59B6" />
        </View>

        <View style={styles.filterRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, activeCategory === c && styles.chipActive]}
              onPress={() => setActiveCategory(c)}
            >
              <Text style={[styles.chipText, activeCategory === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredMy.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>My Courses</Text>
            {filteredMy.map((course) => {
              const enroll = enrollmentList.find((e) => (e.course_id || e.id) === course.id);
              const progress = enroll?.progress ?? 0;
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.card, shadow.sm]}
                  onPress={() => navigation.navigate('TrainingCourse', { course })}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.catBadge, { backgroundColor: (CAT_COLOR[course.category] || colors.primary) + '20' }]}>
                      <Text style={[styles.catText, { color: CAT_COLOR[course.category] || colors.primary }]}>{course.category}</Text>
                    </View>
                    {progress === 100 && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓ Done</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressLabel}>{progress}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <Text style={styles.sectionTitle}>Available Courses</Text>
        {filteredAvailable.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={[styles.card, shadow.sm]}
            onPress={() => navigation.navigate('TrainingCourse', { course })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.catBadge, { backgroundColor: (CAT_COLOR[course.category] || colors.primary) + '20' }]}>
                <Text style={[styles.catText, { color: CAT_COLOR[course.category] || colors.primary }]}>{course.category}</Text>
              </View>
              <Text style={styles.duration}>{course.duration_min ? `${course.duration_min} min` : ''}</Text>
            </View>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={[styles.enrollBtn]}>
              <Text style={styles.enrollBtnText}>Enroll →</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.background },
  scroll:          { flex: 1 },
  content:         { padding: 16, paddingTop: 20 },
  statsRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive:      { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:        { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  chipTextActive:  { color: colors.white },
  sectionTitle:    { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 10 },
  card:            { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  catText:         { fontSize: typography.xs, fontWeight: '700' },
  completedBadge:  { backgroundColor: colors.statusActive, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  completedText:   { fontSize: typography.xs, fontWeight: '700', color: colors.statusActiveText },
  courseTitle:     { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 10 },
  progressRow:     { gap: 6 },
  progressTrack:   { height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:    { height: 6, backgroundColor: colors.primary, borderRadius: radius.full },
  progressLabel:   { fontSize: typography.xs, color: colors.midGrey },
  duration:        { fontSize: typography.xs, color: colors.lightGrey },
  enrollBtn:       { alignSelf: 'flex-start', backgroundColor: colors.primaryBg, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.md },
  enrollBtnText:   { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
});
