import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

export default function TrainingModuleScreen({ navigation, route }) {
  const id = route.params?.module?.id;
  const courseTitle = route.params?.courseTitle || 'Course';

  const { data: module, isLoading } = useQuery({
    queryKey: ['training-module', id],
    queryFn: () => client.get(`/training/modules/${id}`).then(r => r.data),
    enabled: !!id,
    initialData: route.params?.module,
  });

  const qc = useQueryClient();
  const complete = useMutation({
    mutationFn: (answers) => client.post(`/training/modules/${id}/complete`, { quiz_answers: answers }).then(r => r.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
      Alert.alert(result.passed ? '✅ Passed!' : '❌ Failed', `Score: ${result.score}%`);
      if (result.passed) navigation.goBack();
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Submission failed'),
  });

  const mod = module || route.params?.module || {};
  const isQuiz = mod.type === 'quiz';
  const questions = mod.questions || [];

  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [marked, setMarked] = useState(mod.completed || false);

  const handleSubmit = () => {
    if (!selected) return;
    if (questions.length > 0) {
      complete.mutate([{ question_id: questions[0]?.id, answer: selected }]);
    } else {
      setSubmitted(true);
    }
  };

  // For display: use first question from API or fall back to content
  const firstQuestion = questions[0];
  const questionText = firstQuestion?.text || mod.content || '';
  const options = firstQuestion?.options || [];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={mod.title || 'Module'} subtitle={courseTitle} onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={mod.title || 'Module'}
        subtitle={courseTitle}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.contentArea, shadow.sm]}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>
              {mod.type === 'video' ? '🎥' : mod.type === 'pdf' ? '📄' : mod.type === 'quiz' ? '❓' : '📝'}
            </Text>
            <Text style={styles.typeLabel}>{mod.type?.toUpperCase()} · {mod.duration}</Text>
          </View>
          {!isQuiz && (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>
                {mod.type === 'video' ? '▶️' : mod.type === 'pdf' ? '📄' : '📝'}
              </Text>
              <Text style={styles.placeholderText}>
                {mod.type === 'video' ? 'Video player would appear here' : mod.type === 'pdf' ? 'PDF viewer would appear here' : 'Content text would appear here'}
              </Text>
            </View>
          )}
        </View>

        {isQuiz && (
          <View style={[styles.quizCard, shadow.sm]}>
            <Text style={styles.questionText}>{questionText}</Text>
            {options.map((opt) => {
              const optId = opt.id || opt.key;
              let btnStyle = styles.optionBtn;
              let textStyle = styles.optionText;
              if (submitted) {
                if (opt.correct) { btnStyle = styles.optionCorrect; textStyle = styles.optionCorrectText; }
                else if (optId === selected) { btnStyle = styles.optionWrong; textStyle = styles.optionWrongText; }
              } else if (selected === optId) {
                btnStyle = styles.optionSelected;
                textStyle = styles.optionSelectedText;
              }
              return (
                <TouchableOpacity
                  key={optId}
                  style={[styles.option, btnStyle]}
                  onPress={() => !submitted && !complete.isPending && setSelected(optId)}
                  activeOpacity={0.85}
                >
                  <View style={styles.optionLabel}><Text style={[styles.optionId, textStyle]}>{optId}</Text></View>
                  <Text style={[styles.optionText, textStyle, { flex: 1 }]}>{opt.text}</Text>
                </TouchableOpacity>
              );
            })}
            {submitted ? (
              <View style={[styles.resultBanner, styles.resultCorrect]}>
                <Text style={styles.resultText}>Answer submitted!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, (!selected || complete.isPending) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!selected || complete.isPending}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>{complete.isPending ? 'Submitting...' : 'Submit Answer'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.navBtnText}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.navBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {!isQuiz && (
          <TouchableOpacity
            style={[styles.markBtn, (marked || complete.isPending) && styles.markBtnDone]}
            onPress={() => {
              if (!marked) {
                complete.mutate([]);
                setMarked(true);
              }
            }}
            disabled={marked || complete.isPending}
            activeOpacity={0.85}
          >
            <Text style={[styles.markBtnText, marked && styles.markBtnTextDone]}>
              {marked ? '✓ Marked Complete' : complete.isPending ? 'Saving...' : 'Mark Complete'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.background },
  scroll:             { flex: 1 },
  content:            { padding: 16, gap: 16 },
  contentArea:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  typeRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  typeIcon:           { fontSize: 22 },
  typeLabel:          { fontSize: typography.sm, color: colors.midGrey, fontWeight: '600' },
  placeholder:        { height: 180, backgroundColor: colors.inputBg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 10 },
  placeholderIcon:    { fontSize: 40 },
  placeholderText:    { fontSize: typography.sm, color: colors.lightGrey, textAlign: 'center' },
  quizCard:           { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  questionText:       { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 16, lineHeight: 22 },
  option:             { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: 12, marginBottom: 10 },
  optionBtn:          { borderColor: colors.border, backgroundColor: colors.white },
  optionSelected:     { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  optionCorrect:      { borderColor: colors.success, backgroundColor: '#E8F5E2' },
  optionWrong:        { borderColor: colors.error, backgroundColor: '#FFF0F0' },
  optionLabel:        { width: 26, height: 26, borderRadius: radius.full, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  optionId:           { fontSize: typography.sm, fontWeight: '800', color: colors.dark },
  optionText:         { fontSize: typography.sm, color: colors.dark },
  optionSelectedText: { color: colors.primary },
  optionCorrectText:  { color: colors.success },
  optionWrongText:    { color: colors.error },
  resultBanner:       { borderRadius: radius.md, padding: 12, marginTop: 6 },
  resultCorrect:      { backgroundColor: '#E8F5E2' },
  resultWrong:        { backgroundColor: '#FFF0F0' },
  resultText:         { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  submitBtn:          { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  submitBtnDisabled:  { backgroundColor: colors.border },
  submitBtnText:      { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
  navRow:             { flexDirection: 'row', gap: 12 },
  navBtn:             { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  navBtnText:         { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  markBtn:            { backgroundColor: colors.primaryBg, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary },
  markBtnDone:        { backgroundColor: colors.primary },
  markBtnText:        { fontSize: typography.md, fontWeight: '800', color: colors.primary },
  markBtnTextDone:    { color: colors.white },
});
