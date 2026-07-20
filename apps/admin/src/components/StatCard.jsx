import React from 'react'
import { colors, shadow, fonts } from '../theme'

export default function StatCard({ label, value, trend }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #c3c6d6',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      flex: 1,
      minWidth: 140,
      fontFamily: fonts.body,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#737685',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          fontFamily: fonts.body,
        }}>
          {label}
        </div>
        {trend && (
          <div style={{
            fontSize: 11, fontWeight: 600, color: '#003d9b',
            background: '#d4e0f8', borderRadius: 20,
            padding: '2px 8px', fontFamily: fonts.body,
          }}>
            {trend}
          </div>
        )}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 700, color: '#191c1e',
        fontFamily: fonts.headline, lineHeight: 1,
      }}>
        {value ?? '—'}
      </div>
    </div>
  )
}
