import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

function NavTile({ icon, label, screen, navigation }) {
  return (
    <TouchableOpacity style={[styles.navTile, shadow.sm]} onPress={() => navigation.navigate(screen)} activeOpacity={0.85}>
      <Text style={styles.navTileIcon}>{icon}</Text>
      <Text style={styles.navTileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CXDashboardScreen({ navigation }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cx-dashboard'],
    queryFn: () => client.get('/cx/dashboard').then(r => r.data),
  });

  const nps = data?.overview?.avg_nps ?? 0;
  const csat = data?.overview?.avg_csat ?? 0;
  const totalResponses = data?.overview?.total_responses ?? 0;
  const recentReviews = data?.recent_reviews || [];
  const npsColor = nps >= 50 ? colors.success : nps >= 0 ? colors.warning : colors.error;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Customer Experience" subtitle="NPS · CSAT · Reviews" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Customer Experience" subtitle="NPS · CSAT · Reviews" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.heroRow}>
          <View style={[styles.npsCard, shadow.md]}>
            <Text style={styles.heroLabel}>NET PROMOTER SCORE</Text>
            <Text style={[styles.npsScore, { color: npsColor }]}>{nps}</Text>
            <Text style={[styles.npsStatus, { color: npsColor }]}>{nps >= 50 ? 'Excellent' : nps >= 0 ? 'Needs Work' : 'Critical'}</Text>
          </View>
          <View style={[styles.csatCard, shadow.md]}>
            <Text style={styles.heroLabel}>CSAT</Text>
            <Text style={styles.csatScore}>{csat}</Text>
            <Text style={styles.csatStars}>{'★'.repeat(Math.round(csat))}{'☆'.repeat(5 - Math.round(csat))}</Text>
          </View>
        </View>

        <View style={[styles.sentimentCard, shadow.sm]}>
          <Text style={styles.cardTitle}>Total Responses</Text>
          <Text style={{ fontSize: 32, fontWeight: '900', color: colors.dark, textAlign: 'center' }}>{totalResponses}</Text>
        </View>

        {recentReviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {recentReviews.map((r, idx) => (
              <View key={r.id || idx} style={[styles.alertCard, shadow.sm]}>
                <Text style={styles.alertIcon}>⭐</Text>
                <View style={styles.alertBody}>
                  <Text style={styles.alertText}>{r.text || r.comment || r.snippet}</Text>
                  <Text style={styles.alertTime}>{r.date || r.created_at}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.navTiles}>
          <NavTile icon="📋" label="Surveys" screen="CXSurveys" navigation={navigation} />
          <NavTile icon="⭐" label="Reviews" screen="CXReviews" navigation={navigation} />
          <NavTile icon="💬" label="Responses" screen="CXSurveys" navigation={navigation} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.background },
  scroll:          { flex: 1 },
  content:         { padding: 16, paddingTop: 16, gap: 14 },
  heroRow:         { flexDirection: 'row', gap: 12 },
  npsCard:         { flex: 1.2, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, alignItems: 'center' },
  csatCard:        { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, alignItems: 'center' },
  heroLabel:       { fontSize: 9, color: colors.lightGrey, fontWeight: '700', letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  npsScore:        { fontSize: 44, fontWeight: '900' },
  npsStatus:       { fontSize: typography.xs, fontWeight: '700', marginTop: 4 },
  csatScore:       { fontSize: 36, fontWeight: '900', color: colors.warning },
  csatStars:       { fontSize: 14, color: colors.warning, marginTop: 4 },
  sentimentCard:   { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:       { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  sentRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sentLabel:       { width: 65, fontSize: typography.sm, color: colors.dark, fontWeight: '600' },
  sentTrack:       { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginHorizontal: 8 },
  sentFill:        { height: 8, borderRadius: radius.full },
  sentPct:         { width: 40, fontSize: typography.sm, fontWeight: '800', textAlign: 'right' },
  rankCard:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  rankGroup:       {},
  rankGroupLabel:  { fontSize: typography.xs, fontWeight: '700', color: colors.success, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  rankRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankNum:         { width: 28, fontSize: typography.sm, fontWeight: '700', color: colors.midGrey },
  rankName:        { flex: 1, fontSize: typography.sm, color: colors.dark, fontWeight: '600' },
  rankNps:         { fontSize: typography.md, fontWeight: '800' },
  sectionTitle:    { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  alertCard:       { backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  alertIcon:       { fontSize: 18, marginTop: 1 },
  alertBody:       { flex: 1 },
  alertText:       { fontSize: typography.sm, color: colors.dark, fontWeight: '600', lineHeight: 19 },
  alertTime:       { fontSize: typography.xs, color: colors.lightGrey, marginTop: 3 },
  navTiles:        { flexDirection: 'row', gap: 10 },
  navTile:         { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, alignItems: 'center', gap: 8 },
  navTileIcon:     { fontSize: 26 },
  navTileLabel:    { fontSize: typography.xs, fontWeight: '700', color: colors.dark },
});
