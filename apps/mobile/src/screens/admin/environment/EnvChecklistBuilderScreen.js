import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

// ─── helpers ────────────────────────────────────────────────────────────────

let _id = 100;
const uid = () => `item_${++_id}`;

const ITEM_TYPES = [
  { key: 'pass_fail', label: '✓ Pass/Fail' },
  { key: 'note',      label: '📝 Note' },
  { key: 'photo',     label: '📷 Photo' },
];

function nextType(current) {
  const idx = ITEM_TYPES.findIndex(t => t.key === current);
  return ITEM_TYPES[(idx + 1) % ITEM_TYPES.length].key;
}

function makeItem() {
  return { id: uid(), text: '', type: 'pass_fail', required: true };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function SelectChip({ label, selected, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected ? styles.chipSelected : styles.chipOutlined, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextOutlined]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ChecklistItem({ item, index, onChange, onDelete }) {
  const typeLabel = ITEM_TYPES.find(t => t.key === item.type)?.label ?? item.type;

  return (
    <View style={styles.itemRow}>
      {/* left: index + drag handle */}
      <View style={styles.itemLeft}>
        <Text style={styles.itemIndex}>{index + 1}</Text>
        <Text style={styles.dragHandle}>☰</Text>
      </View>

      {/* centre: text + chips */}
      <View style={styles.itemCenter}>
        <TextInput
          style={styles.itemTextInput}
          placeholder="e.g. Check fitting room lighting"
          placeholderTextColor={colors.lightGrey}
          value={item.text}
          onChangeText={text => onChange({ ...item, text })}
          multiline
        />
        <View style={styles.itemChipsRow}>
          {/* type cycling chip */}
          <TouchableOpacity
            style={styles.typeChip}
            onPress={() => onChange({ ...item, type: nextType(item.type) })}
            activeOpacity={0.7}
          >
            <Text style={styles.typeChipText}>{typeLabel}</Text>
          </TouchableOpacity>

          {/* required toggle */}
          <TouchableOpacity
            style={[styles.reqChip, item.required && styles.reqChipOn]}
            onPress={() => onChange({ ...item, required: !item.required })}
            activeOpacity={0.7}
          >
            <Text style={[styles.reqChipText, item.required && styles.reqChipTextOn]}>
              Required
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* right: delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function EnvChecklistBuilderScreen({ navigation, route }) {
  const { mode = 'create', checklist } = route?.params ?? {};
  const qc = useQueryClient();

  // API uses `title` for the checklist name and `item_text` for items
  const [form, setForm] = useState({
    name:        checklist?.title       ?? checklist?.name        ?? '',
    description: checklist?.description ?? '',
    frequency:   checklist?.frequency   ?? 'daily',
    status:      checklist?.is_active === false ? 'draft' : 'active',
    items:       checklist?.items?.map(i => ({
                   id:       i.id ?? uid(),
                   text:     i.item_text ?? i.text ?? '',
                   type:     i.requires_photo ? 'photo' : 'pass_fail',
                   required: true,
                 })) ?? [makeItem()],
  });

  // ── API mutation ──────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (body) => checklist?.id
      ? client.put(`/environment/checklists/${checklist.id}`, body).then(r => r.data)
      : client.post('/environment/checklists', body).then(r => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['env-checklists'] });
      Alert.alert(
        'Saved',
        variables.is_active ? 'Checklist activated successfully.' : 'Draft saved successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (err) => Alert.alert('Error', err?.response?.data?.error || 'Failed to save checklist.'),
  });

  // ── setters ──────────────────────────────────────────────────────────────

  const set = patch => setForm(f => ({ ...f, ...patch }));

  const updateItem = (id, updated) =>
    set({ items: form.items.map(it => (it.id === id ? updated : it)) });

  const deleteItem = id =>
    set({ items: form.items.filter(it => it.id !== id) });

  const addItem = () =>
    set({ items: [...form.items, makeItem()] });

  // ── validation & save ────────────────────────────────────────────────────

  function save(targetStatus) {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Please enter a checklist name.');
      return;
    }
    if (form.items.length === 0) {
      Alert.alert('Validation', 'Add at least one checklist item.');
      return;
    }
    saveMutation.mutate({
      title:       form.name.trim(),
      description: form.description.trim() || null,
      frequency:   form.frequency,
      is_active:   targetStatus === 'active',
      items:       form.items.map((item, i) => ({
        item_text:            item.text.trim() || `Item ${i + 1}`,
        order_index:          i,
        requires_photo:       item.type === 'photo',
        requires_measurement: item.type === 'measure',
        unit:                 item.unit || null,
      })),
    });
  }

  // ── render ───────────────────────────────────────────────────────────────

  const headerTitle = mode === 'edit' ? 'Edit Checklist' : 'New Checklist';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={headerTitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Name ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Checklist Name <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Daily Opening Check"
            placeholderTextColor={colors.lightGrey}
            value={form.name}
            onChangeText={name => set({ name })}
          />
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Brief description of this checklist…"
            placeholderTextColor={colors.lightGrey}
            value={form.description}
            onChangeText={description => set({ description })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Frequency ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipRow}>
            {['daily', 'weekly', 'monthly'].map(freq => (
              <SelectChip
                key={freq}
                label={freq.charAt(0).toUpperCase() + freq.slice(1)}
                selected={form.frequency === freq}
                onPress={() => set({ frequency: freq })}
                style={styles.chipFlex}
              />
            ))}
          </View>
        </View>

        {/* ── Store scope ── */}
        <View style={styles.section}>
          <View style={styles.inlineRow}>
            <Text style={styles.label}>Applies to:</Text>
            <SelectChip
              label={form.storeScope === 'all' ? 'All Stores' : 'Selected Stores'}
              selected
              onPress={() =>
                set({ storeScope: form.storeScope === 'all' ? 'selected' : 'all' })
              }
            />
          </View>
        </View>

        {/* ── Status ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.chipRow}>
            <SelectChip
              label="Draft"
              selected={form.status === 'draft'}
              onPress={() => set({ status: 'draft' })}
              style={styles.chipFlex}
            />
            <SelectChip
              label="Active"
              selected={form.status === 'active'}
              onPress={() => set({ status: 'active' })}
              style={styles.chipFlex}
            />
          </View>
        </View>

        {/* ── Items ── */}
        <View style={[styles.section, styles.itemsSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Checklist Items</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem} activeOpacity={0.8}>
              <Text style={styles.addItemBtnText}>＋ Add Item</Text>
            </TouchableOpacity>
          </View>

          {form.items.length === 0 && (
            <Text style={styles.emptyItems}>No items yet. Tap "＋ Add Item" to begin.</Text>
          )}

          {form.items.map((item, index) => (
            <ChecklistItem
              key={item.id}
              item={item}
              index={index}
              onChange={updated => updateItem(item.id, updated)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}

          {form.items.length > 0 && (
            <TouchableOpacity style={styles.addItemRowBtn} onPress={addItem} activeOpacity={0.8}>
              <Text style={styles.addItemRowText}>＋ Add Item</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* spacer for bottom CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.ctaBtn, styles.ctaBtnOutlined, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => save('draft')}
          disabled={saveMutation.isPending}
          activeOpacity={0.8}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <Text style={[styles.ctaBtnText, styles.ctaBtnTextOutlined]}>Save Draft</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaBtn, styles.ctaBtnSolid, saveMutation.isPending && { opacity: 0.5 }]}
          onPress={() => save('active')}
          disabled={saveMutation.isPending}
          activeOpacity={0.8}
        >
          {saveMutation.isPending
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={[styles.ctaBtnText, styles.ctaBtnTextSolid]}>Activate Checklist</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // ── form sections ──────────────────────────────────────────────────────────
  section:        { marginBottom: 18 },
  label:          { fontSize: typography.sm, fontWeight: '600', color: colors.darkGrey, marginBottom: 8 },
  required:       { color: colors.error },
  optional:       { fontWeight: '400', color: colors.lightGrey },

  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: typography.md,
    color: colors.dark,
    ...shadow.sm,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 11,
  },

  // ── chips ──────────────────────────────────────────────────────────────────
  chipRow:        { flexDirection: 'row', gap: 8 },
  chipFlex:       { flex: 1 },

  chip:           { paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.md, alignItems: 'center' },
  chipSelected:   { backgroundColor: colors.primary },
  chipOutlined:   { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  chipText:       { fontSize: typography.sm, fontWeight: '700' },
  chipTextSelected: { color: colors.white },
  chipTextOutlined: { color: colors.midGrey },

  inlineRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // ── items section ─────────────────────────────────────────────────────────
  itemsSection:   {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.sm,
  },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:   { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  addItemBtn:     {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addItemBtnText: { color: colors.white, fontSize: typography.sm, fontWeight: '700' },

  emptyItems:     { color: colors.lightGrey, fontSize: typography.sm, textAlign: 'center', paddingVertical: 20 },

  // ── item row ──────────────────────────────────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  itemLeft:   { alignItems: 'center', paddingTop: 10, width: 28 },
  itemIndex:  { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  dragHandle: { fontSize: 14, color: colors.lightGrey, marginTop: 4 },

  itemCenter: { flex: 1 },
  itemTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: typography.sm,
    color: colors.dark,
    backgroundColor: colors.inputBg,
    minHeight: 40,
  },
  itemChipsRow:   { flexDirection: 'row', marginTop: 8, gap: 6, flexWrap: 'wrap' },

  typeChip: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typeChipText: { fontSize: typography.xs, fontWeight: '600', color: '#1E40AF' },

  reqChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  reqChipOn:       { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  reqChipText:     { fontSize: typography.xs, fontWeight: '600', color: colors.lightGrey },
  reqChipTextOn:   { color: colors.primary },

  deleteBtn:  { paddingTop: 10 },
  deleteIcon: { fontSize: 14, color: colors.error, fontWeight: '700' },

  // ── add item row button ───────────────────────────────────────────────────
  addItemRowBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addItemRowText: { color: colors.primary, fontSize: typography.sm, fontWeight: '700' },

  // ── bottom CTA ────────────────────────────────────────────────────────────
  bottomCTA: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.md,
  },
  ctaBtn:             { flex: 1, paddingVertical: 13, borderRadius: radius.md, alignItems: 'center' },
  ctaBtnOutlined:     { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.white },
  ctaBtnSolid:        { backgroundColor: colors.primary, ...shadow.green },
  ctaBtnText:         { fontSize: typography.md, fontWeight: '700' },
  ctaBtnTextOutlined: { color: colors.primary },
  ctaBtnTextSolid:    { color: colors.white },
});
