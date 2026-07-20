import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, radius, shadow } from '../../constants/theme';

export default function StatCard({ label, value, sub, accent, onPress }) {
  const accentColor = accent || colors.primary;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {!!sub && <Text style={styles.sub}>{sub}</Text>}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card:      { flex: 1, backgroundColor: colors.white, borderRadius: radius.md,
               padding: 14, margin: 5, ...shadow.sm, overflow: 'hidden' },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  value:     { fontSize: typography.xxl, fontWeight: '800', color: colors.dark, marginTop: 8 },
  label:     { fontSize: typography.xs, color: colors.midGrey, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sub:       { fontSize: typography.xs, color: colors.primary, marginTop: 4, fontWeight: '600' },
});
