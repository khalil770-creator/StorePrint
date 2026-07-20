import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../constants/theme';
import client from '../../api/client';

const PLATFORMS = ['All', 'Google', 'TripAdvisor', 'Facebook', 'Manual'];

const PLATFORM_COLOR = { Google: '#EA4335', TripAdvisor: '#34A853', Facebook: '#1877F2', Manual: colors.midGrey };

const SENTIMENT_CHIP = {
  positive: { bg: colors.statusActive, text: colors.statusActiveText },
  neutral:  { bg: '#EEF4FF', text: '#1E40AF' },
  negative: { bg: '#FFF0F0', text: colors.error },
};


function Stars({ count }) {
  return (
    <Text style={{ fontSize: 13, color: colors.warning }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </Text>
  );
}

export default function CXReviewsScreen({ navigation }) {
  const [platform, setPlatform] = useState('All');
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['cx-reviews'],
    queryFn: () => client.get('/cx/reviews').then(r => r.data),
  });
  const reviews = data?.data || [];

  const filtered = reviews.filter((r) => platform === 'All' || r.platform === platform);

  const avgByPlatform = ['Google', 'TripAdvisor', 'Facebook', 'Manual'].map((p) => {
    const items = reviews.filter((r) => r.platform === p);
    const avg = items.length ? (items.reduce((s, r) => s + (r.stars || r.rating || 0), 0) / items.length).toFixed(1) : '-';
    return { platform: p, avg, count: items.length };
  });

  const handleRespond = (id) => {
    if (!replyText.trim()) return Alert.alert('Empty Reply', 'Please write a response first.');
    Alert.alert('Sent', 'Your response has been submitted.', [{ text: 'OK', onPress: () => { setReplyFor(null); setReplyText(''); } }]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Reviews" subtitle="Loading..." onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Reviews" subtitle={`${reviews.length} reviews`} onBack={() => navigation.goBack()} />

      <View style={styles.filterRow}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, platform === p && styles.chipActive]}
            onPress={() => setPlatform(p)}
          >
            <Text style={[styles.chipText, platform === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        {avgByPlatform.map((s) => (
          <View key={s.platform} style={[styles.summaryCard, shadow.sm]}>
            <Text style={[styles.summaryPlatform, { color: PLATFORM_COLOR[s.platform] || colors.midGrey }]}>{s.platform}</Text>
            <Text style={styles.summaryAvg}>{s.avg} ★</Text>
            <Text style={styles.summaryCount}>{s.count} reviews</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const sc = SENTIMENT_CHIP[item.sentiment];
          return (
            <View style={[styles.card, shadow.sm]}>
              <View style={styles.cardTop}>
                <View style={[styles.platformBadge, { backgroundColor: (PLATFORM_COLOR[item.platform] || colors.midGrey) + '20' }]}>
                  <Text style={[styles.platformText, { color: PLATFORM_COLOR[item.platform] || colors.midGrey }]}>{item.platform}</Text>
                </View>
                <View style={[styles.sentChip, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.sentChipText, { color: sc.text }]}>{item.sentiment}</Text>
                </View>
                {item.responded && (
                  <View style={styles.respondedBadge}><Text style={styles.respondedText}>✓ Replied</Text></View>
                )}
              </View>
              <View style={styles.starsRow}>
                <Stars count={item.stars || item.rating || 0} />
                <Text style={styles.reviewer}>{item.reviewer || item.reviewer_name}</Text>
                <Text style={styles.date}>{item.date || item.created_at}</Text>
              </View>
              <Text style={styles.snippet}>{item.snippet || item.text || item.comment}</Text>

              {replyFor === item.id ? (
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write your response..."
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                    placeholderTextColor={colors.lightGrey}
                  />
                  <View style={styles.replyActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setReplyFor(null)} activeOpacity={0.85}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sendBtn} onPress={() => handleRespond(item.id)} activeOpacity={0.85}>
                      <Text style={styles.sendBtnText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                !item.responded && (
                  <TouchableOpacity style={styles.respondBtn} onPress={() => setReplyFor(item.id)} activeOpacity={0.85}>
                    <Text style={styles.respondBtnText}>Respond</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.background },
  filterRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  chip:             { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
  chipActive:       { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:         { fontSize: typography.xs, fontWeight: '600', color: colors.midGrey },
  chipTextActive:   { color: colors.white },
  summaryRow:       { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryCard:      { flex: 1, backgroundColor: colors.inputBg, borderRadius: radius.md, padding: 8, alignItems: 'center' },
  summaryPlatform:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  summaryAvg:       { fontSize: typography.sm, fontWeight: '800', color: colors.warning, marginTop: 2 },
  summaryCount:     { fontSize: 9, color: colors.lightGrey, marginTop: 1 },
  list:             { padding: 16, gap: 12, paddingBottom: 32 },
  card:             { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14 },
  cardTop:          { flexDirection: 'row', gap: 8, marginBottom: 10 },
  platformBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  platformText:     { fontSize: typography.xs, fontWeight: '700' },
  sentChip:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  sentChipText:     { fontSize: typography.xs, fontWeight: '700', textTransform: 'capitalize' },
  respondedBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.statusActive },
  respondedText:    { fontSize: typography.xs, fontWeight: '700', color: colors.statusActiveText },
  starsRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reviewer:         { flex: 1, fontSize: typography.xs, fontWeight: '700', color: colors.dark },
  date:             { fontSize: typography.xs, color: colors.lightGrey },
  snippet:          { fontSize: typography.sm, color: colors.dark, lineHeight: 19, marginBottom: 12 },
  respondBtn:       { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primaryBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary + '40' },
  respondBtnText:   { fontSize: typography.xs, fontWeight: '700', color: colors.primary },
  replyBox:         { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  replyInput:       { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, fontSize: typography.sm, color: colors.dark, minHeight: 72, textAlignVertical: 'top', marginBottom: 8 },
  replyActions:     { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  cancelBtnText:    { fontSize: typography.xs, fontWeight: '700', color: colors.midGrey },
  sendBtn:          { paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.primary },
  sendBtnText:      { fontSize: typography.xs, fontWeight: '700', color: colors.white },
});
