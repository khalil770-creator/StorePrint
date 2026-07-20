import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import AppHeader from '../../components/common/AppHeader';
import { colors, typography, radius, shadow, fonts } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';

// ─── Bento Stat Card ─────────────────────────────────────────────────────────
function BentoStat({ icon, iconColor, badgeBg, badgeText, badgeTextColor, label, value, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.bentoCard, shadow.sm]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.bentoTop}>
        <Text style={[styles.bentoIcon, { color: iconColor }]}>{icon}</Text>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badgeText}</Text>
        </View>
      </View>
      <View>
        <Text style={styles.bentoLabel}>{label}</Text>
        <Text style={styles.bentoValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ icon, label, bg, iconColor, textColor, onPress }) {
  return (
    <TouchableOpacity style={[styles.quickBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.quickIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={[styles.quickLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Setup Row ────────────────────────────────────────────────────────────────
function SetupRow({ icon, label, desc, borderColor, onPress }) {
  return (
    <TouchableOpacity style={[styles.setupRow, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.setupIcon}>{icon}</Text>
      <View style={styles.setupText}>
        <Text style={styles.setupLabel}>{label}</Text>
        <Text style={styles.setupDesc}>{desc}</Text>
      </View>
      <Text style={styles.setupChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ time, text, dotColor, isLast }) {
  return (
    <View style={styles.tlItem}>
      {/* vertical line drawn by parent; dot drawn here */}
      <View style={[styles.tlDot, { backgroundColor: dotColor }]} />
      <View style={styles.tlContent}>
        <Text style={styles.tlTime}>{time}</Text>
        <Text style={styles.tlText}>{text}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminDashboard({ navigation }) {
  const { user } = useAuthStore();

  const { data: usersData }  = useQuery({ queryKey: ['users'],  queryFn: () => client.get('/users').then(r => r.data) });
  const { data: storesData } = useQuery({ queryKey: ['stores'], queryFn: () => client.get('/stores').then(r => r.data) });
  const { data: rolesData }  = useQuery({ queryKey: ['roles'],  queryFn: () => client.get('/roles').then(r => r.data) });

  const userCount  = String(usersData?.total  ?? usersData?.data?.length  ?? 0);
  const storeCount = String(storesData?.total ?? storesData?.data?.length ?? 0);
  const roleCount  = String(rolesData?.length ?? rolesData?.data?.length  ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader subtitle="Platform overview & management" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Stat Bento Grid ── */}
        <View style={styles.bentoGrid}>
          <BentoStat
            icon="👥"
            iconColor={colors.primary}
            badgeBg={colors.primaryBg}
            badgeText="+12%"
            badgeTextColor={colors.primaryDark}
            label="Total Users"
            value={userCount}
            onPress={() => navigation.navigate('UsersList')}
          />
          <BentoStat
            icon="🏪"
            iconColor={colors.secondary}
            badgeBg={colors.secondaryBg}
            badgeText={storeCount}
            badgeTextColor={colors.secondary}
            label="Active Stores"
            value={storeCount}
            onPress={() => navigation.navigate('StoresList')}
          />
          <BentoStat
            icon="✅"
            iconColor="#a33500"
            badgeBg="#ffdbcf"
            badgeText="89%"
            badgeTextColor="#7b2600"
            label="Avg. Audit Score"
            value="92.4"
          />
          <BentoStat
            icon="🛡️"
            iconColor={colors.lightGrey}
            badgeBg={colors.surfaceMid}
            badgeText="System"
            badgeTextColor={colors.midGrey}
            label="Permission Roles"
            value={roleCount}
            onPress={() => navigation.navigate('Roles')}
          />
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="👤"
            label="Add User"
            bg={colors.secondaryContainer}
            iconColor={colors.onSecondaryContainer}
            textColor={colors.onSecondaryContainer}
            onPress={() => navigation.navigate('UsersList')}
          />
          <QuickAction
            icon="🔑"
            label="Edit Roles"
            bg={colors.primary}
            iconColor={colors.white}
            textColor={colors.white}
            onPress={() => navigation.navigate('Roles')}
          />
          <QuickAction
            icon="🏪"
            label="New Store"
            bg={colors.surfaceHigh}
            iconColor={colors.midGrey}
            textColor={colors.midGrey}
            onPress={() => navigation.navigate('StoresList')}
          />
          <QuickAction
            icon="📊"
            label="Reports"
            bg={colors.surfaceHigh}
            iconColor={colors.midGrey}
            textColor={colors.midGrey}
          />
        </View>

        {/* ── Setup & Configuration ── */}
        <Text style={styles.sectionTitle}>Setup & Configuration</Text>
        <SetupRow
          icon="📋"
          label="Audit Templates"
          desc="Custom scoring & logic"
          borderColor={colors.primary}
          onPress={() => navigation.navigate('AuditTemplates')}
        />
        <SetupRow
          icon="🌿"
          label="Env. Checklists"
          desc="Compliance & green tasks"
          borderColor={colors.secondary}
          onPress={() => navigation.navigate('EnvChecklists')}
        />
        <SetupRow
          icon="⭐"
          label="CX Surveys"
          desc="Customer feedback loops"
          borderColor="#a33500"
          onPress={() => navigation.navigate('SurveysAdmin')}
        />
        <SetupRow
          icon="🎓"
          label="Training"
          desc="Staff onboarding modules"
          borderColor={colors.lightGrey}
          onPress={() => navigation.navigate('CoursesAdmin')}
        />

        {/* ── Recent Activity (timeline) ── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.timeline}>
          <View style={styles.tlLine} />
          <TimelineItem dotColor={colors.primary}    time="10:42 AM" text={<Text style={styles.tlText}><Text style={styles.tlBold}>System</Text> updated Global Audit V2</Text>} />
          <TimelineItem dotColor={colors.secondary}  time="09:15 AM" text={<Text style={styles.tlText}><Text style={styles.tlBold}>Admin Sarah</Text> added 12 new stores</Text>} />
          <TimelineItem dotColor="#a33500"            time="08:02 AM" text={<Text style={styles.tlText}><Text style={styles.tlBold}>Automated Sync</Text> completed for 156 nodes</Text>} isLast />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: -6, marginTop: 16, marginBottom: 8,
  },
  bentoCard: {
    width: '46%', margin: '2%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, height: 110,
    justifyContent: 'space-between',
  },
  bentoTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bentoIcon: { fontSize: 22 },
  badge:     { borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', fontFamily: fonts.label },
  bentoLabel: { fontSize: 11, color: colors.midGrey, fontFamily: fonts.label, marginBottom: 2 },
  bentoValue: { fontSize: 20, fontWeight: '700', color: colors.dark, fontFamily: fonts.headlineMd },

  // Section title
  sectionTitle: {
    fontSize: typography.xl, fontWeight: '700',
    color: colors.dark, fontFamily: fonts.headlineMd,
    marginTop: 24, marginBottom: 12,
  },

  // Quick Actions
  quickGrid:  { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  quickBtn: {
    width: '46%', margin: '2%',
    borderRadius: radius.md,
    paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  quickIcon:  { fontSize: 22 },
  quickLabel: { fontSize: 12, fontWeight: '600', fontFamily: fonts.label },

  // Setup rows
  setupRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
    paddingVertical: 14, paddingHorizontal: 14,
    marginBottom: 8,
  },
  setupIcon:    { fontSize: 20, marginRight: 14 },
  setupText:    { flex: 1 },
  setupLabel:   { fontSize: 13, fontWeight: '600', color: colors.dark, fontFamily: fonts.label, marginBottom: 2 },
  setupDesc:    { fontSize: 11, color: colors.midGrey, fontFamily: fonts.body },
  setupChevron: { fontSize: 20, color: colors.border, marginLeft: 8 },

  // Timeline
  timeline: { position: 'relative', paddingLeft: 24, marginLeft: 8 },
  tlLine: {
    position: 'absolute', left: 7, top: 8, bottom: 8,
    width: 2, backgroundColor: colors.surfaceHigh,
  },
  tlItem:    { flexDirection: 'row', marginBottom: 20 },
  tlDot: {
    position: 'absolute', left: -20, top: 4,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 3, borderColor: colors.background,
  },
  tlContent: { flex: 1 },
  tlTime:    { fontSize: 10, color: colors.midGrey, fontFamily: fonts.mono, marginBottom: 2 },
  tlText:    { fontSize: 13, color: colors.dark, fontFamily: fonts.body },
  tlBold:    { fontWeight: '700', fontFamily: fonts.label },
});
