import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, radius, shadow } from '../../constants/theme';
import StatCard  from '../../components/common/StatCard';
import AppHeader from '../../components/common/AppHeader';
import { usePermissions } from '../../utils/permissions';

// key must match the module key in permissions.js / roles.permissions
const SECTIONS = [
  {
    key: 'campaigns',
    title: 'Campaigns',
    icon: '📣',
    description: 'Manage brand campaigns and store confirmations',
    stats: [
      { label: 'Active', value: '4' },
      { label: 'Upcoming', value: '2' },
      { label: 'Stores Confirmed', value: '61%' },
    ],
    color: '#0052CC',
    screen: 'CampaignFeed',
  },
  {
    key: 'vm',
    title: 'Visual Merchandising',
    icon: '🖼️',
    description: 'Track VM tasks and planogram compliance',
    stats: [
      { label: 'Pending', value: '12' },
      { label: 'Overdue', value: '3' },
      { label: 'Avg Score', value: '84%' },
    ],
    color: '#4A90E2',
    screen: 'VMDashboard',
  },
  {
    key: 'signage',
    title: 'Signage',
    icon: '🪧',
    description: 'Browse templates, request prints and log installations',
    stats: [
      { label: 'Templates', value: '28' },
      { label: 'Print Requests', value: '7' },
      { label: 'Installed Today', value: '5' },
    ],
    color: '#F5A623',
    screen: 'SignageLibrary',
  },
  {
    key: 'training',
    title: 'Training',
    icon: '🎓',
    description: 'Courses, certifications and staff development',
    stats: [
      { label: 'Enrolled', value: '3' },
      { label: 'Completed', value: '1' },
      { label: 'Certs Earned', value: '2' },
    ],
    color: '#9B59B6',
    screen: 'TrainingDashboard',
  },
  {
    key: 'environment',
    title: 'Store Environment',
    icon: '🌿',
    description: 'Lighting, scent, cleanliness and atmosphere checks',
    stats: [
      { label: 'Health Score', value: '84' },
      { label: 'Open Issues', value: '15' },
      { label: 'Checks Today', value: '3' },
    ],
    color: '#1ABC9C',
    screen: 'EnvironmentDashboard',
  },
  {
    key: 'cx',
    title: 'Customer Experience',
    icon: '⭐',
    description: 'NPS, CSAT, reviews and customer feedback',
    stats: [
      { label: 'NPS', value: '52' },
      { label: 'CSAT', value: '4.2' },
      { label: 'Reviews', value: '24' },
    ],
    color: '#E67E22',
    screen: 'CXDashboard',
  },
];

export default function StoreOpsDashboard({ navigation }) {
  const { hasAccess, isAdmin } = usePermissions();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader subtitle="Store operations & modules" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <StatCard label="Active Campaigns" value="4" icon="📣" />
          <StatCard label="VM Tasks Pending" value="12" icon="🖼️" />
          <StatCard label="Open Print Reqs"  value="7"  icon="🖨️" />
        </View>

        <Text style={styles.sectionTitle}>Sections</Text>

        {SECTIONS.map((section) => {
          const allowed = isAdmin || hasAccess(section.key);
          return (
            <View
              key={section.key}
              style={[styles.card, shadow.md, !allowed && styles.cardLocked]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBubble, { backgroundColor: allowed ? section.color + '1A' : '#F3F4F6' }]}>
                  <Text style={[styles.iconText, !allowed && styles.iconLocked]}>
                    {allowed ? section.icon : '🔒'}
                  </Text>
                </View>
                <View style={styles.cardTitleWrap}>
                  <Text style={[styles.cardTitle, !allowed && styles.textLocked]}>{section.title}</Text>
                  <Text style={styles.cardDesc}>
                    {allowed ? section.description : 'Access restricted — contact your administrator'}
                  </Text>
                </View>
                {!allowed && (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>LOCKED</Text>
                  </View>
                )}
              </View>

              {allowed && (
                <View style={styles.statsRow}>
                  {section.stats.map((s) => (
                    <View key={s.label} style={styles.statItem}>
                      <Text style={[styles.statValue, { color: section.color }]}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.goBtn,
                  { backgroundColor: allowed ? section.color : colors.lightGrey },
                ]}
                onPress={() => {
                  if (!allowed) {
                    alert(`Access Restricted\n\nYou don't have permission to access ${section.title}.`);
                    return;
                  }
                  navigation.navigate(section.screen);
                }}
                activeOpacity={allowed ? 0.85 : 1}
              >
                <Text style={styles.goBtnText}>
                  {allowed ? `Open ${section.title} →` : `🔒  ${section.title} — No Access`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.background },
  scroll:        { flex: 1 },
  content:       { padding: 16, paddingTop: 20 },
  summaryRow:    { flexDirection: 'row', gap: 10, marginBottom: 24 },
  sectionTitle:  { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 12 },

  card:          { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginBottom: 16 },
  cardLocked:    { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: colors.border },

  cardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBubble:    { width: 48, height: 48, borderRadius: radius.md,
                   alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText:      { fontSize: 22 },
  iconLocked:    { opacity: 0.4 },
  cardTitleWrap: { flex: 1 },
  cardTitle:     { fontSize: typography.lg, fontWeight: '700', color: colors.dark },
  textLocked:    { color: colors.lightGrey },
  cardDesc:      { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },

  lockedBadge:     { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  lockedBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },

  statsRow:      { flexDirection: 'row', justifyContent: 'space-around',
                   borderTopWidth: 1, borderTopColor: colors.border,
                   paddingTop: 12, marginBottom: 14 },
  statItem:      { alignItems: 'center' },
  statValue:     { fontSize: typography.xl, fontWeight: '800' },
  statLabel:     { fontSize: typography.xs, color: colors.midGrey, marginTop: 2 },

  goBtn:         { borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  goBtnText:     { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
});
