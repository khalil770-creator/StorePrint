import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import { getCurrentGPS } from '../../utils/gps';
import client from '../../api/client';

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes', color: colors.primary },
  { label: 'No',  value: 'no',  color: colors.error   },
  { label: 'N/A', value: 'na',  color: colors.lightGrey },
];

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

function showAlert(title, msg) {
  if (Platform.OS === 'web') { window.alert(`${title}\n${msg}`); }
  else { Alert.alert(title, msg); }
}

function QuestionInput({ q, response, onAnswer }) {
  const type = q.type || 'yes_no';

  if (type === 'yes_no') {
    return (
      <View style={styles.options}>
        {YES_NO_OPTIONS.map(opt => {
          const sel = response?.value === opt.value;
          return (
            <TouchableOpacity
              key={opt.label}
              style={[styles.optBtn, sel && { backgroundColor: opt.color, borderColor: opt.color }]}
              onPress={() => onAnswer(q.id, { value: opt.value, display: opt.label })}>
              <Text style={[styles.optText, sel && styles.optSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (type === 'score_1_5') {
    return (
      <View style={styles.options}>
        {SCORE_OPTIONS.map(n => {
          const sel = response?.value === n;
          const color = n >= 4 ? colors.primary : n === 3 ? colors.warning : colors.error;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.scoreBtn, sel && { backgroundColor: color, borderColor: color }]}
              onPress={() => onAnswer(q.id, { value: n, display: String(n) })}>
              <Text style={[styles.scoreBtnText, sel && styles.optSelected]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (type === 'photo') {
    const uri = response?.uri;
    const isNA = response?.value === 'na';

    const pickPhoto = async () => {
      if (Platform.OS === 'web') {
        // Web: use file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          onAnswer(q.id, { value: 'photo_taken', uri: url, display: 'Photo taken' });
        };
        input.click();
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onAnswer(q.id, { value: 'photo_taken', uri: asset.uri, display: 'Photo taken' });
      }
    };

    const pickFromGallery = async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission needed', 'Gallery permission is required.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onAnswer(q.id, { value: 'photo_taken', uri: asset.uri, display: 'Photo taken' });
      }
    };

    return (
      <View>
        {uri ? (
          <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
        ) : null}
        <View style={styles.photoRow}>
          <TouchableOpacity style={[styles.photoBtn, uri && styles.photoBtnDone]} onPress={pickPhoto}>
            <Text style={[styles.photoBtnText, uri && { color: colors.white }]}>
              {uri ? '📸  Retake' : '📸  Take Photo'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
            <Text style={styles.galleryBtnText}>🖼  Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.naBtn, isNA && { backgroundColor: colors.lightGrey, borderColor: colors.lightGrey }]}
            onPress={() => onAnswer(q.id, { value: 'na', display: 'N/A' })}>
            <Text style={[styles.optText, isNA && { color: colors.white }]}>N/A</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (type === 'text') {
    return (
      <TextInput
        style={styles.textAnswer}
        placeholder="Type your answer…"
        placeholderTextColor={colors.lightGrey}
        value={response?.value || ''}
        onChangeText={v => onAnswer(q.id, { value: v, display: v })}
        multiline
      />
    );
  }

  return null;
}

/* ─────────────────────────────────────────
   New Audit picker (mode === 'new')
───────────────────────────────────────── */
function NewAuditPicker({ navigation }) {
  const [selectedStore,    setSelectedStore]    = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [starting,         setStarting]         = useState(false);

  const { data: templates, isLoading: loadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ['audit-templates'],
    queryFn: () => client.get('/auditing/templates').then(r => r.data),
  });

  const { data: storesData, isLoading: loadingStores, refetch: refetchStores } = useQuery({
    queryKey: ['stores-list'],
    queryFn: () => client.get('/stores/list').then(r => r.data),
  });
  const stores = Array.isArray(storesData) ? storesData : [];

  const startAudit = async () => {
    if (!selectedStore)    { Alert.alert('Select Store',    'Please choose a store.');    return; }
    if (!selectedTemplate) { Alert.alert('Select Template', 'Please choose a template.'); return; }
    setStarting(true);
    try {
      const pos = await getCurrentGPS();
      const { data: newAudit } = await client.post('/auditing/start', {
        store_id:    selectedStore.id,
        template_id: selectedTemplate.id,
        gps: {
          lat:       pos.lat,
          lng:       pos.lng,
          device_id: null,
        },
      });
      navigation.replace('AuditForm', { audit: newAudit });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'Failed to start audit');
    } finally {
      setStarting(false);
    }
  };

  if (loadingTemplates || loadingStores) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  }

  if (!templates || !storesData) {
    return (
      <Text style={styles.retryText} onPress={() => { refetchTemplates(); refetchStores(); }}>
        Failed to load. Tap to retry.
      </Text>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pickerSection}>Select Template</Text>
      {(templates || []).map(t => (
        <TouchableOpacity
          key={t.id}
          style={[styles.chipRow, selectedTemplate?.id === t.id && styles.chipRowActive]}
          onPress={() => setSelectedTemplate(t)}>
          <Text style={[styles.chipText, selectedTemplate?.id === t.id && styles.chipTextActive]}>{t.name}</Text>
          {t.description ? <Text style={styles.chipSub}>{t.description}</Text> : null}
        </TouchableOpacity>
      ))}

      <Text style={[styles.pickerSection, { marginTop: 20 }]}>Select Store</Text>
      {stores.map(s => (
        <TouchableOpacity
          key={s.id}
          style={[styles.chipRow, selectedStore?.id === s.id && styles.chipRowActive]}
          onPress={() => setSelectedStore(s)}>
          <Text style={[styles.chipText, selectedStore?.id === s.id && styles.chipTextActive]}>{s.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, (!selectedStore || !selectedTemplate || starting) && styles.disabled]}
        onPress={startAudit}
        disabled={!selectedStore || !selectedTemplate || starting}>
        {starting
          ? <ActivityIndicator color={colors.white} />
          : <Text style={styles.submitText}>Start Audit  →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ─────────────────────────────────────────
   Continue / fill audit questions
───────────────────────────────────────── */
function AuditQuestions({ auditId, navigation }) {
  const [responses,   setResponses]   = useState({});
  const [gpsVerified, setGpsVerified] = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const { data: audit, isLoading, refetch } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => client.get('/auditing/' + auditId).then(r => r.data),
    enabled: !!auditId,
  });

  const saveResponse = useMutation({
    mutationFn: ({ questionId, value, photoUri }) =>
      client.post(`/auditing/${auditId}/responses`, {
        question_id: questionId,
        response: String(value),
        photo_url: photoUri || null,
      }).then(r => r.data),
  });

  const questions = (audit?.categories || []).flatMap(c =>
    (c.questions || []).map(q => ({ ...q, cat: c.name || c.title }))
  );
  const categories = [...new Set(questions.map(q => q.cat))];
  const answered   = Object.keys(responses).length;
  const total      = questions.length;
  const progress   = total ? Math.round((answered / total) * 100) : 0;

  const verifyGPS = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentGPS();
      setGpsVerified(true);
      showAlert('GPS Verified', 'Location confirmed (' + Math.round(pos.accuracy_m || 0) + 'm accuracy)');
    } catch (e) {
      showAlert('GPS Error', e.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleAnswer = (questionId, opt) => {
    setResponses(r => ({ ...r, [questionId]: opt }));
    saveResponse.mutate({ questionId, value: opt.value, photoUri: opt.uri || null });
  };

  const submit = async () => {
    if (!gpsVerified) { showAlert('GPS Required', 'Verify your location before submitting.'); return; }
    if (answered < total) { showAlert('Incomplete', (total - answered) + ' questions remain unanswered.'); return; }
    setSubmitting(true);
    try {
      const pos = await getCurrentGPS();
      const { data: submitted } = await client.post(`/auditing/${auditId}/submit`, {
        store_id: audit?.store_id,
        gps: { lat: pos.lat, lng: pos.lng },
      });
      navigation.replace('AuditReport', { audit: submitted });
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  }
  if (!audit) {
    return <Text style={styles.retryText} onPress={refetch}>Failed to load. Tap to retry.</Text>;
  }

  return (
    <>
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: progress + '%' }]} />
        </View>
        <Text style={styles.progressText}>{answered}/{total}</Text>
      </View>
      <TouchableOpacity
        style={[styles.gpsBanner, gpsVerified && styles.gpsVerified]}
        onPress={gpsVerified ? undefined : verifyGPS}
        disabled={gpsLoading || gpsVerified}>
        {gpsLoading
          ? <ActivityIndicator color={colors.white} size="small" />
          : <Text style={styles.gpsBannerText}>{gpsVerified ? '✅  Location verified' : '📍  Tap to verify your location'}</Text>}
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll}>
        {categories.map(cat => (
          <View key={cat}>
            <Text style={styles.catTitle}>{cat}</Text>
            {questions.filter(q => q.cat === cat).map(q => (
              <View key={q.id} style={styles.questionCard}>
                <View style={styles.qHeader}>
                  <Text style={styles.qText}>{q.text || q.question || q.q}</Text>
                  {q.required && <Text style={styles.reqBadge}>Required</Text>}
                </View>
                <View style={styles.qMeta}>
                  {q.weight > 1 && <Text style={styles.weight}>Weight: {q.weight}x</Text>}
                  <Text style={styles.typeBadge}>{(q.type || 'yes_no').replace('_', ' ')}</Text>
                </View>
                <QuestionInput q={q} response={responses[q.id]} onAnswer={handleAnswer} />
              </View>
            ))}
          </View>
        ))}
        <TouchableOpacity
          style={[styles.submitBtn, (!gpsVerified || answered < total || submitting) && styles.disabled]}
          onPress={submit}
          disabled={!gpsVerified || answered < total || submitting}>
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.submitText}>Submit Audit  →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

/* ─────────────────────────────────────────
   Main screen — routes to picker or form
───────────────────────────────────────── */
export default function AuditFormScreen({ route, navigation }) {
  const mode  = route.params?.mode;
  const audit = route.params?.audit;
  const title = mode === 'new' ? 'New Audit' : 'Conduct Audit';
  const sub   = audit ? (audit.store_name || audit.store || '') : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={title} subtitle={sub} onBack={() => navigation.goBack()} />
      {mode === 'new'
        ? <NewAuditPicker navigation={navigation} />
        : <AuditQuestions auditId={audit?.id} navigation={navigation} />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.background },
  retryText:     { textAlign: 'center', marginTop: 40, color: colors.error, fontSize: typography.sm },
  progressWrap:  { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  progressBg:    { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginRight: 12 },
  progressFill:  { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  progressText:  { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  gpsBanner:     { marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.warning, borderRadius: radius.md, padding: 13, alignItems: 'center' },
  gpsVerified:   { backgroundColor: colors.primary },
  gpsBannerText: { color: colors.white, fontWeight: '700', fontSize: typography.sm },
  scroll:        { padding: 16, paddingBottom: 40 },
  pickerSection: { fontSize: typography.sm, fontWeight: '800', color: colors.primary,
                   textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  chipRow:       { backgroundColor: colors.white, borderRadius: radius.md, padding: 14,
                   marginBottom: 8, borderWidth: 1.5, borderColor: colors.border, ...shadow.sm },
  chipRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  chipText:      { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  chipTextActive: { color: colors.primary },
  chipSub:       { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  catTitle:      { fontSize: typography.sm, fontWeight: '800', color: colors.primary,
                   textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 10 },
  questionCard:  { backgroundColor: colors.white, borderRadius: radius.md, padding: 14,
                   marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  qHeader:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  qText:         { flex: 1, fontSize: typography.sm, fontWeight: '600', color: colors.dark, lineHeight: 20 },
  reqBadge:      { fontSize: 10, fontWeight: '700', color: colors.error, marginLeft: 8, marginTop: 2 },
  qMeta:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  weight:        { fontSize: typography.xs, color: colors.lightGrey },
  typeBadge:     { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'capitalize',
                   backgroundColor: colors.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  options:       { flexDirection: 'row', gap: 6 },
  optBtn:        { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  optText:       { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  optSelected:   { color: colors.white },
  scoreBtn:      { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm,
                   paddingVertical: 10, alignItems: 'center' },
  scoreBtnText:  { fontSize: typography.sm, fontWeight: '800', color: colors.midGrey },
  photoPreview:  { width: '100%', height: 160, borderRadius: radius.sm, marginBottom: 8 },
  photoRow:      { flexDirection: 'row', gap: 8 },
  photoBtn:      { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.sm,
                   paddingVertical: 10, alignItems: 'center', backgroundColor: colors.primaryBg },
  photoBtnDone:  { backgroundColor: colors.primary },
  photoBtnText:  { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  galleryBtn:    { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm,
                   paddingVertical: 10, alignItems: 'center', backgroundColor: colors.white },
  galleryBtnText: { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  naBtn:         { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm,
                   paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  textAnswer:    { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm,
                   padding: 10, fontSize: typography.sm, color: colors.dark, minHeight: 72,
                   textAlignVertical: 'top' },
  submitBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 12 },
  disabled:      { opacity: 0.45 },
  submitText:    { color: colors.white, fontWeight: '800', fontSize: typography.md },
});
