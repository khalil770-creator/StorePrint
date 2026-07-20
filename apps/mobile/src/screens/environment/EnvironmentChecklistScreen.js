import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';

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
import ScreenHeader   from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client         from '../../api/client';
import { getCurrentGPS } from '../../utils/gps';

const TOGGLE_STATES = ['ok', 'issue', 'n/a'];
const TOGGLE_STYLE = {
  ok:    { bg: colors.statusActive, text: colors.statusActiveText, label: 'OK' },
  issue: { bg: '#FFF0F0',           text: colors.error,            label: 'Issue' },
  'n/a': { bg: colors.inputBg,      text: colors.lightGrey,        label: 'N/A' },
};

export default function EnvironmentChecklistScreen({ navigation, route }) {
  const id = route.params?.checklist?.id;
  const { data: checklist, isLoading } = useQuery({
    queryKey: ['env-checklist', id],
    queryFn: () => client.get(`/environment/checklists/${id}`).then(r => r.data),
    enabled: !!id,
    initialData: route.params?.checklist,
  });
  const { data: myStore } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => client.get('/field/my-store').then(r => r.data?.store || r.data),
  });

  const submit = useMutation({
    mutationFn: ({ store_id, gps, items }) =>
      client.post(`/environment/checklists/${id}/submit`, { store_id, gps, items }).then(r => r.data),
    onSuccess: () => showAlert('Submitted!', 'Checklist recorded.', () => navigation.goBack()),
    onError: (err) => showAlert('Error', err.response?.data?.error || 'Submit failed'),
  });

  const CHECKLIST_ITEMS = checklist?.items || [];

  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsCoords, setGpsCoords] = useState({ lat: null, lng: null });
  const [toggles, setToggles] = useState({});
  const [measures, setMeasures] = useState({});
  const [photos, setPhotos] = useState({});

  const setToggle = (id, val) => setToggles((prev) => ({ ...prev, [id]: val }));
  const setMeasure = (id, val) => setMeasures((prev) => ({ ...prev, [id]: val }));

  const passCount = CHECKLIST_ITEMS.filter((i) => toggles[i.id] === 'ok').length;
  const failCount = CHECKLIST_ITEMS.filter((i) => toggles[i.id] === 'issue').length;
  const answered = CHECKLIST_ITEMS.filter((i) => toggles[i.id] || measures[i.id] || photos[i.id]).length;
  const allAnswered = CHECKLIST_ITEMS.length > 0 && answered === CHECKLIST_ITEMS.length;

  const handleGPS = async () => {
    try {
      const pos = await getCurrentGPS();
      setGpsCoords({ lat: pos.lat, lng: pos.lng });
      setGpsVerified(true);
      showAlert('GPS Verified', `Location confirmed (±${Math.round(pos.accuracy_m)}m accuracy)`);
    } catch (e) {
      showAlert('GPS Error', e.message);
    }
  };

  const handlePhoto = (id) => {
    // In production: use expo-image-picker
    showAlert('Camera', 'Photo captured (placeholder).', () => setPhotos((p) => ({ ...p, [id]: true })));
  };

  const handleSubmit = () => {
    if (!gpsVerified) return showAlert('GPS Required', 'Please verify your GPS location first.');
    if (!allAnswered) return showAlert('Incomplete', 'Please answer all checklist items before submitting.');
    const store_id = myStore?.id ?? checklist?.store_id ?? route.params?.store_id ?? null;
    if (!store_id) return showAlert('Error', 'No store assigned to your account. Contact your administrator.');
    const items = CHECKLIST_ITEMS.map((item) => ({
      checklist_item_id: item.id,
      status:    toggles[item.id] === 'n/a' ? 'na' : (toggles[item.id] || (measures[item.id] ? 'ok' : 'na')),
      value:     measures[item.id] ? String(measures[item.id]) : null,
      note:      null,
      photo_url: photos[item.id] ? 'placeholder' : null,
    }));
    submit.mutate({ store_id, gps: { lat: gpsCoords.lat, lng: gpsCoords.lng }, items });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Checklist" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={checklist?.title || checklist?.name || 'Checklist'} subtitle={checklist?.frequency ? `Frequency: ${checklist.frequency}` : ''} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <TouchableOpacity
          style={[styles.gpsBanner, gpsVerified && styles.gpsBannerDone]}
          onPress={handleGPS}
          activeOpacity={0.85}
        >
          <Text style={styles.gpsIcon}>{gpsVerified ? '✅' : '📍'}</Text>
          <View>
            <Text style={[styles.gpsTitle, gpsVerified && styles.gpsTitleDone]}>
              {gpsVerified ? 'GPS Verified — Store 04, Gulshan' : 'Tap to Verify GPS Location'}
            </Text>
            <Text style={styles.gpsSub}>{gpsVerified ? 'Location confirmed' : 'Mandatory before submission'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreChip, { backgroundColor: colors.statusActive }]}>
            <Text style={[styles.scoreVal, { color: colors.statusActiveText }]}>{passCount} Pass</Text>
          </View>
          <View style={[styles.scoreChip, { backgroundColor: '#FFF0F0' }]}>
            <Text style={[styles.scoreVal, { color: colors.error }]}>{failCount} Issue</Text>
          </View>
          <Text style={styles.scoreProgress}>{answered}/{CHECKLIST_ITEMS.length} answered</Text>
        </View>

        {CHECKLIST_ITEMS.map((item) => (
          <View key={item.id} style={[styles.itemCard, shadow.sm]}>
            <View style={styles.itemHeader}>
              <View style={[styles.catChip, { backgroundColor: colors.primaryBg }]}>
                <Text style={styles.catChipText}>{item.category}</Text>
              </View>
            </View>
            <Text style={styles.itemText}>{item.item_text || item.text}</Text>

            {(!item.requires_photo && !item.requires_measurement) && (
              <View style={styles.toggleRow}>
                {TOGGLE_STATES.map((s) => {
                  const ts = TOGGLE_STYLE[s];
                  const active = toggles[item.id] === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.toggleBtn, active && { backgroundColor: ts.bg, borderColor: ts.text }]}
                      onPress={() => setToggle(item.id, s)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.toggleBtnText, active && { color: ts.text }]}>{ts.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {item.requires_measurement && (
              <View style={styles.measureRow}>
                <TextInput
                  style={styles.measureInput}
                  placeholder="Enter value"
                  keyboardType="numeric"
                  value={measures[item.id] || ''}
                  onChangeText={(v) => setMeasure(item.id, v)}
                  placeholderTextColor={colors.lightGrey}
                />
                <View style={styles.unitBadge}><Text style={styles.unitText}>{item.unit}</Text></View>
              </View>
            )}

            {item.requires_photo && (
              <TouchableOpacity style={styles.photoBtn} onPress={() => handlePhoto(item.id)} activeOpacity={0.85}>
                {photos[item.id]
                  ? <View style={styles.photoThumb}><Text style={styles.photoThumbText}>📷 Photo captured</Text></View>
                  : <Text style={styles.photoBtnText}>📷 Take Photo</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={[styles.submitBtn, shadow.green]} onPress={handleSubmit} disabled={submit.isPending} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>{submit.isPending ? 'Submitting...' : 'Submit Checklist'}</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.background },
  scroll:          { flex: 1 },
  content:         { padding: 16, gap: 12 },
  gpsBanner:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF8E1', borderRadius: radius.lg, padding: 14, borderWidth: 1.5, borderColor: colors.warning },
  gpsBannerDone:   { backgroundColor: colors.statusActive, borderColor: colors.success },
  gpsIcon:         { fontSize: 24 },
  gpsTitle:        { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  gpsTitleDone:    { color: colors.statusActiveText },
  gpsSub:          { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  scoreRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreChip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  scoreVal:        { fontSize: typography.sm, fontWeight: '700' },
  scoreProgress:   { fontSize: typography.xs, color: colors.lightGrey, marginLeft: 'auto' },
  itemCard:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14 },
  itemHeader:      { marginBottom: 8 },
  catChip:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  catChipText:     { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  itemText:        { fontSize: typography.sm, fontWeight: '600', color: colors.dark, marginBottom: 12, lineHeight: 20 },
  toggleRow:       { flexDirection: 'row', gap: 8 },
  toggleBtn:       { flex: 1, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  toggleBtnText:   { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  measureRow:      { flexDirection: 'row', gap: 8, alignItems: 'center' },
  measureInput:    { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: typography.sm, color: colors.dark },
  unitBadge:       { backgroundColor: colors.inputBg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
  unitText:        { fontSize: typography.sm, color: colors.midGrey, fontWeight: '600' },
  photoBtn:        { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', borderStyle: 'dashed' },
  photoBtnText:    { fontSize: typography.sm, color: colors.midGrey, fontWeight: '600' },
  photoThumb:      { backgroundColor: colors.statusActive, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md },
  photoThumbText:  { fontSize: typography.xs, color: colors.statusActiveText, fontWeight: '700' },
  submitBtn:       { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnText:   { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
