import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppHeader from '../../components/common/AppHeader';
import { getCurrentGPS } from '../../utils/gps';
import client from '../../api/client';
import { fonts } from '../../constants/theme';

const fmtTime = (iso) => iso ? new Date(iso).toTimeString().slice(0, 5) : '--';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '--';

function StatusPill({ status }) {
  const map = {
    present: { bg: 'rgba(16,185,129,0.12)', text: '#065f46' },
    late:    { bg: 'rgba(245,158,11,0.12)', text: '#92400e' },
    absent:  { bg: 'rgba(186,26,26,0.12)',  text: '#ba1a1a' },
  };
  const c = map[status] || { bg: '#f3f4f6', text: '#434654' };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const DOT_COLOR = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ba1a1a',
};

export default function AttendanceScreen({ navigation }) {
  const [clockTime, setClockTime] = useState('');
  const qc = useQueryClient();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => client.get('/field/attendance').then(r => r.data),
  });
  const log = attendanceData || [];

  // Derive clocked-in state from latest attendance record
  const activeRecord = log.find(r => !r.clock_out_at);
  const clocked = !!activeRecord;

  const { data: myStore } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => client.get('/field/my-store').then(r => r.data),
  });

  const clockIn = useMutation({
    mutationFn: ({ store_id, lat, lng }) =>
      client.post('/field/clock-in', { store_id, gps: { lat, lng } }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-attendance'] }),
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Clock-in failed'),
  });

  const clockOut = useMutation({
    mutationFn: ({ store_id, lat, lng }) =>
      client.post('/field/clock-out', { store_id, gps: { lat, lng } }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-attendance'] }),
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Clock-out failed'),
  });

  const isMutating = clockIn.isPending || clockOut.isPending;

  const handleClock = async () => {
    try {
      const loc = await getCurrentGPS();
      const now = new Date();
      setClockTime(now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'));
      const params = { store_id: myStore?.id, lat: loc.lat, lng: loc.lng };
      if (!clocked) {
        clockIn.mutate(params);
      } else {
        clockOut.mutate(params);
      }
    } catch (e) {
      Alert.alert('GPS Required', e.message);
    }
  };

  const currentStore = activeRecord
    ? (log.find(r => r.id === activeRecord.id)?.store_name || myStore?.name || 'Unknown Store')
    : (myStore?.name || 'No store assigned');

  const activeClockTime = activeRecord
    ? fmtTime(activeRecord.clock_in_at)
    : clockTime;

  // Compute weekly adherence (present days / total days this week)
  const presentCount = log.filter(r => r.status === 'present').length;
  const totalCount = log.length;
  const adherencePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 92;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader subtitle="Field presence & attendance" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Clock Card — emerald */}
        <View style={styles.clockCard}>
          {/* Decorative background icon */}
          <Text style={styles.clockDecor}>🕐</Text>

          {/* Status row */}
          <View style={styles.clockStatusRow}>
            <View style={styles.clockDot} />
            <Text style={styles.clockLabel}>{clocked ? 'Clocked In' : 'Not Clocked In'}</Text>
          </View>

          {/* Time display when clocked in */}
          {clocked && (
            <Text style={styles.clockTime}>{activeClockTime}</Text>
          )}

          {/* Store name */}
          <Text style={styles.clockStore}>📍 {currentStore}</Text>

          {/* Clock button */}
          <TouchableOpacity
            style={styles.clockBtn}
            onPress={handleClock}
            disabled={isMutating}>
            {isMutating
              ? <ActivityIndicator color="#10b981" />
              : <Text style={styles.clockBtnText}>{clocked ? 'Clock Out' : 'Clock In'}</Text>}
          </TouchableOpacity>

          <Text style={styles.gpsNote}>GPS location required to clock in/out</Text>
        </View>

        {/* Quick Nav Row */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Roster')}>
            <View style={styles.quickIconWrap}>
              <Text style={styles.quickIconText}>📅</Text>
            </View>
            <Text style={styles.quickTitle}>My Roster</Text>
            <Text style={styles.quickSub}>View your schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('LivePresence')}>
            <View style={styles.quickIconWrap}>
              <Text style={styles.quickIconText}>👥</Text>
            </View>
            <Text style={styles.quickTitle}>Live Presence</Text>
            <Text style={styles.quickSub}>Who's on site now</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance Log */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <TouchableOpacity>
            <Text style={styles.viewHistoryBtn}>View History</Text>
          </TouchableOpacity>
        </View>

        {isLoading
          ? <ActivityIndicator color="#003d9b" style={{ marginTop: 40 }} />
          : log.map((row, i) => (
            <View key={row.id ?? i} style={styles.logRow}>
              <View style={styles.logLeft}>
                <View style={[styles.logDot, { backgroundColor: DOT_COLOR[row.status] || '#737685' }]} />
                <View>
                  <Text style={styles.logDate}>{fmtDate(row.clock_in_at)}</Text>
                  <Text style={styles.logTime}>{fmtTime(row.clock_in_at)} – {fmtTime(row.clock_out_at)}</Text>
                </View>
              </View>
              <StatusPill status={row.status} />
            </View>
          ))
        }

        {/* Weekly Adherence Strip */}
        <View style={styles.adherenceStrip}>
          <View style={styles.adherenceHeader}>
            <Text style={styles.adherenceLabel}>Weekly Adherence</Text>
            <Text style={styles.adherenceValue}>{adherencePct}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${adherencePct}%` }]} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  // Clock Card
  clockCard: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  clockDecor: {
    position: 'absolute',
    top: 12,
    right: 16,
    fontSize: 80,
    opacity: 0.10,
  },
  clockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  clockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  clockLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  clockTime: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 4,
  },
  clockStore: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
  },
  clockBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  clockBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 15,
  },
  gpsNote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  // Quick Nav
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0,82,204,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickIconText: {
    fontSize: 20,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191c1e',
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 11,
    color: '#434654',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191c1e',
  },
  viewHistoryBtn: {
    fontSize: 12,
    color: '#003d9b',
    fontWeight: '600',
  },

  // Log Rows
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DFE1E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191c1e',
  },
  logTime: {
    fontSize: 11,
    color: '#434654',
    fontFamily: fonts.mono,
    marginTop: 1,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Weekly Adherence
  adherenceStrip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#c3c6d6',
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adherenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#191c1e',
  },
  adherenceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003d9b',
    fontFamily: fonts.mono,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#c3c6d6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#003d9b',
    borderRadius: 4,
  },
});
