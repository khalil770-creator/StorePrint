import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { key: 'text',  label: '📖 Text & Images' },
  { key: 'video', label: '🎬 Video' },
  { key: 'quiz',  label: '📝 Quiz Only' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeQuestion() {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: '',
    type: 'multiple',        // 'multiple' | 'truefalse'
    options: ['', '', '', ''],
    correctIndex: 0,         // for multiple choice: index 0-3
    correctTF: 'true',       // for true/false
  };
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onChange, onDelete }) {
  const isMultiple = question.type === 'multiple';

  const updateOption = (i, val) => {
    const opts = [...question.options];
    opts[i] = val;
    onChange({ ...question, options: opts });
  };

  return (
    <View style={qStyles.card}>
      {/* Header */}
      <View style={qStyles.header}>
        <Text style={qStyles.qNum}>Q{index + 1}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={qStyles.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Question text */}
      <TextInput
        style={qStyles.qInput}
        placeholder="Enter question..."
        placeholderTextColor={colors.lightGrey}
        value={question.text}
        onChangeText={v => onChange({ ...question, text: v })}
        multiline
      />

      {/* Type chips */}
      <Text style={qStyles.label}>Question Type</Text>
      <View style={qStyles.typeChips}>
        {[
          { key: 'multiple',  label: '☑️ Multiple Choice' },
          { key: 'truefalse', label: '✅ True/False' },
        ].map(t => {
          const active = question.type === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[qStyles.typeChip, active && qStyles.typeChipActive]}
              onPress={() => onChange({ ...question, type: t.key })}
              activeOpacity={0.75}
            >
              <Text style={[qStyles.typeChipText, active && qStyles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Options */}
      {isMultiple ? (
        <>
          <Text style={qStyles.label}>Options — tap a row to mark correct answer</Text>
          {['A', 'B', 'C', 'D'].map((letter, i) => {
            const isCorrect = question.correctIndex === i;
            return (
              <TouchableOpacity
                key={letter}
                style={[qStyles.optionRow, isCorrect && qStyles.optionRowCorrect]}
                onPress={() => onChange({ ...question, correctIndex: i })}
                activeOpacity={0.8}
              >
                <View style={[qStyles.radio, isCorrect && qStyles.radioSelected]}>
                  {isCorrect && <View style={qStyles.radioDot} />}
                </View>
                <Text style={qStyles.optionLetter}>{letter}</Text>
                <TextInput
                  style={qStyles.optionInput}
                  placeholder={`Option ${letter}...`}
                  placeholderTextColor={colors.lightGrey}
                  value={question.options[i]}
                  onChangeText={v => updateOption(i, v)}
                />
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <>
          <Text style={qStyles.label}>Correct Answer</Text>
          <View style={qStyles.tfRow}>
            {['true', 'false'].map(val => {
              const active = question.correctTF === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[qStyles.tfChip, active && qStyles.tfChipActive]}
                  onPress={() => onChange({ ...question, correctTF: val })}
                  activeOpacity={0.75}
                >
                  <Text style={[qStyles.tfChipText, active && qStyles.tfChipTextActive]}>
                    {val === 'true' ? '✓ True' : '✗ False'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const qStyles = StyleSheet.create({
  card:            {
    backgroundColor: colors.inputBg, borderRadius: radius.md,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  header:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qNum:            {
    flex: 1, fontSize: typography.sm, fontWeight: '800', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  deleteBtn:       { fontSize: 13, color: colors.error, fontWeight: '700', padding: 4 },
  qInput:          {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 9, fontSize: typography.md,
    color: colors.dark, backgroundColor: colors.white, minHeight: 48,
    textAlignVertical: 'top', marginBottom: 10,
  },
  label:           {
    fontSize: typography.xs, fontWeight: '700', color: colors.midGrey,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  typeChips:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip:        {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  typeChipActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText:    { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  typeChipTextActive: { color: colors.white, fontWeight: '700' },

  optionRow:       {
    flexDirection: 'row', alignItems: 'center', padding: 8,
    borderRadius: radius.sm, marginBottom: 6, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
  },
  optionRowCorrect: { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  radio:           {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected:   { borderColor: colors.primary },
  radioDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  optionLetter:    {
    fontSize: typography.sm, fontWeight: '700', color: colors.midGrey,
    marginRight: 8, width: 16,
  },
  optionInput:     { flex: 1, fontSize: typography.sm, color: colors.dark, paddingVertical: 2 },

  tfRow:           { flexDirection: 'row', gap: 10 },
  tfChip:          {
    flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  tfChipActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  tfChipText:      { fontSize: typography.sm, fontWeight: '700', color: colors.midGrey },
  tfChipTextActive:{ color: colors.white },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CourseModuleBuilderScreen({ navigation, route }) {
  const { module: initModule, onSave } = route?.params ?? {};

  const [mod, setMod] = useState(() => ({
    id:          initModule?.id          ?? `mod_${Date.now()}`,
    title:       initModule?.title       ?? '',
    contentType: initModule?.contentType ?? 'text',
    hasQuiz:     initModule?.hasQuiz     ?? true,
    content:     initModule?.content     ?? '',
    videoUrl:    initModule?.videoUrl    ?? '',
    questions:   initModule?.questions   ?? [],
  }));

  const set = (key, val) => setMod(prev => ({ ...prev, [key]: val }));

  const addQuestion = () => set('questions', [...mod.questions, makeQuestion()]);

  const updateQuestion = (id, updated) =>
    set('questions', mod.questions.map(q => q.id === id ? updated : q));

  const deleteQuestion = (id) =>
    set('questions', mod.questions.filter(q => q.id !== id));

  const handleSave = () => {
    onSave?.(mod);
    navigation.goBack();
  };

  const showContent = mod.contentType === 'text' || mod.contentType === 'video';
  const showVideo   = mod.contentType === 'video';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Edit Module"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Content Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Module Content</Text>

          {/* Module title */}
          <Text style={styles.label}>Module Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Introduction to Brand Identity"
            placeholderTextColor={colors.lightGrey}
            value={mod.title}
            onChangeText={v => set('title', v)}
          />

          {/* Content type */}
          <Text style={styles.label}>Content Type</Text>
          <View style={styles.chips}>
            {CONTENT_TYPES.map(ct => {
              const active = mod.contentType === ct.key;
              return (
                <TouchableOpacity
                  key={ct.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => set('contentType', ct.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {ct.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content body */}
          {showContent && (
            <>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.contentArea]}
                placeholder="Enter module content, key learning points, instructions..."
                placeholderTextColor={colors.lightGrey}
                value={mod.content}
                onChangeText={v => set('content', v)}
                multiline
                textAlignVertical="top"
              />
            </>
          )}

          {/* Video URL */}
          {showVideo && (
            <>
              <Text style={styles.label}>Video URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={colors.lightGrey}
                value={mod.videoUrl}
                onChangeText={v => set('videoUrl', v)}
                autoCapitalize="none"
                keyboardType="url"
              />
            </>
          )}
        </View>

        {/* ── Quiz Section ── */}
        <View style={styles.section}>
          <View style={styles.quizHeader}>
            <View style={styles.quizHeaderLeft}>
              <Text style={styles.sectionTitle}>Quiz</Text>
              <Text style={styles.quizSubtitle}>Include a quiz for this module</Text>
            </View>
            <Switch
              value={mod.hasQuiz}
              onValueChange={v => set('hasQuiz', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={mod.hasQuiz ? colors.primary : colors.lightGrey}
            />
          </View>

          {mod.hasQuiz && (
            <>
              <View style={styles.quizTitleRow}>
                <Text style={styles.quizQTitle}>Quiz Questions</Text>
                <TouchableOpacity style={styles.addQBtn} onPress={addQuestion} activeOpacity={0.8}>
                  <Text style={styles.addQBtnText}>＋ Add Question</Text>
                </TouchableOpacity>
              </View>

              {mod.questions.length === 0 && (
                <View style={styles.emptyQ}>
                  <Text style={styles.emptyQText}>
                    No questions yet. Tap "＋ Add Question" to begin.
                  </Text>
                </View>
              )}

              {mod.questions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  onChange={updated => updateQuestion(q.id, updated)}
                  onDelete={() => deleteQuestion(q.id)}
                />
              ))}

              {mod.questions.length > 0 && (
                <TouchableOpacity
                  style={styles.addQBtnOutline}
                  onPress={addQuestion}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addQBtnOutlineText}>＋ Add Question</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── CTA ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Module</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: colors.background },
  scroll:            { padding: 16, paddingBottom: 40 },

  section:           {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 16, marginBottom: 14, ...shadow.sm,
  },
  sectionTitle:      {
    fontSize: typography.md, fontWeight: '800', color: colors.dark,
    marginBottom: 4,
  },

  label:             {
    fontSize: typography.xs, fontWeight: '700', color: colors.midGrey,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6,
  },

  input:             {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: typography.md,
    color: colors.dark, backgroundColor: colors.inputBg,
  },
  contentArea:       { minHeight: 120, paddingTop: 10 },

  chips:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:              {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipActive:        { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:          { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  chipTextActive:    { color: colors.white, fontWeight: '700' },

  quizHeader:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  quizHeaderLeft:    { flex: 1 },
  quizSubtitle:      { fontSize: typography.xs, color: colors.midGrey, marginBottom: 12 },

  quizTitleRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quizQTitle:        { flex: 1, fontSize: typography.sm, fontWeight: '700', color: colors.darkGrey },
  addQBtn:           {
    backgroundColor: colors.primary, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: radius.sm,
  },
  addQBtnText:       { color: colors.white, fontSize: typography.xs, fontWeight: '700' },

  emptyQ:            {
    padding: 20, alignItems: 'center', borderWidth: 1,
    borderColor: colors.border, borderRadius: radius.md, borderStyle: 'dashed',
  },
  emptyQText:        { fontSize: typography.sm, color: colors.lightGrey, textAlign: 'center' },

  addQBtnOutline:    {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  addQBtnOutlineText:{ color: colors.primary, fontSize: typography.sm, fontWeight: '700' },

  saveBtn:           {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 16, alignItems: 'center', ...shadow.green,
  },
  saveBtnText:       { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
