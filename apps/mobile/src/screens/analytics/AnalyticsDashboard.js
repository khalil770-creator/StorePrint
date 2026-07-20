import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { colors, typography, radius, shadow } from '../../constants/theme';
import AppHeader from '../../components/common/AppHeader';

const SPARKLINE_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MODULES = ['Audit', 'VM', 'CX', 'Training'];

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

function severityDot(severity) {
  if (severity === 'critical') return '🔴';
  if (severity === 'warning') return '🟡';
  return '🔵';
}

function severityBorderColor(severity) {
  if (severity === 'critical') return '#D0021B';
  if (severity === 'warning') return '#F5A623';
  return '#4A90E2';
}

function formatAlertTime(created_at) {
  if (!created_at) return '';
  const d = new Date(created_at);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
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

function KpiTile({ tile }) {
  const trendColor = tile.up === true ? colors.success : tile.up === false ? colors.error : colors.midGrey;
  return (
    <View style={[styles.kpiTile, shadow.sm]}>
      <View style={[styles.kpiTopBar, { backgroundColor: tile.color || colors.primary }]} />
      <Text style={styles.kpiIcon}>{tile.icon || '📊'}</Text>
      <Text style={styles.kpiValue}>{tile.value}</Text>
      <Text style={styles.kpiUnit}>{tile.unit}</Text>
      <Text style={[styles.kpiTrend, { color: trendColor }]}>{tile.trend}</Text>
      <Text style={styles.kpiLabel}>{tile.label}</Text>
    </View>
  );
}

export default function AnalyticsDashboard({ navigation }) {
  const [activeModule, setActiveModule] = useState('Audit');

  const { data: healthData,   isLoading: l1 } = useQuery({ queryKey: ['brand-health'],    queryFn: () => client.get('/analytics/brand-health').then(r => r.data) });
  const { data: kpiData,      isLoading: l2 } = useQuery({ queryKey: ['kpi-tiles'],        queryFn: () => client.get('/analytics/kpi-tiles').then(r => r.data) });
  const { data: rankingsData, isLoading: l3 } = useQuery({ queryKey: ['store-rankings'],   queryFn: () => client.get('/analytics/store-rankings').then(r => r.data) });
  const { data: trendData }                   = useQuery({ queryKey: ['trend-audit'],       queryFn: () => client.get('/analytics/trend?module=audit&period=7d').then(r => r.data) });
  const { data: alertsData }                  = useQuery({ queryKey: ['analytics-alerts'],  queryFn: () => client.get('/analytics/alerts').then(r => r.data) });

  const isLoading = l1 || l2 || l3;
  const brandHealthScore  = healthData?.score ?? 0;
  const componentScores   = healthData?.component_scores || [];
  const kpiTiles          = kpiData?.tiles || [];
  const storeRankings     = rankingsData?.stores || [];
  const sparklineValues   = (trendData?.points || []).map(p => p.value);
  const alerts            = (alertsData?.data || []).slice(0, 3);

  const ringColor = scoreColor(brandHealthScore);
  const sparkValues = sparklineValues.length ? sparklineValues : [0, 0, 0, 0, 0, 0, 0];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          subtitle="Brand Health Dashboard"
          rightSlot={
            <TouchableOpacity onPress={() => navigation.navigate('KpiTargets')} style={styles.targetsBtn}>
              <Text style={styles.targetsBtnText}>🎯 Targets</Text>
            </TouchableOpacity>
          }
        />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader
        subtitle="Brand Health Dashboard"
        rightSlot={
          <TouchableOpacity onPress={() => navigation.navigate('KpiTargets')} style={styles.targetsBtn}>
            <Text style={styles.targetsBtnText}>🎯 Targets</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Brand Health Score Hero */}
        <View style={[styles.heroCard, shadow.md]}>
          <View style={[styles.scoreRing, { borderColor: ringColor }]}>
            <Text style={[styles.scoreNumber, { color: ringColor }]}>{brandHealthScore}</Text>
          </View>
          <Text style={styles.heroCardTitle}>Brand Health Score</Text>
          <Text style={styles.heroTrend}>
            {healthData?.trend ? `↑ ${healthData.trend}` : '↑ vs last month'}
          </Text>

          <View style={styles.compBars}>
            {componentScores.map((c) => {
              const color = c.color || componentColor(c.score);
              return (
                <ComponentBar
                  key={c.module}
                  label={c.module}
                  value={c.score}
                  color={color}
                />
              );
            })}
          </View>
        </View>

        {/* KPI Tiles Grid */}
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.kpiGrid}>
          {kpiTiles.map((tile) => (
            <KpiTile key={tile.key} tile={tile} />
          ))}
        </View>

        {/* Store Rankings */}
        <View style={[styles.card, shadow.sm]}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Store Performance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StoreDrilldown')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          {storeRankings.map((s) => {
            const barColor = scoreColor(s.score);
            return (
              <View key={s.store_id || s.rank} style={styles.rankRow}>
                <Text style={styles.rankNum}>#{s.rank}</Text>
                <Text style={styles.rankName}>{s.name}</Text>
                <View style={styles.rankTrack}>
                  <View style={[styles.rankFill, { width: `${s.score}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.rankScore, { color: barColor }]}>{s.score}%</Text>
              </View>
            );
          })}
        </View>

        {/* Score Trend Sparkline */}
        <View style={[styles.card, shadow.sm]}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Score Trend</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TrendChart')}>
              <Text style={styles.viewAllLink}>Full Chart →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.moduleChips}>
            {MODULES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.moduleChip, activeModule === m && styles.moduleChipActive]}
                onPress={() => setActiveModule(m)}
              >
                <Text style={[styles.moduleChipText, activeModule === m && styles.moduleChipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sparkContainer}>
            {sparkValues.map((v, i) => {
              const maxV = Math.max(...sparkValues) || 1;
              const h = (v / maxV) * 80;
              return (
                <View key={i} style={styles.sparkBarWrap}>
                  <Text style={styles.sparkValue}>{v}</Text>
                  <View style={[styles.sparkBar, { height: Math.max(h, 2) }]} />
                  <Text style={styles.sparkLabel}>{SPARKLINE_LABELS[i] || i + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Anomaly Alerts */}
        <View style={styles.alertsHeaderRow}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <View style={styles.alertCountBadge}>
              <Text style={styles.alertCountText}>{alerts.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
        {alerts.map((a) => {
          const borderColor = severityBorderColor(a.severity);
          return (
            <View key={a.id} style={[styles.alertCard, shadow.sm, { borderLeftColor: borderColor }]}>
              <Text style={styles.alertDot}>{severityDot(a.severity)}</Text>
              <View style={styles.alertBody}>
                <Text style={styles.alertMsg}>{a.message}</Text>
                <Text style={styles.alertMeta}>{a.store_name} · {formatAlertTime(a.created_at)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.alertViewBtn, { borderColor }]}
                onPress={() => navigation.navigate('StoreDrilldown')}
              >
                <Text style={[styles.alertViewText, { color: borderColor }]}>View →</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Full Report CTA */}
        <TouchableOpacity
          style={[styles.reportBtn, shadow.green]}
          onPress={() => navigation.navigate('StoreDrilldown')}
          activeOpacity={0.88}
        >
          <Text style={styles.reportBtnText}>📊  View Full Report</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  targetsBtn:       { backgroundColor: colors.primaryBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  targetsBtnText:   { fontSize: 12, color: colors.primary, fontWeight: '700' },
  scroll:           { flex: 1 },
  content:          { padding: 16, gap: 14 },

  // Hero card
  heroCard:         { backgroundColor: colors.white, borderRadius: radius.xl, padding: 20, alignItems: 'center' },
  scoreRing:        { width: 130, height: 130, borderRadius: 65, borderWidth: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  scoreNumber:      { fontSize: 48, fontWeight: '900' },
  heroCardTitle:    { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  heroTrend:        { fontSize: typography.sm, color: colors.success, fontWeight: '700', marginBottom: 18 },
  compBars:         { width: '100%', gap: 8 },
  compRow:          { flexDirection: 'row', alignItems: 'center' },
  compLabel:        { width: 76, fontSize: typography.xs, color: colors.dark, fontWeight: '600' },
  compTrack:        { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginHorizontal: 8 },
  compFill:         { height: 8, borderRadius: radius.full },
  compPct:          { width: 38, fontSize: typography.xs, fontWeight: '800', textAlign: 'right' },

  // KPI Grid
  sectionTitle:     { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  kpiGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiTile:          { width: '47%', backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 0, overflow: 'hidden' },
  kpiTopBar:        { height: 4, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, marginBottom: 10 },
  kpiIcon:          { fontSize: 20, marginBottom: 4 },
  kpiValue:         { fontSize: typography.xl, fontWeight: '900', color: colors.dark },
  kpiUnit:          { fontSize: 10, color: colors.midGrey, marginTop: 1 },
  kpiTrend:         { fontSize: typography.xs, fontWeight: '700', marginTop: 4 },
  kpiLabel:         { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },

  // Card base
  card:             { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitleRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:        { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  viewAllLink:      { fontSize: typography.xs, fontWeight: '700', color: colors.primary },

  // Rankings
  rankRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankNum:          { width: 28, fontSize: typography.sm, fontWeight: '700', color: colors.midGrey },
  rankName:         { width: 110, fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  rankTrack:        { flex: 1, height: 7, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginHorizontal: 8 },
  rankFill:         { height: 7, borderRadius: radius.full },
  rankScore:        { width: 38, fontSize: typography.sm, fontWeight: '800', textAlign: 'right' },

  // Sparkline
  moduleChips:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  moduleChip:       { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.background, borderRadius: radius.full },
  moduleChipActive: { backgroundColor: colors.primary },
  moduleChipText:   { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  moduleChipTextActive: { color: colors.white },
  sparkContainer:   { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 },
  sparkBarWrap:     { flex: 1, alignItems: 'center', gap: 4 },
  sparkValue:       { fontSize: 9, color: colors.midGrey, fontWeight: '600' },
  sparkBar:         { width: 22, backgroundColor: colors.success, borderRadius: 3 },
  sparkLabel:       { fontSize: 9, color: colors.lightGrey, marginTop: 4 },

  // Alerts
  alertsHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertCountBadge:  { backgroundColor: colors.error, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  alertCountText:   { color: colors.white, fontSize: typography.xs, fontWeight: '800' },
  alertCard:        { backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderLeftWidth: 4 },
  alertDot:         { fontSize: 16 },
  alertBody:        { flex: 1 },
  alertMsg:         { fontSize: typography.sm, fontWeight: '600', color: colors.dark, lineHeight: 18 },
  alertMeta:        { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  alertViewBtn:     { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 5 },
  alertViewText:    { fontSize: typography.xs, fontWeight: '700' },

  // CTA
  reportBtn:        { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  reportBtnText:    { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
