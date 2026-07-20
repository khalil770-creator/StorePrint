import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

export default function EmptyState({ icon = '📭', title, message }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon:    { fontSize: 48, marginBottom: 16 },
  title:   { fontSize: typography.lg, fontWeight: '700', color: colors.darkGrey, textAlign: 'center' },
  message: { fontSize: typography.sm, color: colors.midGrey, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
