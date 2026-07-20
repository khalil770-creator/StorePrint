import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const SENTIMENT_COLOR = { positive: colors.success, neutral: colors.info, negative: colors.error };
const SENTIMENT_BG = { positive: colors.statusActive, neutral: '#EEF4FF', negative: '#FFF0F0' };

export default function CXSurveyDetailScreen({ navigation, route }) {
  const id = route.params?.survey?.id;
  const { data: survey, isLoading } = useQuery({
    queryKey: ['cx-survey', id],
    queryFn: () => client.get(`/cx/surveys/${id}`).then(r => r.data),
    enabled: !!id,
    initialData: route.params?.survey,
  });

  const submit = useMutation({
    mutationFn: (answers) => client.post(`/cx/surveys/${id}/respond`, { answers }).then(r => r.data),
    onSuccess: () => Alert.alert('Thank you!', survey?.thank_you_message || 'Your feedback has been recorded.', [{ text: 'OK', onPress: () => navigation.goBack() }]),
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Submit failed'),
  });

  const questions = survey?.questions || [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={survey?.title || 'Survey'} subtitle="Loading..." onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={survey?.title || 'Survey'} subtitle={`${survey?.type || ''} Survey`} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadow.sm]}>
            <Text style={styles.statValue}>{survey?.responses || survey?.response_count || 0}</Text>
            <Text style={styles.statLabel}>Total Responses</Text>
          </View>
          <View style={[styles.statCard, shadow.sm]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{survey?.avgScore || survey?.avg_score || 0}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        <View style={[styles.chartCard, shadow.sm]}>
          <Text style={styles.cardTitle}>Sentiment Chart</Text>
          {[{ label: 'Positive', pct: 62, color: colors.success }, { label: 'Neutral', pct: 24, color: colors.info }, { label: 'Negative', pct: 14, color: colors.error }].map((s) => (
            <View key={s.label} style={styles.sentRow}>
              <Text style={styles.sentLabel}>{s.label}</Text>
              <View style={styles.sentTrack}>
                <View style={[styles.sentFill, { width: `${s.pct}%`, backgroundColor: s.color }]} />
              </View>
              <Text style={[styles.sentPct, { color: s.color }]}>{s.pct}%</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Survey Questions</Text>
        {questions.map((q, idx) => (
          <View key={q.id} style={[styles.questionCard, shadow.sm]}>
            <View style={styles.qHeader}>
              <View style={styles.qNumBadge}><Text style={styles.qNum}>{idx + 1}</Text></View>
              <View style={[styles.qTypeBadge, { backgroundColor: colors.primaryBg }]}>
                <Text style={styles.qTypeText}>{q.type}</Text>
              </View>
            </View>
            <Text style={styles.questionText}>{q.text}</Text>
          </View>
        ))}

        <TouchableOpacity style={[styles.viewAllBtn, shadow.sm]} activeOpacity={0.85}>
          <Text style={styles.viewAllBtnText}>View All {survey?.responses || survey?.response_count || 0} Responses →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.background },
  scroll:            { flex: 1 },
  content:           { padding: 16, paddingTop: 16, gap: 14 },
  statsRow:          { flexDirection: 'row', gap: 10 },
  statCard:          { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  statValue:         { fontSize: typography.xl, fontWeight: '900', color: colors.dark },
  statLabel:         { fontSize: typography.xs, color: colors.midGrey, marginTop: 3, textAlign: 'center' },
  chartCard:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:         { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  sentRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sentLabel:         { width: 65, fontSize: typography.sm, color: colors.dark, fontWeight: '600' },
  sentTrack:         { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginHorizontal: 8 },
  sentFill:          { height: 8, borderRadius: radius.full },
  sentPct:           { width: 36, fontSize: typography.sm, fontWeight: '800', textAlign: 'right' },
  sectionTitle:      { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  questionCard:      { backgroundColor: colors.white, borderRadius: radius.md, padding: 14 },
  qHeader:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  qNumBadge:         { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qNum:              { fontSize: typography.xs, color: colors.white, fontWeight: '800' },
  qTypeBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  qTypeText:         { fontSize: typography.xs, color: colors.primary, fontWeight: '700' },
  questionText:      { fontSize: typography.sm, color: colors.dark, lineHeight: 20 },
  responseCard:      { backgroundColor: colors.white, borderRadius: radius.md, padding: 14 },
  responseTop:       { flexDirection: 'row', gap: 8, marginBottom: 10 },
  scoreBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  scoreText:         { fontSize: typography.xs, fontWeight: '700' },
  sentimentChip:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  sentimentChipText: { fontSize: typography.xs, fontWeight: '700', textTransform: 'capitalize' },
  verbatim:          { fontSize: typography.sm, color: colors.dark, lineHeight: 19, fontStyle: 'italic' },
  viewAllBtn:        { backgroundColor: colors.white, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary },
  viewAllBtnText:    { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
});
