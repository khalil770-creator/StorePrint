import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { getCurrentGPS } from '../../utils/gps';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

export default function VMTaskScreen({ route, navigation }) {
  const task = route.params?.task || {};
  const { user } = useAuthStore();
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [score, setScore] = useState(80);
  const [notes, setNotes] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: myStore } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => client.get('/field/my-store').then(r => r.data),
  });

  const submit = useMutation({
    mutationFn: ({ gps: g, score: s, notes: n, store_id }) =>
      client.post(`/vm/tasks/${task.id}/submit`, { store_id, gps: g, score: s, notes: n }).then(r => r.data),
    onSuccess: () => { setSubmitted(true); setTimeout(() => navigation.goBack(), 2000); },
    onError: (err) => setErrorMsg(err.response?.data?.error || 'Submit failed'),
  });

  const canSubmit = gps !== null;
  const isLocked = task.assigned_to && task.assigned_to !== user?.id;

  async function handleGetGPS() {
    setGpsLoading(true);
    try {
      const loc = await getCurrentGPS();
      setGps(loc);
    } catch (e) {
      Alert.alert('Location Error', e.message);
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const storeId = task.store_id || myStore?.id || null;
    if (!storeId) { setErrorMsg('No store assigned. Please contact your manager.'); return; }
    setErrorMsg('');
    submit.mutate({ store_id: storeId, gps: { lat: gps.lat, lng: gps.lng, accuracy_m: gps.accuracy_m }, score, notes });
  }

  function scoreColor() {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="VM Task" subtitle={task.store} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Planogram Reference */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>🗺️ Planogram Reference</Text>
          <View style={styles.planogramPlaceholder}>
            <Text style={styles.planogramIcon}>🖼️</Text>
            <Text style={styles.planogramText}>Planogram Preview</Text>
          </View>
          <TouchableOpacity style={styles.viewPlanogramBtn} activeOpacity={0.85}>
            <Text style={styles.viewPlanogramText}>View Full Planogram</Text>
          </TouchableOpacity>
        </View>

        {/* Task Details */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📋 Task Details</Text>
          <Detail label="Title" value={task.title || '—'} />
          <Detail label="Template" value={task.template_title || '—'} />
          <Detail label="Store" value={task.store_name || '—'} />
          <Detail label="Assigned To" value={task.assigned_to_name || '—'} />
          <Detail label="Priority" value={task.priority || '—'} />
          <Detail label="Due Date" value={task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <StatusChip status={task.status} />
          </View>
          {!!task.instructions && (
            <View style={[styles.instructionBox]}>
              <Text style={styles.instructionTitle}>Instructions</Text>
              <Text style={styles.instructionText}>{task.instructions}</Text>
            </View>
          )}
        </View>

        {/* GPS */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📍 GPS Verification</Text>
          {gps ? (
            <View style={styles.gpsSuccess}>
              <Text style={styles.gpsSuccessText}>✅ Location captured</Text>
              <Text style={styles.gpsCoords}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.gpsBtn} onPress={handleGetGPS} disabled={gpsLoading} activeOpacity={0.85}>
              {gpsLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.gpsBtnText}>Get My Location</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Photos */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📷 Photo Evidence</Text>
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImg} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleTakePhoto}>
              <Text style={styles.addPhotoIcon}>📸</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
              <Text style={styles.addPhotoIcon}>🖼️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compliance Score */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📊 Compliance Score</Text>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreValue, { color: scoreColor() }]}>{Math.round(score)}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setScore(s => Math.max(0, s - 5))}>
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: score + '%', backgroundColor: scoreColor() }]} />
            </View>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setScore(s => Math.min(100, s + 5))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📝 Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Add observations about the VM task..."
            placeholderTextColor={colors.lightGrey}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {submitted && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ VM task submitted! Redirecting...</Text>
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
        {isLocked ? (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>🔒 Assigned to {task.assigned_to_name || 'another user'}. Only they can submit.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, !canSubmit && styles.ctaBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submit.isPending}
            activeOpacity={0.85}
          >
            {submit.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaBtnText}>Submit VM Task</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.background },
  scroll:             { flex: 1 },
  content:            { padding: 16, gap: 14 },
  card:               { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:          { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 12 },
  planogramPlaceholder: { height: 140, backgroundColor: colors.inputBg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  planogramIcon:      { fontSize: 36, marginBottom: 6 },
  planogramText:      { fontSize: typography.sm, color: colors.lightGrey },
  viewPlanogramBtn:   { borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  viewPlanogramText:  { color: colors.primary, fontSize: typography.sm, fontWeight: '700' },
  detailRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel:        { fontSize: typography.sm, color: colors.midGrey },
  detailValue:        { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  instructionBox:     { backgroundColor: colors.inputBg, borderRadius: radius.md, padding: 12, marginTop: 10 },
  instructionTitle:   { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 6 },
  instructionText:    { fontSize: typography.sm, color: colors.darkGrey, lineHeight: 20 },
  gpsSuccess:         { backgroundColor: colors.primaryBg, borderRadius: radius.md, padding: 12, gap: 2 },
  gpsSuccessText:     { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
  gpsCoords:          { fontSize: typography.xs, color: colors.midGrey },
  gpsBtn:             { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  gpsBtnText:         { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
  photoGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb:         { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden' },
  photoImg:           { width: '100%', height: '100%' },
  removePhoto:        { position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  removePhotoText:    { color: colors.white, fontSize: 10, fontWeight: '700' },
  addPhotoBtn:        { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoIcon:       { fontSize: 26 },
  scoreDisplay:       { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 8 },
  scoreValue:         { fontSize: 48, fontWeight: '800' },
  scoreUnit:          { fontSize: typography.lg, color: colors.lightGrey, marginLeft: 4 },
  stepper:            { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  stepBtn:            { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary },
  stepBtnText:        { fontSize: 20, color: colors.primary, fontWeight: '700', lineHeight: 22 },
  barBg:              { flex: 1, height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  barFill:            { height: 10, borderRadius: 5 },
  slider:             { width: '100%', height: 40 },
  sliderLabels:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  sliderLabel:        { fontSize: typography.xs, color: colors.lightGrey },
  successBox:         { backgroundColor: '#D1FAE5', borderRadius: radius.md, padding: 14, marginHorizontal: 16, alignItems: 'center' },
  successText:        { fontSize: typography.sm, fontWeight: '700', color: '#065F46' },
  errorBox:           { backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: 14, marginHorizontal: 16 },
  errorText:          { fontSize: typography.sm, fontWeight: '600', color: '#991B1B' },
  notesInput:         { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: typography.sm, color: colors.dark, minHeight: 96, backgroundColor: colors.inputBg },
  ctaBar:             { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn:             { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadow.green },
  ctaBtnDisabled:     { backgroundColor: colors.border },
  ctaBtnText:         { color: colors.white, fontSize: typography.md, fontWeight: '700' },
  lockedBanner:       { backgroundColor: '#FEF3C7', borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  lockedText:         { color: '#92400E', fontSize: typography.sm, fontWeight: '600', textAlign: 'center' },
});
