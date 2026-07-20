import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const MODULE_ICONS = { video: '🎥', pdf: '📄', quiz: '❓', text: '📝' };

const CAT_COLOR = {
  Onboarding: '#4A90E2', 'Brand Culture': '#9B59B6', Compliance: '#F5A623', Safety: '#E74C3C',
};

export default function TrainingCourseScreen({ navigation, route }) {
  const id = route.params?.course?.id;
  const { data: course, isLoading } = useQuery({
    queryKey: ['training-course', id],
    queryFn: () => client.get(`/training/courses/${id}`).then(r => r.data),
    enabled: !!id,
    initialData: route.params?.course,
  });

  const qc = useQueryClient();
  const enroll = useMutation({
    mutationFn: () => client.post(`/training/courses/${id}/enroll`, {}).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-enrollments'] }),
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Enrollment failed'),
  });

  const modules = course?.modules || [];
  const completedCount = modules.filter((m) => m.completed).length;
  const progress = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;
  const catColor = CAT_COLOR[course?.category] || colors.primary;

  const getActionLabel = () => {
    if (progress === 0) return 'Enroll & Start';
    if (progress === 100) return 'View Certificate';
    return 'Continue Course';
  };

  const handleAction = () => {
    if (progress === 0) {
      enroll.mutate();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={course?.title || 'Course'} onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={course?.title || 'Course'} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.heroCard, shadow.md]}>
          <View style={styles.heroRow}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
              <Text style={[styles.catText, { color: catColor }]}>{course?.category || ''}</Text>
            </View>
            {!!course?.duration_min && <Text style={styles.meta}>🕐 {course.duration_min} min</Text>}
            {!!course?.pass_mark && <Text style={styles.meta}>🎯 Pass: {course.pass_mark}%</Text>}
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{progress}% complete ({completedCount}/{modules.length} modules)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Modules</Text>
        {modules.map((mod, idx) => (
          <TouchableOpacity
            key={mod.id}
            style={[styles.moduleCard, shadow.sm]}
            onPress={() => navigation.navigate('TrainingModule', { module: mod, courseTitle: course.title })}
            activeOpacity={0.85}
          >
            <View style={[styles.moduleIconWrap, { backgroundColor: mod.completed ? colors.statusActive : colors.inputBg }]}>
              <Text style={styles.moduleIcon}>{MODULE_ICONS[mod.type] || '📝'}</Text>
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleMeta}>{mod.type.toUpperCase()} · {mod.duration}</Text>
            </View>
            <View style={styles.moduleStatus}>
              {mod.completed
                ? <Text style={styles.checkmark}>✓</Text>
                : <Text style={styles.moduleIdx}>{idx + 1}</Text>
              }
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.actionBtn, shadow.green]}
          onPress={handleAction}
          disabled={enroll.isPending}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>{enroll.isPending ? 'Enrolling...' : getActionLabel()}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { flex: 1 },
  content:        { padding: 16, paddingTop: 16 },
  heroCard:       { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginBottom: 20 },
  heroRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  catText:        { fontSize: typography.xs, fontWeight: '700' },
  meta:           { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  progressRow:    { gap: 6 },
  progressTrack:  { height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:   { height: 8, backgroundColor: colors.primary, borderRadius: radius.full },
  progressLabel:  { fontSize: typography.xs, color: colors.midGrey },
  sectionTitle:   { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 12 },
  moduleCard:     { backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10 },
  moduleIconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  moduleIcon:     { fontSize: 20 },
  moduleInfo:     { flex: 1 },
  moduleTitle:    { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  moduleMeta:     { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  moduleStatus:   { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  checkmark:      { fontSize: 14, color: colors.primary, fontWeight: '800' },
  moduleIdx:      { fontSize: typography.sm, color: colors.midGrey, fontWeight: '700' },
  actionBtn:      { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  actionBtnText:  { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
