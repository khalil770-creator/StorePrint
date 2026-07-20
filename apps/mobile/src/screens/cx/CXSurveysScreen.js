import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const SURVEY_TYPE_COLOR = { NPS: colors.success, CSAT: colors.info, Custom: '#9B59B6' };

export default function CXSurveysScreen({ navigation }) {
  const [showQR, setShowQR] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cx-surveys'],
    queryFn: () => client.get('/cx/surveys').then(r => r.data),
  });
  const surveys = Array.isArray(data) ? data : (data?.data || []);
  const activeCount = surveys.filter((s) => s.is_active).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Surveys" subtitle="Loading..." onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Surveys"
        subtitle={`${activeCount} active`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, shadow.sm]}
            onPress={() => navigation.navigate('CXConductSurvey', { survey: item })}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={[styles.typeBadge, { backgroundColor: (SURVEY_TYPE_COLOR[item.type] || colors.primary) + '20' }]}>
                <Text style={[styles.typeText, { color: SURVEY_TYPE_COLOR[item.type] || colors.primary }]}>{item.type}</Text>
              </View>
              <StatusChip status={item.is_active ? 'active' : 'inactive'} />
            </View>
            <Text style={styles.surveyTitle}>{item.title || item.name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.responses}</Text>
                <Text style={styles.statLabel}>Responses</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.avgScore}</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => setShowQR(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.shareBtnText}>Share QR</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!showQR} transparent animationType="fade" onRequestClose={() => setShowQR(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowQR(null)}>
          <View style={styles.qrSheet}>
            <Text style={styles.qrTitle}>{showQR?.title}</Text>
            <Text style={styles.qrSub}>Scan to open survey</Text>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>▪▪▪{'\n'}▪ ▪{'\n'}▪▪▪</Text>
              <Text style={styles.qrNote}>QR code would render here</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowQR(null)} activeOpacity={0.85}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },
  list:         { padding: 16, gap: 12, paddingBottom: 32 },
  card:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  typeText:     { fontSize: typography.xs, fontWeight: '700' },
  surveyTitle:  { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  statsRow:     { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  statItem:     { flex: 1, alignItems: 'center' },
  statValue:    { fontSize: typography.lg, fontWeight: '800', color: colors.dark },
  statLabel:    { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  shareBtn:     { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primaryBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary + '40' },
  shareBtnText: { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  qrSheet:      { backgroundColor: colors.white, borderRadius: radius.xl, padding: 28, width: 280, alignItems: 'center' },
  qrTitle:      { fontSize: typography.md, fontWeight: '800', color: colors.dark, textAlign: 'center', marginBottom: 4 },
  qrSub:        { fontSize: typography.xs, color: colors.midGrey, marginBottom: 20 },
  qrPlaceholder:{ width: 160, height: 160, backgroundColor: colors.inputBg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  qrIcon:       { fontSize: 28, textAlign: 'center', letterSpacing: 4, lineHeight: 38 },
  qrNote:       { fontSize: typography.xs, color: colors.lightGrey, marginTop: 8, textAlign: 'center' },
  closeBtn:     { paddingHorizontal: 28, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: radius.md },
  closeBtnText: { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
});
