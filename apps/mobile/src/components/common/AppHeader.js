/**
 * AppHeader — used by ALL tab root screens.
 * Stitch design: white bg, bottom border, Ideas logo + StorePrint brand,
 * subtitle below, notification bell + user avatar on right.
 */
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';

export default function AppHeader({ subtitle, rightSlot }) {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function handleLogout() {
    const doLogout = () => {
      client.post('/auth/logout').catch(() => {});
      qc.clear();
      logout();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of StorePrint?')) doLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>

        {/* Left: Ideas logo + app name block */}
        <View style={styles.leftBlock}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>StorePrint</Text>
          </View>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Optional extra right slot */}
        {rightSlot && <View style={styles.extraRight}>{rightSlot}</View>}

        {/* Notification bell */}
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>

        {/* User avatar — tap to logout */}
        <TouchableOpacity style={styles.avatar} onPress={handleLogout} activeOpacity={0.75}>
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#c3c6d6',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftBlock: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    height: 32,
    width: 80,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003d9b',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: '#434654',
    marginTop: 1,
  },
  extraRight: {
    marginLeft: 8,
  },
  bellBtn: {
    marginLeft: 8,
    padding: 6,
  },
  bellIcon: {
    fontSize: 18,
  },
  avatar: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d4e0f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#576377',
    fontWeight: '700',
    fontSize: 13,
  },
});
