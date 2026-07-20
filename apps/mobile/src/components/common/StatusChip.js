import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Stitch spec: pill-shaped, tinted bg (10% of status color), high-contrast text, 10-11px bold
const VARIANTS = {
  active:      { bg: 'rgba(16,185,129,0.10)',  text: '#065f46' },
  present:     { bg: 'rgba(16,185,129,0.10)',  text: '#065f46' },
  completed:   { bg: 'rgba(16,185,129,0.10)',  text: '#065f46' },
  approved:    { bg: 'rgba(16,185,129,0.10)',  text: '#065f46' },
  published:   { bg: 'rgba(16,185,129,0.10)',  text: '#065f46' },
  submitted:   { bg: 'rgba(16,185,129,0.10)',  text: '#065f46' },

  pending:     { bg: 'rgba(245,158,11,0.10)',  text: '#92400e' },
  late:        { bg: 'rgba(245,158,11,0.10)',  text: '#92400e' },
  warning:     { bg: 'rgba(245,158,11,0.10)',  text: '#92400e' },
  in_progress: { bg: 'rgba(245,158,11,0.10)',  text: '#92400e' },
  open:        { bg: 'rgba(0,82,204,0.10)',    text: '#003d9b' },

  absent:      { bg: 'rgba(186,26,26,0.10)',   text: '#ba1a1a' },
  failed:      { bg: 'rgba(186,26,26,0.10)',   text: '#ba1a1a' },
  critical:    { bg: 'rgba(186,26,26,0.10)',   text: '#ba1a1a' },
  error:       { bg: 'rgba(186,26,26,0.10)',   text: '#ba1a1a' },

  inactive:    { bg: '#f1f5f9',                text: '#434654' },
  draft:       { bg: '#f1f5f9',                text: '#434654' },
  renovating:  { bg: 'rgba(124,58,237,0.10)',  text: '#5b21b6' },
};

export default function StatusChip({ status, label }) {
  const v = VARIANTS[status?.toLowerCase()] ?? { bg: '#f1f5f9', text: '#434654' };
  return (
    <View style={[styles.chip, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>
        {(label || status || '—').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 0.6,
  },
});
