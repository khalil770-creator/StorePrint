import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'brand',      label: 'Brand Standards' },
  { key: 'product',    label: 'Product' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'softskills', label: 'Soft Skills' },
];

const CONTENT_TYPES = [
  { key: 'text',  label: '📖 Text & Images' },
  { key: 'video', label: '🎬 Video' },
  { key: 'quiz',  label: '📝 Quiz Only' },
];

// ─── Initial state ────────────────────────────────────────────────────────────
const makeInitialState = (course) => ({
  title:       course?.title       ?? '',
  category:    course?.category    ? categoryKeyFromLabel(course.category) : 'brand',
  description: course?.description ?? '',
  passMark:    course?.passMark    ?? 80,
  durationMin: course?.durationMin ?? 30,
  targetRoles: course?.targetRoles ?? '',
  status:      course?.status      ?? 'draft',
  modules:     course?.modules_data ?? [makeModule(1)],
});

function categoryKeyFromLabel(label) {
  const found = CATEGORIES.find(c => c.label.toLowerCase() === label.toLowerCase());
  return found ? found.key : 'brand';
}

let _modCount = 1;
function makeModule(num) {
  _modCount = num ?? _modCount + 1;
  return {
    id: `mod_${Date.now()}_${_modCount}`,
    title: '',
    contentType: 'text',
    hasQuiz: true,
    content: '',
    questions: [],
  };
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ value, onDecrement, onIncrement, format }) {
  return (
    <View style={stepperStyles.row}>
      <TouchableOpacity style={stepperStyles.btn} onPress={onDecrement} activeOpacity={0.7}>
        <Text style={stepperStyles.btnText}>−</Text>
      </TouchableOpacity>
      <Text style={stepperStyles.value}>{format(value)}</Text>
      <TouchableOpacity style={stepperStyles.btn} onPress={onIncrement} activeOpacity={0.7}>
        <Text style={stepperStyles.btnText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 0 },
  btn:     {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 18, color: colors.primary, fontWeight: '700', lineHeight: 22 },
  value:   {
    minWidth: 90, textAlign: 'center',
    fontSize: typography.md, fontWeight: '700', color: colors.dark,
  },
});

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ mod, index, onChange, onDelete, onEditContent }) {
  return (
    <View style={mcStyles.card}>
      {/* Header */}
      <View style={mcStyles.header}>
        <Text style={mcStyles.handle}>☰</Text>
        <Text style={mcStyles.num}>Module {index + 1}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={mcStyles.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <TextInput
        style={mcStyles.titleInput}
        placeholder="Module title..."
        placeholderTextColor={colors.lightGrey}
        value={mod.title}
        onChangeText={v => onChange({ ...mod, title: v })}
      />

      {/* Content type chips */}
      <Text style={mcStyles.label}>Content Type</Text>
      <View style={mcStyles.chips}>
        {CONTENT_TYPES.map(ct => {
          const active = mod.contentType === ct.key;
          return (
            <TouchableOpacity
              key={ct.key}
              style={[mcStyles.chip, active && mcStyles.chipActive]}
              onPress={() => onChange({ ...mod, contentType: ct.key })}
              activeOpacity={0.75}
            >
              <Text style={[mcStyles.chipText, active && mcStyles.chipTextActive]}>
                {ct.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Has Quiz toggle */}
      <View style={mcStyles.quizRow}>
        <Text style={mcStyles.quizLabel}>Has Quiz</Text>
        <Switch
          value={mod.hasQuiz}
          onValueChange={v => onChange({ ...mod, hasQuiz: v })}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={mod.hasQuiz ? colors.primary : colors.lightGrey}
        />
        <Text style={[mcStyles.quizState, mod.hasQuiz && mcStyles.quizStateOn]}>
          {mod.hasQuiz ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Edit content */}
      <TouchableOpacity style={mcStyles.editBtn} onPress={onEditContent} activeOpacity={0.8}>
        <Text style={mcStyles.editBtnText}>✏️ Edit Content</Text>
      </TouchableOpacity>
    </View>
  );
}

const mcStyles = StyleSheet.create({
  card:          {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: 14, marginBottom: 10, borderLeftWidth: 3,
    borderLeftColor: colors.primary, ...shadow.sm,
  },
  header:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  handle:        { fontSize: 16, color: colors.lightGrey, marginRight: 8 },
  num:           { flex: 1, fontSize: typography.sm, fontWeight: '700', color: colors.midGrey },
  deleteBtn:     { fontSize: 14, color: colors.error, fontWeight: '700', padding: 4 },
  titleInput:    {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 9, fontSize: typography.md,
    color: colors.dark, backgroundColor: colors.inputBg, marginBottom: 12,
  },
  label:         { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey,
                   textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip:          {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:      { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  chipTextActive:{ color: colors.white },
  quizRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  quizLabel:     { fontSize: typography.sm, color: colors.dark, fontWeight: '600', flex: 1 },
  quizState:     { fontSize: typography.xs, color: colors.lightGrey, fontWeight: '700' },
  quizStateOn:   { color: colors.primary },
  editBtn:       {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: 8, alignItems: 'center',
  },
  editBtnText:   { fontSize: typography.sm, color: colors.primary, fontWeight: '700' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CourseBuilderScreen({ navigation, route }) {
  const { mode = 'create', course } = route?.params ?? {};
  const isEdit = mode === 'edit';

  const [form, setForm] = useState(() => makeInitialState(course));

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const addModule = () => {
    set('modules', [...form.modules, makeModule(form.modules.length + 1)]);
  };

  const updateModule = (id, updated) => {
    set('modules', form.modules.map(m => m.id === id ? updated : m));
  };

  const deleteModule = (id) => {
    set('modules', form.modules.filter(m => m.id !== id));
  };

  const handleSave = (publish) => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Please enter a course title.');
      return;
    }
    if (form.modules.length === 0) {
      Alert.alert('Validation', 'Please add at least one module.');
      return;
    }
    const action = publish ? 'published' : 'saved as draft';
    Alert.alert('Success', `Course ${action} successfully.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={isEdit ? 'Edit Course' : 'New Course'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Course Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Details</Text>

          {/* Title */}
          <Text style={styles.label}>Course Title <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Brand Standards 101"
            placeholderTextColor={colors.lightGrey}
            value={form.title}
            onChangeText={v => set('title', v)}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map(cat => {
              const active = form.category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => set('category', cat.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="What will learners achieve in this course?"
            placeholderTextColor={colors.lightGrey}
            value={form.description}
            onChangeText={v => set('description', v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Pass Mark */}
          <Text style={styles.label}>Pass Mark</Text>
          <View style={styles.stepperWrap}>
            <Stepper
              value={form.passMark}
              onDecrement={() => set('passMark', Math.max(50, form.passMark - 5))}
              onIncrement={() => set('passMark', Math.min(100, form.passMark + 5))}
              format={v => `Pass Mark: ${v}%`}
            />
          </View>

          {/* Duration */}
          <Text style={styles.label}>Estimated Duration</Text>
          <View style={styles.stepperWrap}>
            <Stepper
              value={form.durationMin}
              onDecrement={() => set('durationMin', Math.max(5, form.durationMin - 5))}
              onIncrement={() => set('durationMin', Math.min(180, form.durationMin + 5))}
              format={v => `~${v} min`}
            />
          </View>

          {/* Target Roles */}
          <Text style={styles.label}>Target Roles</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Store Manager, VM Team"
            placeholderTextColor={colors.lightGrey}
            value={form.targetRoles}
            onChangeText={v => set('targetRoles', v)}
          />

          {/* Status */}
          <Text style={styles.label}>Status</Text>
          <View style={styles.chips}>
            {['draft', 'active'].map(s => {
              const active = form.status === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => set('status', s)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {s === 'draft' ? 'Draft' : 'Active'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Modules ── */}
        <View style={styles.section}>
          <View style={styles.modulesHeader}>
            <Text style={styles.sectionTitle}>Course Modules</Text>
            <TouchableOpacity style={styles.addModBtn} onPress={addModule} activeOpacity={0.8}>
              <Text style={styles.addModBtnText}>＋ Add Module</Text>
            </TouchableOpacity>
          </View>

          {form.modules.length === 0 && (
            <View style={styles.emptyModules}>
              <Text style={styles.emptyModText}>No modules yet. Add your first module above.</Text>
            </View>
          )}

          {form.modules.map((mod, idx) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              index={idx}
              onChange={updated => updateModule(mod.id, updated)}
              onDelete={() => deleteModule(mod.id)}
              onEditContent={() =>
                navigation.navigate('CourseModuleBuilder', {
                  module: mod,
                  onSave: updated => updateModule(mod.id, updated),
                })
              }
            />
          ))}

          {form.modules.length > 0 && (
            <TouchableOpacity style={styles.addModBtnOutline} onPress={addModule} activeOpacity={0.8}>
              <Text style={styles.addModBtnOutlineText}>＋ Add Module</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── CTA ── */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={() => handleSave(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={() => handleSave(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.publishBtnText}>Publish Course</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { padding: 16, paddingBottom: 40 },

  section:        {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 16, marginBottom: 14, ...shadow.sm,
  },
  sectionTitle:   {
    fontSize: typography.md, fontWeight: '800', color: colors.dark,
    marginBottom: 14,
  },

  label:          {
    fontSize: typography.xs, fontWeight: '700', color: colors.midGrey,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12,
  },
  req:            { color: colors.error },

  input:          {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: typography.md,
    color: colors.dark, backgroundColor: colors.inputBg,
  },
  multiline:      { minHeight: 80, paddingTop: 10 },

  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  chipTextActive: { color: colors.white, fontWeight: '700' },

  stepperWrap:    { marginTop: 2 },

  modulesHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addModBtn:      {
    marginLeft: 'auto', backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm,
  },
  addModBtnText:  { color: colors.white, fontSize: typography.xs, fontWeight: '700' },

  emptyModules:   {
    padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  emptyModText:   { fontSize: typography.sm, color: colors.lightGrey, textAlign: 'center' },

  addModBtnOutline: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.sm,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  addModBtnOutlineText: { color: colors.primary, fontSize: typography.sm, fontWeight: '700' },

  cta:            { flexDirection: 'row', gap: 10, marginTop: 4 },
  draftBtn:       {
    flex: 1, borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  draftBtnText:   { color: colors.primary, fontSize: typography.md, fontWeight: '700' },
  publishBtn:     {
    flex: 2, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
    ...shadow.green,
  },
  publishBtnText: { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
