import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import StatCard from '../components/StatCard'
import { colors, shadow, fonts } from '../theme'
import client from '../api/client'

const QUICK_LINKS = [
  { icon: 'store',              label: 'Manage Stores',      path: '/admin/stores',          accent: '#003d9b' },
  { icon: 'group',              label: 'Manage Users',        path: '/admin/users',           accent: '#3B82F6' },
  { icon: 'admin_panel_settings', label: 'Roles & Permissions', path: '/admin/roles',         accent: '#7C3AED' },
  { icon: 'assignment',         label: 'Audit Templates',    path: '/admin/audit-templates', accent: '#F59E0B' },
  { icon: 'fact_check',         label: 'Env Checklists',     path: '/admin/env-checklists',  accent: '#10B981' },
  { icon: 'poll',               label: 'CX Surveys',         path: '/admin/surveys',         accent: '#EC4899' },
  { icon: 'school',             label: 'Training Courses',   path: '/admin/courses',         accent: '#F59E0B' },
  { icon: 'settings',           label: 'System Settings',    path: '/admin/settings',        accent: '#737685' },
]

const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: '#737685',
  textTransform: 'uppercase', letterSpacing: '1px',
  marginBottom: 14, fontFamily: fonts.label,
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: usersData }  = useQuery({ queryKey: ['users'],  queryFn: () => client.get('/users').then(r => r.data) })
  const { data: storesData } = useQuery({ queryKey: ['stores'], queryFn: () => client.get('/stores').then(r => r.data) })
  const { data: rolesData }  = useQuery({ queryKey: ['roles'],  queryFn: () => client.get('/roles').then(r => r.data) })

  const userCount    = usersData?.data?.length  ?? usersData?.length  ?? '—'
  const storeCount   = storesData?.data?.length ?? storesData?.length ?? '—'
  const roleCount    = rolesData?.data?.length  ?? rolesData?.length  ?? '—'
  const activeStores = storesData?.data?.filter(s => s.status === 'active').length ?? '—'

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 600, color: '#191c1e',
          fontFamily: fonts.headline, margin: 0,
        }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
        </h1>
        <p style={{ color: '#434654', marginTop: 6, fontSize: 14, fontFamily: fonts.body }}>
          Here's a live overview of your StorePrint deployment.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Total Stores"  value={storeCount}   />
        <StatCard label="Active Stores" value={activeStores} />
        <StatCard label="Total Users"   value={userCount}    />
        <StatCard label="Roles"         value={roleCount}    />
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: 8 }}>
        <div style={sectionLabel}>Quick Access</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {QUICK_LINKS.map(link => (
            <QuickCard key={link.path} link={link} onClick={() => navigate(link.path)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickCard({ link, onClick }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
        background: '#ffffff',
        border: '1px solid #c3c6d6',
        borderLeft: `4px solid ${link.accent}`,
        borderRadius: 8, padding: 16, cursor: 'pointer',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.06)',
        textAlign: 'left', fontFamily: fonts.body,
        transition: 'box-shadow 0.15s',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 24, color: link.accent, fontVariationSettings: "'FILL' 1" }}
      >
        {link.icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#191c1e' }}>{link.label}</span>
    </button>
  )
}
