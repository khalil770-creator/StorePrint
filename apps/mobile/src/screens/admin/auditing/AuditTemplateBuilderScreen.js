import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

// ─── Constants ───────────────────────────────────────────────────────────────
const QUESTION_TYPES = ['yes_no', 'score_1_5', 'photo', 'text'];

const QUESTION_TYPE_LABELS = {
  yes_no:    'Yes / No',
  score_1_5: 'Score 1–5',
  photo:     'Photo',
  text:      'Text',
};

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function makeQuestion() {
  return { id: makeId('q'), text: '', type: 'yes_no', required: true };
}

function makeCategory() {
  return { id: makeId('cat'), name: '', weight: 1, questions: [makeQuestion()] };
}

function buildInitialTemplate(route) {
  if (route?.params?.mode === 'edit' && route.params.template) {
    const t = route.params.template;
    // For edit mode with mock data we reconstruct a full template object
    return {
      name: t.name || '',
      description: t.description || '',
      status: t.status || 'draft',
      categories: t.categories && t.categories.length > 0
        ? t.categories
        : [makeCategory()],
    };
  }
  return {
    name: '',
    description: '',
    status: 'draft',
    categories: [makeCategory()],
  };
}

// ─── Question Row ─────────────────────────────────────────────────────────────
function QuestionRow({ question, onUpdate, onDelete }) {
  function cycleType() {
    const idx = QUESTION_TYPES.indexOf(question.type);
    const nextType = QUESTION_TYPES[(idx + 1) % QUESTION_TYPES.length];
    onUpdate({ ...question, type: nextType });
  }

  return (
    <View style={qStyles.wrap}>
      <View style={qStyles.topRow}>
        <TextInput
          style={qStyles.textInput}
          placeholder="Question text…"
          placeholderTextColor={colors.lightGrey}
          value={question.text}
          onChangeText={val => onUpdate({ ...question, text: val })}
          multiline
        />
        <TouchableOpacity style={qStyles.deleteBtn} onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={qStyles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={qStyles.bottomRow}>
        {/* Type selector */}
        <TouchableOpacity style={qStyles.typeChip} onPress={cycleType} activeOpacity={0.75}>
          <Text style={qStyles.typeChipText}>{QUESTION_TYPE_LABELS[question.type]}</Text>
          <Text style={qStyles.typeArrow}> ↻</Text>
        </TouchableOpacity>

        {/* Required toggle */}
        <TouchableOpacity
          style={[qStyles.requiredToggle, question.required && qStyles.requiredToggleActive]}
          onPress={() => onUpdate({ ...question, required: !question.required })}
          activeOpacity={0.75}
        >
          <Text style={[qStyles.requiredText, question.required && qStyles.requiredTextActive]}>
            {question.required ? '✓ Required' : 'Optional'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const qStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.dark,
    minHeight: 36,
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeChipText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  typeArrow: {
    fontSize: typography.xs,
    color: colors.primary,
  },
  requiredToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  requiredToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  requiredText: {
    fontSize: typography.xs,
    color: colors.lightGrey,
    fontWeight: '600',
  },
  requiredTextActive: {
    color: colors.primary,
  },
});

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ category, onUpdate, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);

  function updateQuestion(updatedQ) {
    const questions = category.questions.map(q => q.id === updatedQ.id ? updatedQ : q);
    onUpdate({ ...category, questions });
  }

  function deleteQuestion(qId) {
    const questions = category.questions.filter(q => q.id !== qId);
    onUpdate({ ...category, questions });
  }

  function addQuestion() {
    onUpdate({ ...category, questions: [...category.questions, makeQuestion()] });
  }

  function setWeight(delta) {
    const next = Math.min(5, Math.max(1, category.weight + delta));
    onUpdate({ ...category, weight: next });
  }

  return (
    <View style={catStyles.card}>
      {/* Card header */}
      <View style={catStyles.header}>
        <TouchableOpacity style={catStyles.collapseBtn} onPress={() => setCollapsed(c => !c)}>
          <Text style={catStyles.collapseIcon}>{collapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>

        <TextInput
          style={catStyles.nameInput}
          placeholder="Category name…"
          placeholderTextColor={colors.lightGrey}
          value={category.name}
          onChangeText={val => onUpdate({ ...category, name: val })}
        />

        <TouchableOpacity style={catStyles.deleteBtn} onPress={onDelete} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={catStyles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Weight stepper */}
      <View style={catStyles.weightRow}>
        <Text style={catStyles.weightLabel}>Weight: {category.weight}</Text>
        <View style={catStyles.stepper}>
          <TouchableOpacity
            style={[catStyles.stepBtn, category.weight <= 1 && catStyles.stepBtnDisabled]}
            onPress={() => setWeight(-1)}
            disabled={category.weight <= 1}
          >
            <Text style={catStyles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={catStyles.stepValue}>{category.weight}</Text>
          <TouchableOpacity
            style={[catStyles.stepBtn, category.weight >= 5 && catStyles.stepBtnDisabled]}
            onPress={() => setWeight(1)}
            disabled={category.weight >= 5}
          >
            <Text style={catStyles.stepBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Questions list */}
      {!collapsed && (
        <>
          {category.questions.map(q => (
            <QuestionRow
              key={q.id}
              question={q}
              onUpdate={updateQuestion}
              onDelete={() => deleteQuestion(q.id)}
            />
          ))}

          <TouchableOpacity style={catStyles.addQuestionBtn} onPress={addQuestion} activeOpacity={0.75}>
            <Text style={catStyles.addQuestionBtnText}>＋ Add Question</Text>
          </TouchableOpacity>
        </>
      )}

      {collapsed && (
        <Text style={catStyles.collapsedHint}>
          {category.questions.length} question{category.questions.length !== 1 ? 's' : ''} — tap ▶ to expand
        </Text>
      )}
    </View>
  );
}

const catStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  collapseBtn: {
    padding: 4,
    marginRight: 6,
  },
  collapseIcon: {
    fontSize: 12,
    color: colors.midGrey,
  },
  nameInput: {
    flex: 1,
    fontSize: typography.md,
    fontWeight: '600',
    color: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '700',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  weightLabel: {
    fontSize: typography.sm,
    color: colors.midGrey,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  stepBtnText: {
    fontSize: typography.md,
    color: colors.primary,
    fontWeight: '700',
  },
  stepValue: {
    paddingHorizontal: 14,
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.dark,
  },
  addQuestionBtn: {
    marginTop: 4,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  addQuestionBtnText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  collapsedHint: {
    fontSize: typography.xs,
    color: colors.lightGrey,
    textAlign: 'center',
    marginTop: 2,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AuditTemplateBuilderScreen({ route, navigation }) {
  const mode       = route?.params?.mode || 'create';
  const existing   = route?.params?.template;
  const qc         = useQueryClient();

  const [template, setTemplate] = useState(() => buildInitialTemplate(route));

  // Fetch full template (with categories+questions) when editing
  const { data: fetchedTemplate, isLoading: loadingTemplate } = useQuery({
    queryKey: ['audit-template', existing?.id],
    queryFn: () => client.get(`/auditing/templates/${existing.id}`).then(r => r.data),
    enabled: mode === 'edit' && !!existing?.id,
  });

  useEffect(() => {
    if (!fetchedTemplate) return;
    setTemplate({
      name:        fetchedTemplate.name || '',
      description: fetchedTemplate.description || '',
      status:      fetchedTemplate.status || 'draft',
      categories:  fetchedTemplate.categories?.length
        ? fetchedTemplate.categories.map(c => ({
            id:       makeId('cat'),
            name:     c.name || '',
            weight:   c.weight || 1,
            questions: (c.questions || []).map(q => ({
              id:       makeId('q'),
              text:     q.text || '',
              type:     q.type || 'yes_no',
              required: q.required ?? false,
            })),
          }))
        : [makeCategory()],
    });
  }, [fetchedTemplate]);

  // ── API mutations ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (body) => existing?.id
      ? client.put(`/auditing/templates/${existing.id}`, body).then(r => r.data)
      : client.post('/auditing/templates', body).then(r => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['audit-templates'] });
      const msg = variables.status === 'active' ? 'Template published successfully.' : 'Template saved as draft.';
      Alert.alert('Saved', msg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    },
    onError: (err) => {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save template.');
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function updateField(key, value) {
    setTemplate(prev => ({ ...prev, [key]: value }));
  }

  function updateCategory(updatedCat) {
    setTemplate(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === updatedCat.id ? updatedCat : c),
    }));
  }

  function deleteCategory(catId) {
    setTemplate(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== catId),
    }));
  }

  function addCategory() {
    setTemplate(prev => ({
      ...prev,
      categories: [...prev.categories, makeCategory()],
    }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    if (!template.name.trim()) {
      Alert.alert('Missing Name', 'Please enter a template name before saving.');
      return false;
    }
    if (template.categories.length === 0) {
      Alert.alert('No Categories', 'Add at least one category before saving.');
      return false;
    }
    for (const cat of template.categories) {
      if (cat.questions.length === 0) {
        Alert.alert('Empty Category', `Category "${cat.name || 'Untitled'}" must have at least one question.`);
        return false;
      }
    }
    return true;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave(status) {
    if (!validate()) return;
    saveMutation.mutate({
      name:        template.name.trim(),
      description: template.description.trim(),
      status,
      categories:  template.categories.map((cat, i) => ({
        name:      cat.name.trim() || `Category ${i + 1}`,
        weight:    cat.weight || 1,
        questions: cat.questions.map((q, j) => ({
          text:      q.text.trim(),
          type:      q.type || 'yes_no',
          required:  q.required || false,
          weight:    q.weight || 1,
          sort_order: j,
        })),
      })),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loadingTemplate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Edit Template" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={mode === 'create' ? 'New Template' : 'Edit Template'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Template Info ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template Info</Text>

          <Text style={styles.label}>Template Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Brand Standards Audit"
            placeholderTextColor={colors.lightGrey}
            value={template.name}
            onChangeText={val => updateField('name', val)}
            returnKeyType="next"
          />

          <Text style={[styles.label, styles.labelSpaced]}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Optional description…"
            placeholderTextColor={colors.lightGrey}
            value={template.description}
            onChangeText={val => updateField('description', val)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Status toggle */}
          <Text style={[styles.label, styles.labelSpaced]}>Status</Text>
          <View style={styles.statusRow}>
            {['draft', 'active'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, template.status === s && styles.statusChipActive]}
                onPress={() => updateField('status', s)}
                activeOpacity={0.75}
              >
                <Text style={[styles.statusChipText, template.status === s && styles.statusChipTextActive]}>
                  {s === 'draft' ? '📝 Draft' : '✅ Active'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Categories & Questions ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories &amp; Questions</Text>
            <TouchableOpacity style={styles.addCatBtn} onPress={addCategory} activeOpacity={0.75}>
              <Text style={styles.addCatBtnText}>＋ Add Category</Text>
            </TouchableOpacity>
          </View>

          {template.categories.length === 0 && (
            <View style={styles.emptyCategories}>
              <Text style={styles.emptyCatText}>No categories yet. Tap "＋ Add Category" above.</Text>
            </View>
          )}

          {template.categories.map(cat => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onUpdate={updateCategory}
              onDelete={() => deleteCategory(cat.id)}
            />
          ))}
        </View>

        {/* Bottom padding so FAB doesn't cover last card */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── CTA Bar ───────────────────────────────────────────────────── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.draftBtn, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => handleSave('draft')}
          disabled={saveMutation.isPending}
          activeOpacity={0.8}>
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <Text style={styles.draftBtnText}>Save as Draft</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => handleSave('active')}
          disabled={saveMutation.isPending}
          activeOpacity={0.8}>
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.publishBtnText}>Publish Template</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.darkGrey,
  },

  // Labels
  label: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.midGrey,
    marginBottom: 6,
  },
  labelSpaced: {
    marginTop: 14,
  },
  required: {
    color: colors.error,
  },

  // Inputs
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: typography.md,
    color: colors.dark,
  },
  textArea: {
    height: 80,
    paddingTop: 11,
  },

  // Status toggle
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  statusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  statusChipText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.midGrey,
  },
  statusChipTextActive: {
    color: colors.primary,
  },

  // Add category button
  addCatBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  addCatBtnText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: '700',
  },

  // Empty state
  emptyCategories: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  emptyCatText: {
    fontSize: typography.sm,
    color: colors.lightGrey,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 16,
  },

  // CTA bar
  ctaBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    ...shadow.md,
  },
  draftBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  draftBtnText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.primary,
  },
  publishBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    ...shadow.green,
  },
  publishBtnText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.white,
  },
});
