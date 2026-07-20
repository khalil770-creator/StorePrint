import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, fonts } from '../theme'

const s = {
  wrap:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  left:    { display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: {
    background: 'none', border: `1.5px solid ${colors.border}`, borderRadius: 8,
    padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: colors.midGrey,
    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: fonts.body, transition: 'border-color 0.12s',
  },
  titles:  {},
  title:   {
    fontSize: 22, fontWeight: 700, color: colors.dark,
    fontFamily: fonts.headline, letterSpacing: '-0.3px', lineHeight: '28px',
  },
  sub:     { fontSize: 13, color: colors.midGrey, marginTop: 3, fontFamily: fonts.body },
  actions: { display: 'flex', gap: 10, alignItems: 'center' },
  primaryBtn: {
    padding: '9px 18px', background: colors.primary, color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: fonts.body,
  },
}

export default function PageHeader({ title, subtitle, onBack, actions }) {
  const navigate = useNavigate()
  const goBack = onBack || (() => navigate(-1))

  return (
    <div style={s.wrap}>
      <div style={s.left}>
        {onBack !== false && (
          <button style={s.backBtn} onClick={goBack}>← Back</button>
        )}
        <div style={s.titles}>
          <div style={s.title}>{title}</div>
          {subtitle && <div style={s.sub}>{subtitle}</div>}
        </div>
      </div>
      {actions && <div style={s.actions}>{actions}</div>}
    </div>
  )
}
