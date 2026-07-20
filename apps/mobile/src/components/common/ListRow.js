import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, radius, shadow } from '../../constants/theme';

export default function ListRow({ title, subtitle, meta, status, statusColor, onPress, icon }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {icon && (
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={styles.right}>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}
        {!!status && (
          <View style={[styles.statusDot, { backgroundColor: statusColor || colors.primary }]} />
        )}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
               borderRadius: radius.md, padding: 14, marginBottom: 8, ...shadow.sm },
  iconWrap:  { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primaryBg,
               alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon:      { fontSize: 18 },
  body:      { flex: 1 },
  title:     { fontSize: typography.md, fontWeight: '600', color: colors.dark },
  subtitle:  { fontSize: typography.sm, color: colors.midGrey, marginTop: 2 },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta:      { fontSize: typography.xs, color: colors.midGrey },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  chevron:   { fontSize: 20, color: colors.lightGrey, marginLeft: 2 },
});
