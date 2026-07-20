import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import StatusChip   from '../../../components/common/StatusChip';
import EmptyState   from '../../../components/common/EmptyState';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function UsersListScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => client.get('/users').then(r => r.data),
  });
  const users = data?.data || [];

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Users"
        subtitle={`${users.length} members`}
        onBack={() => navigation.goBack()}
        rightAction={{ label: '+ Invite', onPress: () => {} }}
      />
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.search}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.lightGrey}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : isError ? (
        <TouchableOpacity onPress={refetch}>
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 40 }}>Failed to load. Tap to retry.</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="👤" title="No users found" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('UserDetail', { user: item })}
              activeOpacity={0.8}>
              <View style={[styles.avatar, item.status === 'inactive' && styles.avatarInactive]}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.role}>{item.role}</Text>
              </View>
              <View style={styles.right}>
                <StatusChip status={item.status} />
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.background },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                  marginHorizontal: 16, marginTop: 12, marginBottom: 4,
                  borderRadius: radius.md, paddingHorizontal: 12, ...shadow.sm },
  searchIcon:   { fontSize: 16, marginRight: 8 },
  search:       { flex: 1, paddingVertical: 12, fontSize: typography.md, color: colors.dark },
  list:         { padding: 16, paddingTop: 8 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
                  borderRadius: radius.md, padding: 12, marginBottom: 8, ...shadow.sm },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarInactive: { backgroundColor: colors.lightGrey },
  avatarText:   { color: colors.white, fontWeight: '800', fontSize: 15 },
  info:         { flex: 1 },
  name:         { fontSize: typography.md, fontWeight: '700', color: colors.dark },
  email:        { fontSize: typography.xs, color: colors.midGrey, marginTop: 1 },
  role:         { fontSize: typography.xs, color: colors.primary, fontWeight: '600', marginTop: 2 },
  right:        { alignItems: 'flex-end', gap: 4 },
  chevron:      { fontSize: 20, color: colors.lightGrey },
});
