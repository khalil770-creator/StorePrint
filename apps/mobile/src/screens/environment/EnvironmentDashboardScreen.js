import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

function ScoreBar({ name, score, color }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreName}>{name}</Text>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
    </View>
  );
}

export default function EnvironmentDashboardScreen({ navigation }) {
  const { data: checklists, isLoading } = useQuery({
    queryKey: ['env-checklists'],
    queryFn: () => client.get('/environment/checklists?active=true').then(r => r.data),
  });
  const { data: issues } = useQuery({
    queryKey: ['env-issues'],
    queryFn: () => client.get('/environment/issues').then(r => r.data),
  });
  const { data: submissions } = useQuery({
    queryKey: ['env-submissions'],
    queryFn: () => client.get('/environment/submissions').then(r => r.data),
  });

  const issueList = issues?.data || [];
  const submissionList = (Array.isArray(submissions) ? submissions : (submissions?.data || [])).slice(0, 5);
  const critical = issueList.filter((i) => i.severity === 'critical').length;
  const high = issueList.filter((i) => i.severity === 'high').length;
  const medium = issueList.filter((i) => i.severity === 'medium').length;

  // Use submissions from checklists data if available, or empty
  const checklistList = Array.isArray(checklists) ? checklists : (checklists?.data || []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Store Environment" subtitle="Atmosphere & compliance" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Store Environment" subtitle="Atmosphere & compliance" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={[styles.heroCard, shadow.md]}>
          <Text style={styles.heroLabel}>OPEN ISSUES</Text>
          <View style={[styles.gauge, { borderColor: critical > 0 ? colors.error : colors.success }]}>
            <Text style={[styles.gaugeScore, { color: critical > 0 ? colors.error : colors.success }]}>{critical + high + medium}</Text>
            <Text style={styles.gaugeMax}>total</Text>
          </View>
          <Text style={[styles.heroStatus, { color: critical > 0 ? colors.error : colors.success }]}>
            {critical > 0 ? 'Critical Issues Present' : 'No Critical Issues'}
          </Text>
        </View>

        {false && (
          <View style={[styles.categoryCard, shadow.sm]}>
            <Text style={styles.sectionTitle}>Category Scores</Text>
          </View>
        )}

        <View style={[styles.issuesCard, shadow.sm]}>
          <View style={styles.issuesHeader}>
            <Text style={styles.sectionTitle}>Open Issues</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EnvironmentIssues')}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.issueChips}>
            <View style={[styles.issuePill, { backgroundColor: '#FFF0F0' }]}>
              <Text style={[styles.issueCount, { color: colors.error }]}>{critical}</Text>
              <Text style={[styles.issueLbl, { color: colors.error }]}>Critical</Text>
            </View>
            <View style={[styles.issuePill, { backgroundColor: '#FFF8E1' }]}>
              <Text style={[styles.issueCount, { color: '#E65100' }]}>{high}</Text>
              <Text style={[styles.issueLbl, { color: '#E65100' }]}>High</Text>
            </View>
            <View style={[styles.issuePill, { backgroundColor: '#FFFDE7' }]}>
              <Text style={[styles.issueCount, { color: colors.warning }]}>{medium}</Text>
              <Text style={[styles.issueLbl, { color: colors.warning }]}>Medium</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Checklists</Text>
        {checklistList.length === 0 && (
          <Text style={{ fontSize: 13, color: colors.lightGrey, textAlign: 'center', paddingVertical: 16 }}>
            No active checklists available.
          </Text>
        )}
        {checklistList.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.subCard, shadow.sm]}
            onPress={() => navigation.navigate('EnvironmentChecklist', { checklist: item })}
            activeOpacity={0.85}
          >
            <View style={styles.subLeft}>
              <Text style={styles.subStore}>{item.title || item.name}</Text>
              <Text style={styles.subChecklist}>{item.frequency}</Text>
              <Text style={styles.subDate}>{item.item_count} items</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>▶ Start</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Recent Submissions</Text>
        {submissionList.length === 0 && (
          <Text style={{ fontSize: 13, color: colors.lightGrey, textAlign: 'center', paddingVertical: 12 }}>
            No submissions yet.
          </Text>
        )}
        {submissionList.map((sub) => {
          const score = sub.score ?? 0;
          const scoreColor = score >= 80 ? colors.success : score >= 50 ? colors.warning : colors.error;
          const scoreBg = score >= 80 ? colors.successBg : score >= 50 ? colors.warningBg : colors.errorBg;
          return (
            <View key={sub.id} style={[styles.subCard, shadow.sm]}>
              <View style={styles.subLeft}>
                <Text style={styles.subStore}>{sub.checklist_title}</Text>
                <Text style={styles.subChecklist}>{sub.store_name}</Text>
                <Text style={styles.subDate}>
                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.subScore, { backgroundColor: scoreBg }]}>
                  <Text style={[styles.subScoreText, { color: scoreColor }]}>{score}%</Text>
                </View>
                <Text style={{ fontSize: 10, color: scoreColor, fontWeight: '700', textTransform: 'uppercase' }}>
                  {sub.overall_status}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.background },
  scroll:         { flex: 1 },
  content:        { padding: 16, paddingTop: 16, gap: 16 },
  heroCard:       { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, alignItems: 'center' },
  heroLabel:      { fontSize: typography.xs, color: colors.lightGrey, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  gauge:          { width: 110, height: 110, borderRadius: 55, borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  gaugeScore:     { fontSize: typography.xxxl, fontWeight: '900' },
  gaugeMax:       { fontSize: typography.xs, color: colors.lightGrey },
  heroStatus:     { fontSize: typography.sm, fontWeight: '700' },
  categoryCard:   { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  sectionTitle:   { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  scoreRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  scoreName:      { width: 90, fontSize: typography.sm, color: colors.dark, fontWeight: '600' },
  scoreTrack:     { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginHorizontal: 8 },
  scoreFill:      { height: 8, borderRadius: radius.full },
  scoreValue:     { width: 30, fontSize: typography.sm, fontWeight: '800', textAlign: 'right' },
  issuesCard:     { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  issuesHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewAll:        { fontSize: typography.xs, color: colors.primary, fontWeight: '700' },
  issueChips:     { flexDirection: 'row', gap: 10 },
  issuePill:      { flex: 1, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  issueCount:     { fontSize: typography.xxl, fontWeight: '900' },
  issueLbl:       { fontSize: typography.xs, fontWeight: '700', marginTop: 2 },
  subCard:        { backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', padding: 14 },
  subLeft:        { flex: 1 },
  subStore:       { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  subChecklist:   { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },
  subDate:        { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  subScore:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.md },
  subScoreText:   { fontSize: typography.sm, fontWeight: '800' },
  startBtn:       { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  startBtnText:   { color: colors.white, fontSize: typography.md, fontWeight: '800' },
});
