/**
 * CXConductSurveyScreen
 * Store Manager conducts a CX survey on behalf of a customer.
 * Renders questions one at a time, collects answers, submits to API.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';

function showAlert(title, message, onOk) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message || ''}`);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

// ─── Answer components per question type ─────────────────────────────────────

function RatingInput({ max, value, onChange, color }) {
  return (
    <View style={styles.ratingRow}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <TouchableOpacity
          key={n}
          style={[styles.ratingBtn, value === n && { backgroundColor: color, borderColor: color }]}
          onPress={() => onChange(n)}
          activeOpacity={0.8}
        >
          <Text style={[styles.ratingBtnText, value === n && { color: colors.white }]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function YesNoInput({ value, onChange }) {
  return (
    <View style={styles.yesNoRow}>
      {['Yes', 'No'].map(opt => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.yesNoBtn,
            value === opt && { backgroundColor: opt === 'Yes' ? colors.primary : colors.error, borderColor: 'transparent' },
          ]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.yesNoBtnText, value === opt && { color: colors.white }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MultiChoiceInput({ options, value, onChange }) {
  return (
    <View style={styles.multiCol}>
      {(options || []).map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.multiBtn, value === opt && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.multiBtnText, value === opt && { color: colors.primary }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CXConductSurveyScreen({ navigation, route }) {
  const surveyParam = route.params?.survey;
  const { user }    = useAuthStore();

  const { data: survey, isLoading } = useQuery({
    queryKey: ['cx-survey', surveyParam?.id],
    queryFn:  () => client.get(`/cx/surveys/${surveyParam?.id}`).then(r => r.data),
    enabled:  !!surveyParam?.id,
    initialData: surveyParam,
  });

  const questions = useMemo(() => {
    let qs = survey?.questions || [];
    if (typeof qs === 'string') { try { qs = JSON.parse(qs); } catch { qs = []; } }
    return qs;
  }, [survey]);

  const [answers, setAnswers] = useState({});  // { index: value }
  const [verbatim, setVerbatim] = useState('');

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }));

  // Derive NPS / CSAT scores from answers
  const npsIdx   = questions.findIndex(q => q.type === 'rating_10' || (q.type === 'rating' && q.scale === 10));
  const csatIdx  = questions.findIndex(q => q.type === 'rating_5'  || (q.type === 'rating' && q.scale === 5));
  const npsScore  = npsIdx  >= 0 ? answers[npsIdx]  : undefined;
  const csatScore = csatIdx >= 0 ? answers[csatIdx] : undefined;

  const answeredCount = questions.filter((_, i) => answers[i] !== undefined).length;
  const allDone   = questions.length > 0 && answeredCount === questions.length;
  const progress  = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  const submitMutation = useMutation({
    mutationFn: () => client.post(`/cx/surveys/${survey.id}/respond`, {
      store_id:    user?.store_ids?.[0] || null,
      channel:     'in-store',
      nps_score:   npsScore  !== undefined ? Number(npsScore)  : undefined,
      csat_score:  csatScore !== undefined ? Number(csatScore) : undefined,
      answers,
      verbatim:    verbatim.trim() || null,
    }).then(r => r.data),
    onSuccess: () => showAlert(
      '✅ Thank You!',
      survey?.thank_you_message || 'Customer feedback has been recorded.',
      () => navigation.goBack(),
    ),
    onError: (err) => showAlert('Error', err?.response?.data?.error || 'Failed to submit survey.'),
  });

  const handleSubmit = () => {
    if (!allDone) {
      showAlert('Incomplete', `${questions.length - answeredCount} question(s) still unanswered.`);
      return;
    }
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Conduct Survey" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const typeColor = survey?.type === 'nps' ? '#1E40AF' : survey?.type === 'csat' ? '#E65100' : colors.primary;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={survey?.title || 'Survey'}
        subtitle={`${(survey?.type || 'custom').toUpperCase()} · ${questions.length} questions`}
        onBack={() => navigation.goBack()}
      />

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: typeColor }]} />
        </View>
        <Text style={styles.progressText}>{answeredCount}/{questions.length}</Text>
      </View>

      {survey?.description ? (
        <View style={styles.introBanner}>
          <Text style={styles.introText}>{survey.description}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {questions.map((q, idx) => {
          const val = answers[idx];
          const isDone = val !== undefined;
          const scale = q.scale || (q.type === 'rating_10' ? 10 : 5);
          return (
            <View key={idx} style={[styles.qCard, shadow.sm, isDone && styles.qCardDone]}>
              <View style={styles.qHeader}>
                <View style={[styles.qNum, { backgroundColor: isDone ? colors.primary : colors.border }]}>
                  <Text style={styles.qNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.qType}>
                  {q.type === 'multiple_choice' ? 'Multiple Choice'
                    : q.type === 'rating' ? `Rating 1–${scale}`
                    : q.type?.replace(/_/g, ' ')}
                </Text>
                {q.required && <Text style={styles.qRequired}>Required</Text>}
              </View>
              <Text style={styles.qText}>{q.text}</Text>

              {(q.type === 'rating' || q.type === 'rating_10' || q.type === 'rating_5') && (
                <RatingInput max={scale} value={val} onChange={v => setAnswer(idx, v)} color={typeColor} />
              )}
              {(q.type === 'multiple_choice' || q.type === 'multi') && (
                <MultiChoiceInput options={q.options || []} value={val} onChange={v => setAnswer(idx, v)} />
              )}
              {(q.type === 'yes_no') && (
                <YesNoInput value={val} onChange={v => setAnswer(idx, v)} />
              )}
              {q.type === 'text' && (
                <TextInput
                  style={styles.textAnswer}
                  placeholder="Type answer here…"
                  placeholderTextColor={colors.lightGrey}
                  value={val || ''}
                  onChangeText={v => setAnswer(idx, v || undefined)}
                  multiline
                  textAlignVertical="top"
                />
              )}
            </View>
          );
        })}

        {/* Verbatim open comment */}
        <View style={[styles.qCard, shadow.sm]}>
          <Text style={styles.qText}>Any additional comments? (optional)</Text>
          <TextInput
            style={styles.textAnswer}
            placeholder="Customer's additional feedback…"
            placeholderTextColor={colors.lightGrey}
            value={verbatim}
            onChangeText={setVerbatim}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: typeColor }, (!allDone || submitMutation.isPending) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!allDone || submitMutation.isPending}
          activeOpacity={0.85}
        >
          {submitMutation.isPending
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.submitText}>Submit Survey →</Text>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.background },
  progressWrap:  { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  progressBg:    { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  progressFill:  { height: 6, borderRadius: 3 },
  progressText:  { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600', minWidth: 36, textAlign: 'right' },
  introBanner:   { marginHorizontal: 16, marginBottom: 4, padding: 12, backgroundColor: colors.primaryBg, borderRadius: radius.md },
  introText:     { fontSize: typography.sm, color: colors.primary, lineHeight: 18 },
  scroll:        { flex: 1 },
  content:       { padding: 16, gap: 12, paddingBottom: 20 },

  qCard:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  qCardDone:     { borderWidth: 1.5, borderColor: colors.primary + '40' },
  qHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  qNum:          { width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  qNumText:      { fontSize: typography.xs, color: colors.white, fontWeight: '800' },
  qType:         { flex: 1, fontSize: typography.xs, color: colors.midGrey, fontWeight: '600', textTransform: 'capitalize' },
  qRequired:     { fontSize: typography.xs, color: colors.error, fontWeight: '700' },
  qText:         { fontSize: typography.sm, fontWeight: '600', color: colors.dark, lineHeight: 20, marginBottom: 14 },

  ratingRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ratingBtn:     { width: 38, height: 38, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  ratingBtnText: { fontSize: typography.sm, fontWeight: '700', color: colors.dark },

  yesNoRow:      { flexDirection: 'row', gap: 10 },
  yesNoBtn:      { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  yesNoBtnText:  { fontSize: typography.sm, fontWeight: '700', color: colors.dark },

  multiCol:      { gap: 8 },
  multiBtn:      { paddingVertical: 11, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  multiBtnText:  { fontSize: typography.sm, fontWeight: '600', color: colors.dark },

  textAnswer:    { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: typography.sm, color: colors.dark, minHeight: 80, backgroundColor: colors.inputBg },

  submitBtn:     { borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitDisabled:{ opacity: 0.45 },
  submitText:    { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
