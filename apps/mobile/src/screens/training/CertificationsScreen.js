import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const FILTERS = ['All', 'Active', 'Expired'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CertificationsScreen({ navigation }) {
  const [filter, setFilter] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['my-certifications'],
    queryFn: () => client.get('/training/certifications/me').then(r => r.data),
  });
  const allCerts = data || [];

  const certs = allCerts.filter((c) => filter === 'All' || c.status === filter.toLowerCase());
  const activeCount = allCerts.filter((c) => c.status === 'active').length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Certifications" subtitle="Loading..." onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Certifications" subtitle={`${activeCount} active`} onBack={() => navigation.goBack()} />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={certs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = item.status === 'active';
          return (
            <View style={[styles.card, shadow.sm]}>
              <View style={styles.cardTop}>
                <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeExpired]}>
                  <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextExpired]}>
                    {isActive ? '✓ Active' : '✕ Expired'}
                  </Text>
                </View>
              </View>
              <Text style={styles.courseTitle}>{item.course || item.course_title || item.title}</Text>
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>ISSUED</Text>
                  <Text style={styles.dateValue}>{formatDate(item.issueDate || item.issued_at)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>EXPIRES</Text>
                  <Text style={[styles.dateValue, !isActive && { color: colors.error }]}>{formatDate(item.expiryDate || item.expires_at)}</Text>
                </View>
              </View>
              {isActive && (
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Alert.alert('Download', 'Certificate download would start here.')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.downloadBtnText}>⬇ Download Certificate</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: colors.background },
  filterRow:          { flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterTab:          { flex: 1, paddingVertical: 7, borderRadius: radius.sm, alignItems: 'center' },
  filterTabActive:    { backgroundColor: colors.primaryBg },
  filterLabel:        { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  filterLabelActive:  { color: colors.primary },
  list:               { padding: 16, gap: 12, paddingBottom: 32 },
  card:               { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTop:            { marginBottom: 10 },
  badge:              { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeActive:        { backgroundColor: colors.statusActive },
  badgeExpired:       { backgroundColor: '#FFF0F0' },
  badgeText:          { fontSize: typography.xs, fontWeight: '700' },
  badgeTextActive:    { color: colors.statusActiveText },
  badgeTextExpired:   { color: colors.error },
  courseTitle:        { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  datesRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  dateItem:           { flex: 1 },
  dateLabel:          { fontSize: typography.xs, color: colors.lightGrey, fontWeight: '600', letterSpacing: 0.5, marginBottom: 3 },
  dateValue:          { fontSize: typography.sm, fontWeight: '700', color: colors.dark },
  divider:            { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 16 },
  downloadBtn:        { backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '40' },
  downloadBtnText:    { fontSize: typography.sm, fontWeight: '700', color: colors.primary },
});
