import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const CATEGORY_COLORS = {
  Window: '#4A90E2',
  'In-Store': '#0052CC',
  POS: '#F5A623',
  Digital: '#9B59B6',
};

export default function SignageDetailScreen({ route, navigation }) {
  const id = route.params?.template?.id;
  const { data: template = route.params?.template || {}, isLoading } = useQuery({
    queryKey: ['signage-template', id],
    queryFn: () => client.get(`/signage/templates/${id}`).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading && !route.params?.template) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Signage" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const catColor = CATEGORY_COLORS[template.type || template.category] || colors.midGrey;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={template.name || template.title || 'Signage'} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Large Preview */}
        <View style={[styles.preview, shadow.sm, { backgroundColor: catColor + '15' }]}>
          <Text style={styles.previewIcon}>🪧</Text>
          <Text style={styles.previewFilename}>{template.file_url || template.filename || 'template_file.pdf'}</Text>
        </View>

        {/* Details Card */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Template Details</Text>
          <Detail label="Title" value={template.name || template.title || '—'} />
          <Detail label="Category" value={template.type || template.category || '—'} />
          <Detail label="Dimensions" value={template.dimensions || '—'} />
          <Detail label="Material" value={template.material || '—'} />
          <Detail label="File" value={template.file_url || template.filename || '—'} />
          {!!template.description && (
            <View style={[styles.descBox]}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.descText}>{template.description}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={[styles.downloadBtn, shadow.sm]} activeOpacity={0.85}>
          <Text style={styles.downloadBtnText}>⬇️ Download Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.printBtn, shadow.green]}
          onPress={() => navigation.navigate('PrintRequest', { template })}
          activeOpacity={0.85}
        >
          <Text style={styles.printBtnText}>🖨️ Request Print</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.installBtn, shadow.sm]}
          onPress={() => navigation.navigate('Installation', { template })}
          activeOpacity={0.85}
        >
          <Text style={styles.installBtnText}>📌 Confirm Installation</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  safe:         { flex: 1, backgroundColor: colors.background },
  scroll:       { flex: 1 },
  content:      { padding: 16, gap: 14 },
  preview:      { height: 200, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 10 },
  previewIcon:  { fontSize: 52 },
  previewFilename: { fontSize: typography.xs, color: colors.midGrey },
  card:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:    { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 10 },
  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel:  { fontSize: typography.sm, color: colors.midGrey },
  detailValue:  { fontSize: typography.sm, fontWeight: '600', color: colors.dark, flex: 1, textAlign: 'right' },
  descBox:      { backgroundColor: colors.inputBg, borderRadius: radius.md, padding: 12, marginTop: 10 },
  descTitle:    { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 6 },
  descText:     { fontSize: typography.sm, color: colors.darkGrey, lineHeight: 20 },
  downloadBtn:  { backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary },
  downloadBtnText: { color: colors.primary, fontSize: typography.sm, fontWeight: '700' },
  printBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  printBtnText: { color: colors.white, fontSize: typography.md, fontWeight: '700' },
  installBtn:   { backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.info },
  installBtnText: { color: colors.info, fontSize: typography.sm, fontWeight: '700' },
});
