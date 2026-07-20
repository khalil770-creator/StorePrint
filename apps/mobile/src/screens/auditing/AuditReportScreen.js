import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip   from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

function ScoreRing({ score }) {
  const color = score >= 80 ? colors.primary : score >= 60 ? colors.warning : colors.error;
  return (
    <View style={[styles.ring, { borderColor: color }]}>
      <Text style={[styles.ringScore, { color }]}>{score}%</Text>
      <Text style={styles.ringLabel}>Overall</Text>
    </View>
  );
}

export default function AuditReportScreen({ route, navigation }) {
  const auditParam = route.params?.audit;
  const auditId    = auditParam?.id;

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['audit-report', auditId],
    queryFn: () => client.get(`/auditing/${auditId}`).then(r => r.data),
    enabled: !!auditId,
    // seed with whatever we already have from navigation
    initialData: auditParam,
  });

  const overall     = report?.score ?? 0;
  const categories  = report?.categories || [];
  const storeName   = report?.store_name || report?.store || auditParam?.store_name || auditParam?.store || '';
  const templateName = report?.template_name || report?.template || auditParam?.template_name || auditParam?.template || '';
  const submittedAt = report?.created_at ? new Date(report.created_at).toLocaleString() : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Audit Report" subtitle={storeName} onBack={() => navigation.goBack()} />

      {isLoading && !report ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !report ? (
        <Text style={styles.retryText} onPress={refetch}>Failed to load. Tap to retry.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          <View style={styles.summaryCard}>
            <ScoreRing score={overall} />
            <View style={styles.summaryInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.template}>{templateName}</Text>
              <StatusChip status={overall >= 80 ? 'completed' : 'warning'} label={overall >= 80 ? 'PASSED' : 'NEEDS WORK'} />
              {submittedAt ? <Text style={styles.date}>Submitted: {submittedAt}</Text> : null}
            </View>
          </View>

          {categories.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              {categories.map(cat => {
                const pct      = cat.score ?? 0;
                const barColor = pct >= 80 ? colors.primary : pct >= 60 ? colors.warning : colors.error;
                return (
                  <View key={cat.name || cat.title} style={styles.catRow}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{cat.name || cat.title}</Text>
                      <Text style={[styles.catScore, { color: barColor }]}>{pct}%</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: pct + '%', backgroundColor: barColor }]} />
                    </View>
                  </View>
                );
              })}
            </>
          )}

          <TouchableOpacity
            style={styles.caBtn}
            onPress={() => navigation.navigate('CorrectiveActions')}>
            <Text style={styles.caBtnText}>⚠  View Corrective Actions</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },
  retryText:    { textAlign: 'center', marginTop: 40, color: colors.error, fontSize: typography.sm },
  scroll:       { padding: 16, paddingBottom: 40 },
  summaryCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                  borderRadius: radius.lg, padding: 20, marginBottom: 16, shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  ring:         { width: 90, height: 90, borderRadius: 45, borderWidth: 6,
                  alignItems: 'center', justifyContent: 'center', marginRight: 20 },
  ringScore:    { fontSize: typography.xl, fontWeight: '800' },
  ringLabel:    { fontSize: typography.xs, color: colors.midGrey },
  summaryInfo:  { flex: 1 },
  storeName:    { fontSize: typography.lg, fontWeight: '800', color: colors.dark },
  template:     { fontSize: typography.xs, color: colors.midGrey, marginBottom: 8, marginTop: 2 },
  date:         { fontSize: typography.xs, color: colors.lightGrey, marginTop: 6 },
  sectionTitle: { fontSize: typography.md, fontWeight: '700', color: colors.darkGrey, marginBottom: 12 },
  catRow:       { backgroundColor: colors.white, borderRadius: radius.md, padding: 14,
                  marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  catHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  catName:      { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  catScore:     { fontSize: typography.sm, fontWeight: '800' },
  barBg:        { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: 8, borderRadius: 4 },
  caBtn:        { marginTop: 8, borderWidth: 1.5, borderColor: colors.warning, borderRadius: radius.md,
                  padding: 15, alignItems: 'center' },
  caBtnText:    { color: colors.warning, fontWeight: '700', fontSize: typography.sm },
});
