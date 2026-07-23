import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusChip from '../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const TABS = ['Overview', 'Assets', 'Stores', 'Confirmations'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function typeColor(t) {
  if (t === 'PDF') return '#D0021B';
  if (t === 'PSD') return '#4A90E2';
  if (t === 'ZIP') return '#F5A623';
  return colors.midGrey;
}

export default function CampaignDetailScreen({ route, navigation }) {
  const id = route.params?.campaign?.id;
  const { data: campaign = {}, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => client.get(`/campaigns/${id}`).then(r => r.data),
    enabled: !!id,
    refetchOnMount: true,
  });
  const { data: myStore } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => client.get('/field/my-store').then(r => r.data),
  });
  const [activeTab, setActiveTab] = useState('Overview');

  const alreadyConfirmed = myStore && (campaign.confirmations || []).some(
    (c) => c.store_id === myStore.id
  );

  if (isLoading && !route.params?.campaign) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Campaign" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={campaign.title || 'Campaign'} onBack={() => navigation.goBack()} />

      <View style={[styles.hero, { borderLeftColor: campaign.color || colors.primary }]}>
        <View style={styles.heroRow}>
          <StatusChip status={campaign.status} />
          <Text style={styles.heroDate}>
            {fmtDate(campaign.start_date)} – {fmtDate(campaign.end_date)}
          </Text>
        </View>
        <Text style={styles.heroDesc}>{campaign.description || ''}</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, activeTab === t && styles.tabItemActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Overview' && (
          <View style={styles.section}>
            <Detail label="Campaign Type" value={campaign.type || '—'} />
            <Detail label="Start Date" value={fmtDate(campaign.start_date)} />
            <Detail label="End Date" value={fmtDate(campaign.end_date)} />
            <Detail label="Stores Assigned" value={String(campaign.total_stores ?? campaign.store_count ?? 0)} />
            <Detail label="Confirmations" value={`${campaign.confirmed_count ?? 0} / ${campaign.total_stores ?? campaign.store_count ?? 0}`} />
            {!!campaign.brief_url && (
              <View style={[styles.noteBox, shadow.sm]}>
                <Text style={styles.noteTitle}>📋 Campaign Brief</Text>
                <Text style={styles.noteText}>{campaign.brief_url}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Assets' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Downloadable Assets</Text>
            {(campaign.assets || []).map((a) => (
              <View key={a.id} style={[styles.assetRow, shadow.sm]}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor(a.type) + '1A' }]}>
                  <Text style={[styles.typeText, { color: typeColor(a.type) }]}>{a.type}</Text>
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{a.name}</Text>
                  <Text style={styles.assetSize}>{a.size}</Text>
                </View>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Text style={styles.downloadIcon}>⬇️</Text>
                </TouchableOpacity>
              </View>
            ))}
            {(campaign.assets || []).length === 0 && (
              <Text style={styles.emptyText}>No assets available.</Text>
            )}
          </View>
        )}

        {activeTab === 'Stores' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Assigned Stores</Text>
            {(campaign.store_assignments || []).map((s) => {
              const confirmed = (campaign.confirmations || []).some((c) => c.store_id === s.store_id);
              return (
                <View key={s.store_id} style={[styles.storeRow, shadow.sm]}>
                  <View style={styles.storeIcon}>
                    <Text style={{ fontSize: 18 }}>🏬</Text>
                  </View>
                  <View style={styles.storeInfo}>
                    <Text style={styles.storeName}>{s.store_name}</Text>
                  </View>
                  <StatusChip status={confirmed ? 'success' : 'inactive'} label={confirmed ? 'Confirmed' : 'Pending'} />
                </View>
              );
            })}
            {(campaign.store_assignments || []).length === 0 && (
              <Text style={styles.emptyText}>No stores assigned.</Text>
            )}
          </View>
        )}

        {activeTab === 'Confirmations' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Execution Confirmations</Text>
            {(campaign.confirmations || []).map((c) => (
              <View key={c.id} style={[styles.confirmCard, shadow.sm]}>
                <View style={styles.confirmHeader}>
                  <Text style={styles.confirmStore}>{c.store_name || '—'}</Text>
                  <Text style={styles.confirmTime}>{c.confirmed_at ? new Date(c.confirmed_at).toLocaleString() : '—'}</Text>
                </View>
                <Text style={styles.confirmBy}>By: {c.confirmed_by_name || '—'}</Text>
                {c.gps_verified && (
                  <Text style={styles.gpsTag}>📍 GPS Verified</Text>
                )}
                {c.photo_url ? (
                  <View style={styles.photoRow}>
                    <Image source={{ uri: c.photo_url }} style={styles.photoImg} resizeMode="cover" />
                  </View>
                ) : null}
                {c.notes ? <Text style={styles.confirmNotes}>{c.notes}</Text> : null}
              </View>
            ))}
            {(campaign.confirmations || []).length === 0 && (
              <Text style={styles.emptyText}>No confirmations yet.</Text>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.ctaBar}>
        {alreadyConfirmed ? (
          <View style={styles.confirmedBanner}>
            <Text style={styles.confirmedBannerText}>✅ You have confirmed this campaign</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate('CampaignConfirm', { campaign })}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>✅ Confirm Execution</Text>
          </TouchableOpacity>
        )}
      </View>
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
  safe:           { flex: 1, backgroundColor: colors.background },
  hero:           { backgroundColor: colors.white, padding: 16, borderLeftWidth: 4, marginBottom: 0 },
  heroRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  heroDate:       { fontSize: typography.xs, color: colors.midGrey },
  heroDesc:       { fontSize: typography.sm, color: colors.darkGrey, lineHeight: 20 },
  tabBar:         { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabItem:        { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive:  { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabLabel:       { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  tabLabelActive: { color: colors.primary },
  scroll:         { flex: 1 },
  content:        { padding: 16 },
  section:        { gap: 10 },
  sectionLabel:   { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 4 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel:    { fontSize: typography.sm, color: colors.midGrey },
  detailValue:    { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  noteBox:        { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginTop: 4 },
  noteTitle:      { fontSize: typography.sm, fontWeight: '700', color: colors.dark, marginBottom: 6 },
  noteText:       { fontSize: typography.sm, color: colors.darkGrey, lineHeight: 20 },
  assetRow:       { backgroundColor: colors.white, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center' },
  typeBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, marginRight: 12 },
  typeText:       { fontSize: typography.xs, fontWeight: '700' },
  assetInfo:      { flex: 1 },
  assetName:      { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  assetSize:      { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  downloadBtn:    { padding: 6 },
  downloadIcon:   { fontSize: 20 },
  storeRow:       { backgroundColor: colors.white, borderRadius: radius.md, padding: 12, flexDirection: 'row', alignItems: 'center' },
  storeIcon:      { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  storeInfo:      { flex: 1 },
  storeName:      { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  storeCity:      { fontSize: typography.xs, color: colors.lightGrey, marginTop: 2 },
  confirmCard:        { backgroundColor: colors.white, borderRadius: radius.md, padding: 14 },
  confirmHeader:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  confirmStore:       { fontSize: typography.sm, fontWeight: '700', color: colors.dark, flex: 1 },
  confirmTime:        { fontSize: typography.xs, color: colors.lightGrey },
  confirmBy:          { fontSize: typography.xs, color: colors.midGrey, marginBottom: 6 },
  gpsTag:             { fontSize: typography.xs, color: colors.primary, fontWeight: '600', marginBottom: 6 },
  photoRow:           { marginTop: 6 },
  photoImg:           { width: '100%', height: 160, borderRadius: radius.sm },
  confirmNotes:       { fontSize: typography.xs, color: colors.midGrey, marginTop: 6, fontStyle: 'italic' },
  emptyText:          { color: colors.lightGrey, textAlign: 'center', marginTop: 24, fontSize: typography.sm },
  ctaBar:             { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  ctaBtn:             { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadow.green },
  ctaBtnText:         { color: colors.white, fontSize: typography.md, fontWeight: '700' },
  confirmedBanner:    { backgroundColor: '#D1FAE5', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  confirmedBannerText:{ color: '#065F46', fontSize: typography.md, fontWeight: '700' },
});
