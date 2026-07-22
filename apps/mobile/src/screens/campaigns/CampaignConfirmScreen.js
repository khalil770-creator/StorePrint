import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Image, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { getCurrentGPS } from '../../utils/gps';
import client from '../../api/client';

export default function CampaignConfirmScreen({ route, navigation }) {
  const campaign = route.params?.campaign || {};
  const { data: myStore } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => client.get('/field/my-store').then(r => r.data),
  });
  const storeId = campaign.stores?.[0]?.id ?? route.params?.store_id ?? myStore?.id ?? null;
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const qc = useQueryClient();
  const confirm = useMutation({
    mutationFn: ({ store_id, gps: g, notes: n }) =>
      client.post(`/campaigns/${campaign.id}/confirm`, { store_id, gps: g, notes: n }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['campaign', campaign.id] });
      setSubmitted(true);
      setTimeout(() => navigation.goBack(), 2000);
    },
    onError: (err) => setErrorMsg(err.response?.data?.error || 'Confirmation failed'),
  });

  const canSubmit = gps && photos.length > 0;

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

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed to attach photos.');
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
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    if (!storeId) {
      setErrorMsg('Your account is not assigned to a store. Please contact your manager.');
      return;
    }
    setErrorMsg('');
    confirm.mutate({ store_id: storeId, gps: { lat: gps.lat, lng: gps.lng, accuracy_m: gps.accuracy_m }, notes });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Confirm Execution" subtitle={campaign.title} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* GPS Banner */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📍 GPS Verification</Text>
          <Text style={styles.cardDesc}>Your location is required to verify on-site execution.</Text>
          {gps ? (
            <View style={styles.gpsSuccess}>
              <Text style={styles.gpsSuccessText}>✅ Location captured</Text>
              <Text style={styles.gpsCoords}>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</Text>
              <Text style={styles.gpsAccuracy}>Accuracy: ±{Math.round(gps.accuracy_m)}m</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGetGPS}
              disabled={gpsLoading}
              activeOpacity={0.85}
            >
              {gpsLoading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.gpsBtnText}>Get My Location</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Picker */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📷 Photo Evidence</Text>
          <Text style={styles.cardDesc}>Attach photos showing the campaign execution in-store.</Text>

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
          </View>

          <View style={styles.photoBtns}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
              <Text style={styles.photoBtnText}>📸 Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto} activeOpacity={0.85}>
              <Text style={styles.photoBtnText}>🖼️ Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📝 Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Add any observations or comments about the execution..."
            placeholderTextColor={colors.lightGrey}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {!canSubmit && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              {!gps && '• GPS location required\n'}
              {photos.length === 0 && '• At least 1 photo required'}
            </Text>
          </View>
        )}

        {submitted && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ Campaign execution confirmed! Redirecting...</Text>
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
          style={[styles.ctaBtn, (!canSubmit || confirm.isPending) && styles.ctaBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || confirm.isPending}
          activeOpacity={0.85}
        >
          {confirm.isPending
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.ctaBtnText}>Submit Confirmation</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { flex: 1 },
  content:        { padding: 16, gap: 14 },
  card:           { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:      { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  cardDesc:       { fontSize: typography.sm, color: colors.midGrey, marginBottom: 12 },
  gpsSuccess:     { backgroundColor: colors.primaryBg, borderRadius: radius.md, padding: 12, gap: 2 },
  gpsSuccessText: { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
  gpsCoords:      { fontSize: typography.xs, color: colors.midGrey },
  gpsAccuracy:    { fontSize: typography.xs, color: colors.lightGrey },
  gpsBtn:         { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  gpsBtnText:     { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
  photoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  photoThumb:     { width: 80, height: 80, borderRadius: radius.md, overflow: 'hidden' },
  photoImg:       { width: '100%', height: '100%' },
  removePhoto:    { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removePhotoText:{ color: colors.white, fontSize: 11, fontWeight: '700' },
  photoBtns:      { flexDirection: 'row', gap: 10 },
  photoBtn:       { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  photoBtnText:   { color: colors.primary, fontSize: typography.sm, fontWeight: '700' },
  notesInput:     { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: typography.sm, color: colors.dark, minHeight: 96, backgroundColor: colors.inputBg },
  hintBox:        { backgroundColor: '#FFF8E1', borderRadius: radius.md, padding: 12 },
  hintText:       { fontSize: typography.sm, color: '#F57F17', lineHeight: 20 },
  successBox:     { backgroundColor: '#D1FAE5', borderRadius: radius.md, padding: 14, alignItems: 'center' },
  successText:    { fontSize: typography.sm, fontWeight: '700', color: '#065F46' },
  errorBox:       { backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: 14 },
  errorText:      { fontSize: typography.sm, fontWeight: '600', color: '#991B1B' },
  ctaBar:         { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn:         { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadow.green },
  ctaBtnDisabled: { backgroundColor: colors.border },
  ctaBtnText:     { color: colors.white, fontSize: typography.md, fontWeight: '700' },
});
