import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import StatusChip   from '../../../components/common/StatusChip';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function UserDetailScreen({ route, navigation }) {
  const passedUser = route.params?.user || {};
  const userId = passedUser.id;
  const qc = useQueryClient();

  // Fetch fresh user data including store and role
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => client.get(`/users/${userId}`).then(r => r.data?.data ?? r.data),
    enabled: !!userId,
    initialData: passedUser,   // show passed data immediately while fetching
  });

  const deactivateMutation = useMutation({
    mutationFn: (status) => client.put(`/users/${userId}`, { ...user, status }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', userId] });
      Alert.alert('Done', 'User status updated.');
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed'),
  });

  const resetPwMutation = useMutation({
    mutationFn: () => client.post(`/users/${userId}/reset-password`, {}).then(r => r.data),
    onSuccess: (data) => {
      if (data.new_password) {
        Alert.alert('Password Reset', `New temporary password:\n\n${data.new_password}\n\nShare this with the user.`);
      } else {
        Alert.alert('Done', 'Password has been reset.');
      }
    },
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed to reset password'),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: () => client.post(`/users/${userId}/force-logout`).then(r => r.data),
    onSuccess: () => Alert.alert('Done', 'All sessions for this user have been terminated.'),
    onError: (err) => Alert.alert('Error', err.response?.data?.error || 'Failed'),
  });

  function confirmDeactivate() {
    const isActive = user?.status === 'active';
    const action   = isActive ? 'Deactivate' : 'Activate';
    const newStatus = isActive ? 'inactive' : 'active';
    if (Platform.OS === 'web') {
      if (window.confirm(`${action} "${user?.name}"?`)) deactivateMutation.mutate(newStatus);
    } else {
      Alert.alert(action, `${action} "${user?.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: action, style: isActive ? 'destructive' : 'default',
          onPress: () => deactivateMutation.mutate(newStatus) },
      ]);
    }
  }

  if (isLoading && !passedUser.id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="User Profile" onBack={() => navigation.goBack()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (isError && !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="User Profile" onBack={() => navigation.goBack()} />
        <Text style={{ textAlign: 'center', marginTop: 60, color: colors.error }}>Failed to load user.</Text>
      </SafeAreaView>
    );
  }

  const ACTIONS = [
    {
      label: '🔑  Reset Password',
      color: colors.info,
      onPress: () => resetPwMutation.mutate(),
      loading: resetPwMutation.isPending,
    },
    {
      label: '🚪  Force Logout',
      color: colors.warning,
      onPress: () => forceLogoutMutation.mutate(),
      loading: forceLogoutMutation.isPending,
    },
    {
      label: user?.status === 'active' ? '🚫  Deactivate User' : '✅  Activate User',
      color: user?.status === 'active' ? colors.error : colors.success,
      onPress: confirmDeactivate,
      loading: deactivateMutation.isPending,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="User Profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <StatusChip status={user?.status} />
        </View>

        {/* Account Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Info</Text>
          {[
            { label: 'Email',  value: user?.email },
            { label: 'Phone',  value: user?.phone },
            { label: 'Role',   value: user?.role_name },
            { label: 'Status', value: user?.status, isChip: true },
          ].map(r => (
            <View key={r.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{r.label}</Text>
              {r.isChip
                ? <StatusChip status={r.value} />
                : <Text style={styles.infoValue}>{r.value || '—'}</Text>
              }
            </View>
          ))}
        </View>

        {/* Assigned Store */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Store</Text>
          {user?.store_name ? (
            <View style={styles.storeRow}>
              <Text style={styles.storeIcon}>🏪</Text>
              <Text style={styles.storeText}>{user.store_name}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No store assigned</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionBtn, { borderColor: a.color }, a.loading && styles.btnDisabled]}
              onPress={a.onPress}
              disabled={a.loading}
            >
              {a.loading
                ? <ActivityIndicator color={a.color} size="small" />
                : <Text style={[styles.actionText, { color: a.color }]}>{a.label}</Text>
              }
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.background },
  scroll:      { padding: 16, paddingBottom: 40 },
  avatarCard:  { backgroundColor: colors.white, borderRadius: radius.lg, padding: 24,
                 alignItems: 'center', marginBottom: 12, ...shadow.md },
  avatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary,
                 alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { color: colors.white, fontWeight: '800', fontSize: 24 },
  name:        { fontSize: typography.xl, fontWeight: '800', color: colors.dark, marginBottom: 8 },
  card:        { backgroundColor: colors.white, borderRadius: radius.lg, padding: 18,
                 marginBottom: 12, ...shadow.sm },
  cardTitle:   { fontSize: typography.sm, fontWeight: '700', color: colors.midGrey,
                 textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:   { fontSize: typography.sm, color: colors.midGrey },
  infoValue:   { fontSize: typography.sm, fontWeight: '600', color: colors.dark },
  storeRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  storeIcon:   { fontSize: 16, marginRight: 10 },
  storeText:   { fontSize: typography.sm, color: colors.dark, fontWeight: '600' },
  emptyText:   { fontSize: typography.sm, color: colors.lightGrey, fontStyle: 'italic' },
  actionBtn:   { borderWidth: 1.5, borderRadius: radius.md, padding: 13,
                 marginBottom: 8, alignItems: 'center' },
  actionText:  { fontSize: typography.sm, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
