import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

export default function PrintRequestScreen({ route, navigation }) {
  const template = route.params?.template;
  const [selectedStore, setSelectedStore] = useState(null);

  const { data: storesData } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => client.get('/stores').then(r => r.data),
  });
  const stores = Array.isArray(storesData) ? storesData : (storesData?.data || []);
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [instructions, setInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = selectedStore && quantity && parseInt(quantity, 10) > 0;

  const submit = useMutation({
    mutationFn: (body) => client.post('/signage/print-requests', body).then(r => r.data),
    onSuccess: () => { setSubmitted(true); setTimeout(() => navigation.goBack(), 2000); },
    onError: (err) => setErrorMsg(err.response?.data?.error || 'Failed to submit print request'),
  });

  function handleSubmit() {
    if (!canSubmit) return;
    submit.mutate({
      template_id: template?.id,
      store_id: selectedStore.id,
      quantity: parseInt(quantity, 10),
      notes: instructions,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Print Request" subtitle={template?.title} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {template && (
          <View style={[styles.templateBanner, shadow.sm]}>
            <Text style={styles.templateIcon}>🪧</Text>
            <View>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templateDims}>{template.dimensions}</Text>
            </View>
          </View>
        )}

        {/* Store Selector */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>🏬 Select Store</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setStorePickerOpen(!storePickerOpen)}
            activeOpacity={0.85}
          >
            <Text style={[styles.pickerText, !selectedStore && styles.pickerPlaceholder]}>
              {selectedStore ? `${selectedStore.name} — ${selectedStore.city}` : 'Select a store...'}
            </Text>
            <Text style={styles.pickerArrow}>{storePickerOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {storePickerOpen && (
            <View style={styles.storeList}>
              {stores.length === 0 && (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: colors.lightGrey, fontSize: typography.sm }}>No stores found</Text>
                </View>
              )}
              {stores.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.storeOption, selectedStore?.id === s.id && styles.storeOptionSelected]}
                  onPress={() => { setSelectedStore(s); setStorePickerOpen(false); }}
                >
                  <Text style={[styles.storeOptionText, selectedStore?.id === s.id && styles.storeOptionTextSelected]}>
                    {s.name}
                  </Text>
                  <Text style={styles.storeOptionCity}>{s.city || s.region || ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>🔢 Quantity</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((v) => String(Math.max(1, parseInt(v, 10) - 1)))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyValue}>{quantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((v) => String(parseInt(v, 10) + 1))}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.qtyHint}>copies</Text>
        </View>

        {/* Special Instructions */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📝 Special Instructions</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Paper type, finish, urgency, mounting notes..."
            placeholderTextColor={colors.lightGrey}
            value={instructions}
            onChangeText={setInstructions}
            textAlignVertical="top"
          />
        </View>

        {submitted && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ Print request submitted!</Text>
          </View>
        )}
        {!!errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {errorMsg}</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, (!canSubmit || submit.isPending) && styles.ctaBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submit.isPending}
          activeOpacity={0.85}
        >
          {submit.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaBtnText}>Submit Print Request</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: colors.background },
  scroll:               { flex: 1 },
  content:              { padding: 16, gap: 14 },
  templateBanner:       { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateIcon:         { fontSize: 32 },
  templateTitle:        { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  templateDims:         { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  card:                 { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:            { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 12 },
  picker:               { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.inputBg },
  pickerText:           { fontSize: typography.sm, color: colors.dark, flex: 1 },
  pickerPlaceholder:    { color: colors.lightGrey },
  pickerArrow:          { fontSize: typography.xs, color: colors.midGrey, marginLeft: 8 },
  storeList:            { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  storeOption:          { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
  storeOptionSelected:  { backgroundColor: colors.primaryBg },
  storeOptionText:      { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  storeOptionTextSelected: { color: colors.primary },
  storeOptionCity:      { fontSize: typography.xs, color: colors.lightGrey },
  quantityRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 6 },
  qtyBtn:               { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryBg, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:           { fontSize: 26, color: colors.primary, fontWeight: '600', lineHeight: 30 },
  qtyDisplay:           { width: 80, height: 56, borderRadius: radius.md, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qtyValue:             { fontSize: 28, fontWeight: '800', color: colors.dark },
  qtyHint:              { fontSize: typography.xs, color: colors.lightGrey, textAlign: 'center' },
  textArea:             { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: typography.sm, color: colors.dark, minHeight: 96, backgroundColor: colors.inputBg },
  ctaBar:               { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn:               { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadow.green },
  ctaBtnDisabled:       { backgroundColor: colors.border },
  ctaBtnText:           { color: colors.white, fontSize: typography.md, fontWeight: '700' },
  successBox:           { backgroundColor: '#D1FAE5', borderRadius: radius.md, padding: 14, alignItems: 'center' },
  successText:          { fontSize: typography.sm, fontWeight: '700', color: '#065F46' },
  errorBox:             { backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: 14 },
  errorText:            { fontSize: typography.sm, fontWeight: '600', color: '#991B1B' },
});
