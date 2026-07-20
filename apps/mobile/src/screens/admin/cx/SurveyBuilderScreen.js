import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

// ─── Constants ────────────────────────────────────────────────────────────────
const SURVEY_TYPES = [
  { key: 'nps',    label: 'NPS' },
  { key: 'csat',   label: 'CSAT' },
  { key: 'custom', label: 'Custom' },
];

const DEPLOY_METHODS = [
  { key: 'qr',   label: '📲  QR Code' },
  { key: 'link', label: '🔗  Link' },
];

const QUESTION_TYPES = [
  { key: 'rating_10', label: '⭐ Rating 1–10' },
  { key: 'rating_5',  label: '⭐ Rating 1–5' },
  { key: 'yes_no',    label: '👍 Yes/No' },
  { key: 'text',      label: '📝 Text Answer' },
  { key: 'multi',     label: '☑️ Multiple Choice' },
];

const NPS_SYSTEM_QUESTION = {
  id: 'q_nps',
  text: 'How likely are you to recommend us to a friend or family? (0–10)',
  type: 'rating_10',
  required: true,
  isSystem: true,
  options: [],
};

const CSAT_SYSTEM_QUESTION = {
  id: 'q_csat',
  text: 'How satisfied were you with your visit today? (1–5)',
  type: 'rating_5',
  required: true,
  isSystem: true,
  options: [],
};

let _qCounter = 1;
function makeQuestionId() {
  return `q_${Date.now()}_${_qCounter++}`;
}

function buildInitialState(route) {
  const { mode, survey } = route?.params || {};
  if (mode === 'edit' && survey) {
    // questions may be a JSON string from DB
    let questions = survey.questions || [];
    if (typeof questions === 'string') {
      try { questions = JSON.parse(questions); } catch { questions = []; }
    }
    return {
      name:            survey.title || survey.name || '',
      type:            (survey.type || 'nps').toLowerCase(),
      description:     survey.description || '',
      deployMethod:    survey.deploy_method || survey.deploy || 'qr',
      thankYouMessage: survey.thank_you_message || 'Thank you for your feedback!',
      allowAnonymous:  survey.allow_anonymous !== false,
      questions:       questions.length ? questions : [{ ...NPS_SYSTEM_QUESTION }],
    };
  }
  return {
    name: '',
    type: 'nps',
    description: '',
    deployMethod: 'qr',
    thankYouMessage: 'Thank you for your feedback!',
    allowAnonymous: true,
    questions: [{ ...NPS_SYSTEM_QUESTION }],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function ChipRow({ options, value, onSelect }) {
  return (
    <View style={styles.chipRow}>
      {options.map(opt => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function QuestionCard({ question, index, onUpdate, onDelete }) {
  const isMulti = question.type === 'multi';

  function updateField(field, val) {
    onUpdate({ ...question, [field]: val });
  }

  function addOption() {
    if (question.options.length >= 5) return;
    onUpdate({ ...question, options: [...question.options, ''] });
  }

  function updateOption(i, val) {
    const opts = [...question.options];
    opts[i] = val;
    onUpdate({ ...question, options: opts });
  }

  function removeOption(i) {
    const opts = question.options.filter((_, idx) => idx !== i);
    onUpdate({ ...question, options: opts });
  }

  return (
    <View style={styles.questionCard}>
      {/* Card header: number + delete */}
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.questionLabel}>Question {index + 1}</Text>
        <TouchableOpacity
          style={[styles.deleteBtn, question.isSystem && styles.deleteBtnDisabled]}
          onPress={() => !question.isSystem && onDelete(question.id)}
          disabled={question.isSystem}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.deleteBtnText, question.isSystem && styles.deleteBtnTextDisabled]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      {/* Question text */}
      <TextInput
        style={[styles.input, question.isSystem && styles.inputReadOnly]}
        value={question.text}
        onChangeText={val => updateField('text', val)}
        placeholder="Enter question text…"
        placeholderTextColor={colors.lightGrey}
        multiline
        editable={!question.isSystem}
      />

      {/* Question type chips */}
      {!question.isSystem && (
        <>
          <Text style={styles.fieldLabel}>Answer type</Text>
          <View style={styles.chipRow}>
            {QUESTION_TYPES.map(qt => {
              const active = question.type === qt.key;
              return (
                <TouchableOpacity
                  key={qt.key}
                  style={[styles.chip, styles.chipSm, active && styles.chipActive]}
                  onPress={() => updateField('type', qt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, styles.chipTextSm, active && styles.chipTextActive]}>
                    {qt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Multiple choice options */}
      {isMulti && (
        <View style={styles.optionsWrap}>
          <Text style={styles.fieldLabel}>Options</Text>
          {question.options.map((opt, i) => (
            <View key={i} style={styles.optionRow}>
              <TextInput
                style={[styles.input, styles.optionInput]}
                value={opt}
                onChangeText={val => updateOption(i, val)}
                placeholder={`Option ${i + 1}`}
                placeholderTextColor={colors.lightGrey}
              />
              <TouchableOpacity
                style={styles.optionDelete}
                onPress={() => removeOption(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.optionDeleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          {question.options.length < 5 && (
            <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
              <Text style={styles.addOptionText}>＋ Add Option</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Required toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Required</Text>
        <Switch
          value={question.required}
          onValueChange={val => updateField('required', val)}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={question.required ? colors.primary : colors.lightGrey}
          disabled={question.isSystem}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SurveyBuilderScreen({ navigation, route }) {
  const { mode, survey: existing } = route?.params || { mode: 'create' };
  const qc  = useQueryClient();
  const [form, setForm] = useState(() => buildInitialState(route));

  // ── API mutation ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (body) => existing?.id
      ? client.put(`/cx/surveys/${existing.id}`, body).then(r => r.data)
      : client.post('/cx/surveys', body).then(r => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['cx-surveys-admin'] });
      qc.invalidateQueries({ queryKey: ['cx-surveys'] });
      Alert.alert(
        variables.is_active ? 'Survey Published' : 'Draft Saved',
        variables.is_active ? `"${variables.title}" is now live.` : `"${variables.title}" saved as draft.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (err) => Alert.alert('Error', err?.response?.data?.error || 'Failed to save survey.'),
  });

  // ── Type selection: auto-add/replace system question ──────────────────────
  const handleTypeChange = useCallback((newType) => {
    setForm(prev => {
      // Remove any existing system questions
      const nonSystem = prev.questions.filter(q => !q.isSystem);
      let systemQ = null;
      if (newType === 'nps')  systemQ = { ...NPS_SYSTEM_QUESTION };
      if (newType === 'csat') systemQ = { ...CSAT_SYSTEM_QUESTION };
      const questions = systemQ ? [systemQ, ...nonSystem] : nonSystem;
      return { ...prev, type: newType, questions };
    });
  }, []);

  // ── Questions CRUD ─────────────────────────────────────────────────────────
  const addQuestion = useCallback(() => {
    const newQ = {
      id: makeQuestionId(),
      text: '',
      type: 'rating_5',
      required: false,
      isSystem: false,
      options: [],
    };
    setForm(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
  }, []);

  const updateQuestion = useCallback((updated) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === updated.id ? updated : q),
    }));
  }, []);

  const deleteQuestion = useCallback((id) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id),
    }));
  }, []);

  // ── Save / Publish ─────────────────────────────────────────────────────────
  function validate() {
    if (!form.name.trim()) {
      Alert.alert('Missing Name', 'Please enter a survey name.');
      return false;
    }
    if (form.questions.length === 0) {
      Alert.alert('No Questions', 'Add at least one question before saving.');
      return false;
    }
    return true;
  }

  function handleSave(isActive) {
    if (!validate()) return;
    saveMutation.mutate({
      title:            form.name.trim(),
      type:             form.type,
      description:      form.description.trim() || null,
      deploy_method:    form.deployMethod,
      thank_you_message: form.thankYouMessage.trim(),
      allow_anonymous:  form.allowAnonymous,
      is_active:        isActive,
      questions:        form.questions.map((q, i) => ({
        id:       q.id,
        text:     q.text,
        type:     q.type,
        required: q.required,
        options:  q.options || [],
        sort_order: i,
      })),
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={mode === 'edit' ? 'Edit Survey' : 'New Survey'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Survey Details ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel>Survey Details</SectionLabel>

          <Text style={styles.fieldLabel}>Survey Name *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={val => setForm(p => ({ ...p, name: val }))}
            placeholder="e.g. Post-Visit Feedback"
            placeholderTextColor={colors.lightGrey}
          />

          <Text style={styles.fieldLabel}>Survey Type</Text>
          <ChipRow
            options={SURVEY_TYPES}
            value={form.type}
            onSelect={handleTypeChange}
          />

          <Text style={styles.fieldLabel}>Introduction / Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.description}
            onChangeText={val => setForm(p => ({ ...p, description: val }))}
            placeholder="Optional intro text shown to customers at the top of the survey…"
            placeholderTextColor={colors.lightGrey}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.fieldLabel}>Deployment Method</Text>
          <ChipRow
            options={DEPLOY_METHODS}
            value={form.deployMethod}
            onSelect={val => setForm(p => ({ ...p, deployMethod: val }))}
          />
        </View>

        {/* ── Questions ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionLabel}>Survey Questions</Text>
            <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
              <Text style={styles.addQuestionText}>＋ Add Question</Text>
            </TouchableOpacity>
          </View>

          {form.questions.length === 0 ? (
            <View style={styles.noQuestionsBox}>
              <Text style={styles.noQuestionsText}>
                No questions yet. Tap ＋ Add Question to get started.
              </Text>
            </View>
          ) : (
            form.questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
              />
            ))
          )}
        </View>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel>Appearance & Settings</SectionLabel>

          <Text style={styles.fieldLabel}>Thank You Message</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.thankYouMessage}
            onChangeText={val => setForm(p => ({ ...p, thankYouMessage: val }))}
            placeholder="Message shown after submission…"
            placeholderTextColor={colors.lightGrey}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Allow anonymous responses</Text>
              <Text style={styles.toggleSub}>
                Customers can submit without providing contact info
              </Text>
            </View>
            <Switch
              value={form.allowAnonymous}
              onValueChange={val => setForm(p => ({ ...p, allowAnonymous: val }))}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={form.allowAnonymous ? colors.primary : colors.lightGrey}
            />
          </View>
        </View>

        {/* Bottom spacer for CTAs */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky CTA bar ─────────────────────────────────────────────────── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.draftBtn, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => handleSave(false)}
          disabled={saveMutation.isPending}
          activeOpacity={0.8}>
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <Text style={styles.draftBtnText}>Save Draft</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => handleSave(true)}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}>
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.publishBtnText}>Publish Survey</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Section
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  sectionLabel: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // Field
  fieldLabel: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.darkGrey,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.md,
    color: colors.dark,
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 10,
  },
  inputReadOnly: {
    backgroundColor: colors.background,
    color: colors.midGrey,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  chipText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.midGrey,
  },
  chipTextSm: {
    fontSize: typography.xs,
  },
  chipTextActive: {
    color: colors.primary,
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleLabel: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  toggleSub: {
    fontSize: typography.xs,
    color: colors.midGrey,
    marginTop: 2,
    lineHeight: 16,
  },

  // Question card
  questionCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  questionNumberText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.white,
  },
  questionLabel: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    backgroundColor: colors.background,
  },
  deleteBtnText: {
    fontSize: typography.sm,
    color: colors.error,
    fontWeight: '700',
  },
  deleteBtnTextDisabled: {
    color: colors.border,
  },

  // Multiple choice options
  optionsWrap: {
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionInput: {
    flex: 1,
  },
  optionDelete: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  optionDeleteText: {
    fontSize: typography.sm,
    color: colors.lightGrey,
    fontWeight: '700',
  },
  addOptionBtn: {
    marginTop: 4,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
  },
  addOptionText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.primary,
  },

  // Add question button
  addQuestionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addQuestionText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.primary,
  },

  // No questions placeholder
  noQuestionsBox: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  noQuestionsText: {
    fontSize: typography.sm,
    color: colors.lightGrey,
    textAlign: 'center',
    lineHeight: 20,
  },

  // CTA bar
  ctaBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.md,
  },
  draftBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  draftBtnText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.primary,
  },
  publishBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadow.green,
  },
  publishBtnText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.white,
  },
});
