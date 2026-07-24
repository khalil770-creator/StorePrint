import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import AppHeader  from '../../components/common/AppHeader';
import StatusChip from '../../components/common/StatusChip';
import client from '../../api/client';
import { fonts } from '../../constants/theme';

const TABS = ['My Audits', 'Scheduled', 'Completed'];

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return null;

  let bg, textColor, borderColor, label;
  if (score >= 80) {
    bg = 'rgba(16,185,129,0.10)';
    textColor = '#065f46';
    borderColor = '#10b981';
    label = 'Excellent';
  } else if (score >= 60) {
    bg = 'rgba(245,158,11,0.10)';
    textColor = '#92400e';
    borderColor = '#f59e0b';
    label = 'Pending';
  } else {
    bg = 'rgba(186,26,26,0.10)';
    textColor = '#ba1a1a';
    borderColor = '#ba1a1a';
    label = 'Action Required';
  }

  return (
    <View style={styles.scoreBadgeWrap}>
      <View style={[styles.scoreBadge, { backgroundColor: bg, borderColor }]}>
        <Text style={[styles.scoreText, { color: textColor }]}>{score}%</Text>
      </View>
      <Text style={[styles.scoreLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function StatDot({ color }) {
  return <View style={[styles.statDot, { backgroundColor: color }]} />;
}

export default function AuditDashboard({ navigation }) {
  const [tab, setTab] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audits'],
    queryFn: () => client.get('/auditing').then(r => r.data),
  });
  const audits = Array.isArray(data) ? data : (data?.data || []);

  const pending   = audits.filter(a => a.status === 'open' || a.status === 'in_progress').length;
  const completed = audits.filter(a => a.status === 'submitted' || a.status === 'approved').length;
  const scores    = audits.filter(a => a.score != null).map(a => a.score);
  const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '%' : '--';

  const tabAudits = tab === 0
    ? audits.filter(a => a.status === 'open' || a.status === 'in_progress')
    : tab === 1
    ? audits.filter(a => a.status === 'scheduled')
    : audits.filter(a => a.status === 'submitted' || a.status === 'approved');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader subtitle="Brand compliance auditing" />

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statTopRow}>
            <StatDot color="#f59e0b" />
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
          <Text style={styles.statValue}>{String(pending)}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTopRow}>
            <StatDot color="#10b981" />
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
          <Text style={styles.statValue}>{String(completed)}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTopRow}>
            <StatDot color="#003d9b" />
            <Text style={styles.statLabel}>AVG SCORE</Text>
          </View>
          <Text style={[styles.statValue, styles.statValueBlue]}>{avgScore}</Text>
        </View>
      </View>

      {/* Tab Strip */}
      <View style={styles.tabStrip}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color="#003d9b" style={{ marginTop: 40 }} />
      ) : !data ? (
        <Text style={styles.retryText} onPress={refetch}>Failed to load. Tap to retry.</Text>
      ) : (
        <FlatList
          data={tabAudits}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.score !== null
                ? navigation.navigate('AuditReport', { audit: item })
                : navigation.navigate('AuditForm',   { audit: item })
              }
              activeOpacity={0.8}>
              <View style={styles.cardBody}>
                <Text style={styles.storeName} numberOfLines={1}>{item.store_name || item.store}</Text>
                <Text style={styles.templateName}>{item.template_name || item.template}</Text>
                <View style={styles.cardMeta}>
                  <StatusChip status={item.status} />
                  {!!item.due_date && (
                    <View style={styles.timePill}>
                      <Text style={styles.timePillText}>Due {item.due_date}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cardRight}>
                <ScoreBadge score={item.score} />
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB – New Audit */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AuditForm', { mode: 'new' })}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },

  // Stat Cards
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#c3c6d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#737685',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1e',
  },
  statValueBlue: {
    color: '#003d9b',
  },

  // Tab Strip
  tabStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#c3c6d6',
    marginBottom: 10,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737685',
  },
  tabTextActive: {
    color: '#065f46',
  },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  retryText: { textAlign: 'center', marginTop: 40, color: '#ba1a1a', fontSize: 14 },

  // Audit Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#c3c6d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: { flex: 1 },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191c1e',
    marginBottom: 3,
  },
  templateName: {
    fontSize: 14,
    color: '#434654',
    marginBottom: 10,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePill: {
    borderRadius: 999,
    backgroundColor: '#e7e8ea',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timePillText: {
    fontSize: 10,
    color: '#434654',
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  scoreBadgeWrap: {
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '700',
    fontSize: 13,
    fontFamily: fonts.mono,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  chevron: { fontSize: 20, color: '#737685', marginLeft: 4 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#ffffff', fontSize: 28, lineHeight: 32, fontWeight: '700' },
});
