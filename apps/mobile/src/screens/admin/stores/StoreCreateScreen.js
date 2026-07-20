import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { colors, typography, radius, shadow } from '../../../constants/theme';
import client from '../../../api/client';

const FORMATS  = ['flagship', 'standard', 'pop-up', 'franchise'];
const STATUSES = ['active', 'inactive', 'renovating'];

export default function StoreCreateScreen({ navigation }) {
  const qc = useQueryClient();

  const [submitted, setSubmitted] = useState(false);
  const [name,            setName]           = useState('');
  const [code,            setCode]           = useState('');
  const [format,          setFormat]         = useState('standard');
  const [status,          setStatus]         = useState('active');
  const [address,         setAddress]        = useState('');
  const [city,            setCity]           = useState('');
  const [country,         setCountry]        = useState('');
  const [lat,             setLat]            = useState('');
  const [lng,             setLng]            = useState('');
  const [geofenceRadius,  setGeofenceRadius] = useState('200');
  const [tags,            setTags]           = useState('');
  const [phone,           setPhone]          = useState('');
  const [contactPerson,   setContactPerson]  = useState('');
  const [contactCell,     setContactCell]    = useState('');

  const create = useMutation({
    mutationFn: (body) => client.post('/stores', body).then(r => r.data),
    onSuccess: (store) => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      navigation.goBack();
      // Show alert after navigation so it appears on the list screen
      setTimeout(() => Alert.alert('Store Created', `"${store.name}" has been added.`), 300);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to create store';
      // On web Alert.alert may not be prominent — show in console too
      console.error('Store create error:', msg);
      Alert.alert('Error', msg);
    },
  });

  function handleSave() {
    if (submitted) return;               // block double-tap
    if (!name.trim()) {
      Alert.alert('Required', 'Store name is required.');
      return;
    }
    setSubmitted(true);
    const body = {
      name:            name.trim(),
      code:            code.trim() || undefined,
      format,
      status,
      address:         address.trim() || undefined,
      city:            city.trim()    || undefined,
      country:         country.trim() || undefined,
      lat:             lat  ? parseFloat(lat)  : undefined,
      lng:             lng  ? parseFloat(lng)  : undefined,
      geofence_radius: geofenceRadius ? parseInt(geofenceRadius, 10) : 200,
      tags:            tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      phone:           phone.trim() || undefined,
      contact_person:  contactPerson.trim() || undefined,
      contact_cell:    contactCell.trim() || undefined,
    };
    create.mutate(body);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="New Store"
        subtitle="Add a store location"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>🏪 Basic Information</Text>

          <Text style={styles.label}>Store Name <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. City Centre Branch"
            placeholderTextColor={colors.lightGrey}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Store Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. CCB-001"
            placeholderTextColor={colors.lightGrey}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Format</Text>
          <View style={styles.chipRow}>
            {FORMATS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, format === f && styles.chipActive]}
                onPress={() => setFormat(f)}>
                <Text style={[styles.chipText, format === f && styles.chipTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.chipRow}>
            {STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, status === s && styles.chipActive]}
                onPress={() => setStatus(s)}>
                <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📍 Location</Text>

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            placeholderTextColor={colors.lightGrey}
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Dubai"
                placeholderTextColor={colors.lightGrey}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="UAE"
                placeholderTextColor={colors.lightGrey}
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>
        </View>

        {/* GPS & Geo-fence */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>🛰️ GPS & Geo-fence</Text>
          <Text style={styles.hint}>
            Coordinates are used to verify staff are on-site before submitting audits, checklists and tasks.
          </Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="25.2048"
                placeholderTextColor={colors.lightGrey}
                value={lat}
                onChangeText={setLat}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="55.2708"
                placeholderTextColor={colors.lightGrey}
                value={lng}
                onChangeText={setLng}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Geo-fence Radius (metres)</Text>
          <TextInput
            style={styles.input}
            placeholder="200"
            placeholderTextColor={colors.lightGrey}
            value={geofenceRadius}
            onChangeText={setGeofenceRadius}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>Staff must be within this radius to submit GPS-verified actions.</Text>
        </View>

        {/* Tags */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>🏷️ Tags</Text>
          <TextInput
            style={styles.input}
            placeholder="flagship, dubai, mall (comma-separated)"
            placeholderTextColor={colors.lightGrey}
            value={tags}
            onChangeText={setTags}
          />
        </View>

        {/* Contact */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>📞 Contact Information</Text>

          <Text style={styles.label}>Store Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+971 4 123 4567"
            placeholderTextColor={colors.lightGrey}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Contact Person</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.lightGrey}
            value={contactPerson}
            onChangeText={setContactPerson}
          />

          <Text style={styles.label}>Contact Person Cell</Text>
          <TextInput
            style={styles.input}
            placeholder="+971 50 123 4567"
            placeholderTextColor={colors.lightGrey}
            value={contactCell}
            onChangeText={setContactCell}
            keyboardType="phone-pad"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, create.isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={create.isPending || submitted}
          activeOpacity={0.85}>
          {create.isPending
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.saveText}>Create Store</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.background },
  scroll:        { padding: 16, gap: 14 },
  card:          { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16 },
  cardTitle:     { fontSize: typography.md, fontWeight: '700', color: colors.dark, marginBottom: 14 },
  label:         { fontSize: typography.sm, fontWeight: '600', color: colors.darkGrey, marginBottom: 6, marginTop: 10 },
  req:           { color: colors.error },
  input:         { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
                   paddingHorizontal: 12, paddingVertical: 11, fontSize: typography.sm,
                   color: colors.dark, backgroundColor: colors.inputBg },
  hint:          { fontSize: typography.xs, color: colors.midGrey, marginTop: 4, lineHeight: 18 },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                   borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
  chipActive:    { backgroundColor: colors.primaryBg, borderColor: colors.primary },
  chipText:      { fontSize: typography.sm, color: colors.midGrey, fontWeight: '600' },
  chipTextActive:{ color: colors.primary },
  row:           { flexDirection: 'row', gap: 12 },
  half:          { flex: 1 },
  ctaBar:        { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.white,
                   borderTopWidth: 1, borderTopColor: colors.border },
  cancelBtn:     { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
                   paddingVertical: 14, alignItems: 'center' },
  cancelText:    { fontSize: typography.md, color: colors.midGrey, fontWeight: '600' },
  saveBtn:       { flex: 2, backgroundColor: colors.primary, borderRadius: radius.md,
                   paddingVertical: 14, alignItems: 'center', ...shadow.green },
  saveBtnDisabled: { backgroundColor: colors.border },
  saveText:      { color: colors.white, fontSize: typography.md, fontWeight: '700' },
});
