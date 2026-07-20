import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import client from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { fonts } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [emailFocus, setEmailFocus]     = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const { setTokens, setUser }          = useAuthStore();

  const login = async () => {
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email: email.trim().toLowerCase(), password });
      setTokens(data.tokens.access, data.tokens.refresh);
      setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Top section: logo + brand */}
        <View style={styles.topSection}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>StorePrint</Text>
          <Text style={styles.tagline}>BRAND STORE MANAGEMENT PLATFORM</Text>
          <View style={styles.emeraldDivider} />
        </View>

        {/* Login card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account to continue</Text>

          {/* Error banner */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠  </Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={[styles.input, emailFocus && styles.inputFocus]}
            placeholder="you@company.com"
            placeholderTextColor="#737685"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
          />

          {/* Password */}
          <Text style={styles.label}>PASSWORD</Text>
          <View style={[styles.inputRow, passwordFocus && styles.inputFocus]}>
            <TextInput
              style={styles.inputInner}
              placeholder="Enter your password"
              placeholderTextColor="#737685"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              onSubmitEditing={login}
              returnKeyType="go"
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={login}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>Sign In  →</Text>}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>StorePrint v1.0  •  Powered by Ideas  •  Secure Login</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f9fb' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Top section
  topSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    height: 40,
    width: 120,
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#191c1e',
    fontFamily: fonts.headline,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 11,
    color: '#737685',
    fontFamily: fonts.label,
    textAlign: 'center',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  emeraldDivider: {
    width: 48,
    height: 3,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#c3c6d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#191c1e',
    fontFamily: fonts.headlineMd,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#434654',
    fontFamily: fonts.body,
    marginBottom: 20,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffdad6',
    borderLeftWidth: 3,
    borderLeftColor: '#ba1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: { fontSize: 14, color: '#ba1a1a' },
  errorText: { flex: 1, color: '#ba1a1a', fontSize: 14 },

  // Form
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    fontFamily: fonts.label,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: '#c3c6d6',
    color: '#191c1e',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#c3c6d6',
    marginBottom: 16,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#191c1e',
  },
  inputFocus: {
    borderColor: '#003d9b',
    backgroundColor: '#ffffff',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  eyeIcon: { fontSize: 16 },

  forgotWrap: { alignItems: 'flex-end', marginTop: -8, marginBottom: 22 },
  forgotText: { fontSize: 14, color: '#003d9b', fontWeight: '600' },

  btn: {
    backgroundColor: '#003d9b',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.65 },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.label,
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    fontSize: 11,
    color: '#737685',
    textAlign: 'center',
  },
});
