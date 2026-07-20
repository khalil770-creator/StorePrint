import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';

const MODULES = ['audit', 'vm', 'cx', 'training'];
const MODULE_LABELS = { audit: 'Audit', vm: 'VM', cx: 'CX', training: 'Training' };
const PERIODS = ['7d', '30d', '90d', '180d'];
const PERIOD_LABELS = { '7d': '7D', '30d': '30D', '90d': '90D', '180d': '180D' };

const Y_GUIDES = [0, 25, 50, 75, 100];
const CHART_HEIGHT = 160;

function barColor(v) {
  if (v >= 80) return colors.success;
  if (v >= 60) return colors.warning;
  return colors.error;
}

export default function TrendChartScreen({ navigation }) {
  const [selectedModule, setSelectedModule] = useState('audit');
  const [selectedPeriod, setSelectedPeriod]  = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['trend', selectedModule, selectedPeriod],
    queryFn: () => client.get(`/analytics/trend?module=${selectedModule}&period=${selectedPeriod}`).then(r => r.data),
  });

  const points = data?.points || [];
  const values = points.map(p => p.value);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const avgVal = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const trendVal = values.length >= 2 ? values[values.length - 1] - values[0] : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Trend Chart" subtitle="Score over time" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Module Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
          {MODULES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, selectedModule === m && styles.chipActive]}
              onPress={() => setSelectedModule(m)}
            >
              <Text style={[styles.chipText, selectedModule === m && styles.chipTextActive]}>{MODULE_LABELS[m]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period Tabs */}
        <View style={[styles.periodTabs, shadow.sm]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, selectedPeriod === p && styles.periodTabActive]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text style={[styles.periodTabText, selectedPeriod === p && styles.periodTabTextActive]}>{PERIOD_LABELS[p]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={[styles.chartCard, shadow.sm]}>
          <Text style={styles.cardTitle}>{MODULE_LABELS[selectedModule]} Score — {PERIOD_LABELS[selectedPeriod]}</Text>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.chartArea}>
              <View style={styles.yAxis}>
                {[...Y_GUIDES].reverse().map((g) => (
                  <View key={g} style={[styles.yGuide, { top: ((100 - g) / 100) * CHART_HEIGHT }]}>
                    <Text style={styles.yLabel}>{g}</Text>
                    <View style={styles.yLine} />
                  </View>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barsScroll}>
                <View style={[styles.barsContainer, { height: CHART_HEIGHT + 28 }]}>
                  {points.map((d, i) => {
                    const barH = (d.value / 100) * CHART_HEIGHT;
                    const label = d.label || (d.date ? d.date.slice(-5) : String(i + 1));
                    return (
                      <View key={i} style={styles.barWrap}>
                        <View style={styles.barValueWrap}>
                          <Text style={styles.barValueText}>{d.value}</Text>
                          <View style={[styles.bar, { height: Math.max(barH, 2), backgroundColor: barColor(d.value) }]} />
                        </View>
                        <Text style={styles.barLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Summary Stats */}
        {!isLoading && points.length > 0 && (
          <View style={[styles.statsCard, shadow.sm]}>
            <Text style={styles.cardTitle}>Summary</Text>
            <View style={styles.statsRow}>
              {[
                { label: 'Min',   value: minVal, color: colors.error },
                { label: 'Max',   value: maxVal, color: colors.success },
                { label: 'Avg',   value: avgVal, color: colors.info },
                { label: 'Trend', value: (trendVal >= 0 ? '+' : '') + trendVal, color: trendVal >= 0 ? colors.success : colors.error },
              ].map((s) => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  scroll:           { flex: 1 },
  content:          { padding: 16, gap: 14 },
  chipScroll:       { flexGrow: 0 },
  chipRow:          { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  chip:             { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.white, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipActive:       { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:         { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  chipTextActive:   { color: colors.white },

  periodTabs:       { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  periodTab:        { flex: 1, paddingVertical: 10, alignItems: 'center' },
  periodTabActive:  { backgroundColor: colors.primary },
  periodTabText:    { fontSize: typography.sm, fontWeight: '700', color: colors.midGrey },
  periodTabTextActive: { color: colors.white },

  chartCard:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:        { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  chartArea:        { flexDirection: 'row' },
  yAxis:            { width: 30, position: 'relative', height: CHART_HEIGHT + 28 },
  yGuide:           { position: 'absolute', flexDirection: 'row', alignItems: 'center', left: 0, right: 0 },
  yLabel:           { fontSize: 9, color: colors.lightGrey, width: 24, textAlign: 'right' },
  yLine:            { flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 3 },
  barsScroll:       { flex: 1 },
  barsContainer:    { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 4 },
  barWrap:          { alignItems: 'center', width: 28 },
  barValueWrap:     { alignItems: 'center', height: CHART_HEIGHT, justifyContent: 'flex-end' },
  barValueText:     { fontSize: 8, color: colors.midGrey, marginBottom: 2 },
  bar:              { width: 18, borderRadius: 3 },
  barLabel:         { fontSize: 8, color: colors.lightGrey, marginTop: 4, textAlign: 'center' },

  statsCard:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  statsRow:         { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  statItem:         { alignItems: 'center' },
  statValue:        { fontSize: typography.xl, fontWeight: '900' },
  statLabel:        { fontSize: typography.xs, color: colors.midGrey, marginTop: 4 },
});
