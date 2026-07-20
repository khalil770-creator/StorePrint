import React from 'react'
import { fonts } from '../theme'

// Stitch spec: pill-shaped, light tinted background (10% of status color), high-contrast text
const MAP = {
  active:      { bg: '#D1FAE5', color: '#065F46' },
  inactive:    { bg: '#F1F5F9', color: '#475569' },
  renovating:  { bg: '#EDE9FE', color: '#5B21B6' },
  admin:       { bg: '#DBEAFE', color: '#1E40AF' },
  superadmin:  { bg: '#FEE2E2', color: '#991B1B' },
  pending:     { bg: '#FEF3C7', color: '#92400E' },
  published:   { bg: '#D1FAE5', color: '#065F46' },
  draft:       { bg: '#F1F5F9', color: '#475569' },
  open:        { bg: '#DBEAFE', color: '#1E40AF' },
  submitted:   { bg: '#D1FAE5', color: '#065F46' },
  approved:    { bg: '#D1FAE5', color: '#065F46' },
  failed:      { bg: '#FEE2E2', color: '#991B1B' },
  in_progress: { bg: '#FEF3C7', color: '#92400E' },
}

export default function Badge({ status, label }) {
  const style = MAP[status?.toLowerCase()] ?? { bg: '#F1F5F9', color: '#475569' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      textTransform: 'capitalize',
      fontFamily: fonts.label,
      whiteSpace: 'nowrap',
    }}>
      {label || status || '—'}
    </span>
  )
}
