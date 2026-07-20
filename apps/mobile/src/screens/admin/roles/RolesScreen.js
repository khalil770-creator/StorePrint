import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

const ROLE_COLORS = [
  { color: '#FFF0F0', dot: colors.error },
  { color: '#EEF4FF', dot: colors.info },
  { color: colors.primaryBg, dot: colors.primary },
  { color: '#FFF8E1', dot: colors.warning },
  { color: '#F3E8FF', dot: '#7C3AED' },
  { color: colors.statusInactive, dot: colors.lightGrey },
];

export default function RolesScreen({ navigation }) {
  const { data: rolesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => client.get('/roles').then(r => r.data),
  });
  const roles = rolesData || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Roles & Rights"
        subtitle="Manage permissions"
        onBack={() => navigation.goBack()}
        rightAction={{ label: '+ Role', onPress: () => {} }}
      />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : isError ? (
        <TouchableOpacity onPress={refetch}>
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 40 }}>Failed to load. Tap to retry.</Text>
        </TouchableOpacity>
      ) : (
      <FlatList
        data={roles}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const palette = ROLE_COLORS[index % ROLE_COLORS.length];
          const permCount = item.permissions ? Object.keys(item.permissions).length : 0;
          return (
            <TouchableOpacity style={[styles.card, { borderLeftColor: palette.dot }]} activeOpacity={0.8}>
              <View style={[styles.iconWrap, { backgroundColor: palette.color }]}>
                <View style={[styles.dot, { backgroundColor: palette.dot }]} />
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.is_system === false && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customText}>CUSTOM</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.meta}>{item.user_count ?? 0} users  ·  {permCount} permissions</Text>
              </View>
              <TouchableOpacity style={styles.cloneBtn}>
                <Text style={styles.cloneText}>Clone</Text>
              </TouchableOpacity>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  list:        { padding: 16 },
  card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                 borderRadius: radius.md, padding: 14, marginBottom: 10,
                 borderLeftWidth: 4, ...shadow.sm },
  iconWrap:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center',
                 justifyContent: 'center', marginRight: 14 },
  dot:         { width: 14, height: 14, borderRadius: 7 },
  info:        { flex: 1 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:        { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  meta:        { fontSize: typography.xs, color: colors.midGrey, marginTop: 3 },
  customBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 7, paddingVertical: 2,
                 borderRadius: radius.full },
  customText:  { fontSize: 9, fontWeight: '800', color: '#7C3AED', letterSpacing: 0.5 },
  cloneBtn:    { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
                 paddingHorizontal: 10, paddingVertical: 5, marginRight: 8 },
  cloneText:   { fontSize: typography.xs, color: colors.midGrey, fontWeight: '600' },
  chevron:     { fontSize: 20, color: colors.lightGrey },
});
