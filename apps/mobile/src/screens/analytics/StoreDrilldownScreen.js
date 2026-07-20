import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';

function scoreColor(v) {
  if (v >= 80) return colors.success;
  if (v >= 60) return colors.warning;
  return colors.error;
}

function componentColor(score) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
}

function ComponentBar({ label, value, color }) {
  return (
    <View style={styles.compRow}>
      <Text style={styles.compLabel}>{label}</Text>
      <View style={styles.compTrack}>
        <View style={[styles.compFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.compPct, { color }]}>{value}%</Text>
    </View>
  );
}

export default function StoreDrilldownScreen({ navigation, route }) {
  const storeId = route.params?.store?.store_id || route.params?.store?.id;
  const storeName = route.params?.store?.name || 'Store Drilldown';

  const { data, isLoading } = useQuery({
    queryKey: ['store-drilldown', storeId],
    queryFn: () => client.get(`/analytics/store/${storeId}`).then(r => r.data),
    enabled: !!storeId,
  });

  const overallScore = data?.score ?? route.params?.store?.score ?? 0;
  const componentScores = data?.component_scores || [];
  const recentAudits = data?.recent_audits || [];
  const openIssues = data?.open_issues || [];

  const ringColor = scoreColor(overallScore);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Store Drilldown" subtitle={storeName} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Store Header Card */}
          <View style={[styles.storeHeader, shadow.md]}>
            <View style={styles.storeHeaderLeft}>
              <Text style={styles.storeName}>{storeName}</Text>
              {data?.region ? <Text style={styles.storeRegion}>{data.region}</Text> : null}
              <View style={styles.statusRow}>
                <StatusChip label="Top Performer" variant="active" />
              </View>
            </View>
            <View style={[styles.smallRing, { borderColor: ringColor }]}>
              <Text style={[styles.smallRingScore, { color: ringColor }]}>{overallScore}</Text>
            </View>
          </View>

          {/* Component Scores */}
          {componentScores.length > 0 && (
            <View style={[styles.card, shadow.sm]}>
              <Text style={styles.cardTitle}>Component Scores</Text>
              <View style={styles.compBars}>
                {componentScores.map((c) => {
                  const color = c.color || componentColor(c.score);
                  return (
                    <ComponentBar key={c.module} label={c.module} value={c.score} color={color} />
                  );
                })}
              </View>
            </View>
          )}

          {/* Recent Audits */}
          {recentAudits.length > 0 && (
            <View style={[styles.card, shadow.sm]}>
              <Text style={styles.cardTitle}>Recent Audits</Text>
              {recentAudits.map((a, i) => {
                const chipVariant = a.status === 'Pass' || a.score >= 80 ? 'active' : 'warning';
                const statusLabel = a.status || (a.score >= 80 ? 'Pass' : 'Warning');
                return (
                  <View key={i} style={[styles.auditRow, i < recentAudits.length - 1 && styles.auditBorder]}>
                    <Text style={styles.auditDate}>{a.date || a.created_at}</Text>
                    <Text style={[styles.auditScore, { color: scoreColor(a.score) }]}>{a.score}%</Text>
                    <StatusChip label={statusLabel} variant={chipVariant} />
                  </View>
                );
              })}
            </View>
          )}

          {/* Open Issues */}
          {openIssues.length > 0 && (
            <View style={[styles.card, shadow.sm]}>
              <Text style={styles.cardTitle}>Open Issues</Text>
              {openIssues.map((issue, idx) => {
                const dotColor = issue.severity === 'warning' ? colors.warning : colors.info;
                return (
                  <View key={issue.id || idx} style={styles.issueRow}>
                    <View style={[styles.issueDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.issueText}>{issue.text || issue.message}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { flex: 1 },
  content:        { padding: 16, gap: 14 },

  storeHeader:    { backgroundColor: colors.white, borderRadius: radius.xl, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storeHeaderLeft:{ flex: 1 },
  storeName:      { fontSize: typography.lg, fontWeight: '800', color: colors.dark, marginBottom: 2 },
  storeRegion:    { fontSize: typography.sm, color: colors.midGrey, marginBottom: 8 },
  statusRow:      { flexDirection: 'row' },
  smallRing:      { width: 80, height: 80, borderRadius: 40, borderWidth: 7, alignItems: 'center', justifyContent: 'center' },
  smallRingScore: { fontSize: 24, fontWeight: '900' },

  card:           { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:      { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },

  compBars:       { gap: 9 },
  compRow:        { flexDirection: 'row', alignItems: 'center' },
  compLabel:      { width: 76, fontSize: typography.xs, color: colors.dark, fontWeight: '600' },
  compTrack:      { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginHorizontal: 8 },
  compFill:       { height: 8, borderRadius: radius.full },
  compPct:        { width: 38, fontSize: typography.xs, fontWeight: '800', textAlign: 'right' },

  auditRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  auditBorder:    { borderBottomWidth: 1, borderBottomColor: colors.border },
  auditDate:      { flex: 1, fontSize: typography.sm, color: colors.dark, fontWeight: '500' },
  auditScore:     { fontSize: typography.md, fontWeight: '800', marginRight: 12 },

  issueRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 10 },
  issueDot:       { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  issueText:      { flex: 1, fontSize: typography.sm, color: colors.dark, lineHeight: 18 },
});
