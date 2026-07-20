import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { getCurrentGPS } from '../../utils/gps';
import client from '../../api/client';

export default function InstallationScreen({ route, navigation }) {
  const template = route.params?.template;
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [placementZone, setPlacementZone] = useState('');
  const [notes, setNotes] = useState('');

  const submit = useMutation({
    mutationFn: ({ template_id, store_id, lat, lng, notes: n }) =>
      client.post('/signage/installations', { template_id, store_id, lat, lng, notes: n }).then(r => r.data),
    onSuccess: () => Alert.alert('Logged!', 'Installation recorded.', [{ text: 'OK', onPress: () => navigation.goBack() }]),
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed'),
  });

  const canSubmit = gps !== null;

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
    submit.mutate({
      template_id: template?.id,
      store_id: template?.store_id ?? null,
      lat: gps.lat,
      lng: gps.lng,
      notes: [placementZone, notes].filter(Boolean).join(' | ') || notes,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Confirm Installation" subtitle={template?.title} onBack={() => navigation.goBack()} />

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

        {/* GPS */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📍 GPS Verification</Text>
          <Text style={styles.cardDesc}>Required to verify on-site installation.</Text>
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
              {gpsLoading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.gpsBtnText}>Get My Location</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Placement Zone */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📌 Placement Zone</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Front Window Left, Aisle 3, Checkout Counter..."
            placeholderTextColor={colors.lightGrey}
            value={placementZone}
            onChangeText={setPlacementZone}
          />
        </View>

        {/* Photos */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📷 Installation Photos</Text>
          <Text style={styles.cardDesc}>Capture the installed signage in position.</Text>
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
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Any observations about placement or condition..."
            placeholderTextColor={colors.lightGrey}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, (!canSubmit || submit.isPending) && styles.ctaBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submit.isPending}
          activeOpacity={0.85}
        >
          {submit.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaBtnText}>Confirm Installation</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.background },
  scroll:             { flex: 1 },
  content:            { padding: 16, gap: 14 },
  templateBanner:     { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateIcon:       { fontSize: 32 },
  templateTitle:      { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  templateDims:       { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  card:               { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:          { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  cardDesc:           { fontSize: typography.sm, color: colors.midGrey, marginBottom: 12 },
  gpsSuccess:         { backgroundColor: colors.primaryBg, borderRadius: radius.md, padding: 12, gap: 2 },
  gpsSuccessText:     { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
  gpsCoords:          { fontSize: typography.xs, color: colors.midGrey },
  gpsAccuracy:        { fontSize: typography.xs, color: colors.lightGrey },
  gpsBtn:             { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  gpsBtnText:         { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
  input:              { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: typography.sm, color: colors.dark, backgroundColor: colors.inputBg },
  photoGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  photoThumb:         { width: 80, height: 80, borderRadius: radius.md, overflow: 'hidden' },
  photoImg:           { width: '100%', height: '100%' },
  removePhoto:        { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removePhotoText:    { color: colors.white, fontSize: 11, fontWeight: '700' },
  photoBtns:          { flexDirection: 'row', gap: 10 },
  photoBtn:           { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  photoBtnText:       { color: colors.primary, fontSize: typography.sm, fontWeight: '700' },
  textArea:           { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: typography.sm, color: colors.dark, minHeight: 96, backgroundColor: colors.inputBg },
  ctaBar:             { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn:             { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadow.green },
  ctaBtnDisabled:     { backgroundColor: colors.border },
  ctaBtnText:         { color: colors.white, fontSize: typography.md, fontWeight: '700' },
});
