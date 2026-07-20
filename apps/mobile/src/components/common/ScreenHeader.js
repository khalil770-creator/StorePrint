import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, shadow } from '../../constants/theme';

export default function ScreenHeader({ title, subtitle, onBack, rightAction }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {rightAction && (
          <TouchableOpacity style={styles.rightBtn} onPress={rightAction.onPress}>
            <Text style={styles.rightBtnText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { backgroundColor: colors.white, paddingBottom: 0, ...shadow.sm },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:    { marginRight: 8, padding: 4 },
  backIcon:   { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  titleWrap:  { flex: 1 },
  title:      { fontSize: typography.lg, fontWeight: '700', color: colors.dark },
  subtitle:   { fontSize: typography.xs, color: colors.midGrey, marginTop: 1 },
  rightBtn:   { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7,
                borderRadius: 8 },
  rightBtnText: { color: colors.white, fontSize: typography.sm, fontWeight: '700' },
  accent:     { height: 3, backgroundColor: colors.primary, marginHorizontal: 16,
                borderRadius: 2, marginBottom: 0 },
});
