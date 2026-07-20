import React from 'react'
import { colors, shadow } from '../../theme'
import PageHeader from '../../components/PageHeader'

const SERVICE_LINKS = [
  {
    key: 'minio',
    title: 'Storage (MinIO)',
    icon: '🗄️',
    description:
      'Self-hosted S3-compatible object storage for all media assets — product images, audit photos, training videos, and documents. Data stays entirely on your infrastructure.',
    port: 9001,
    linkLabel: 'Open MinIO Console',
    note: 'Default bucket: storeprint-media',
  },
  {
    key: 'meili',
    title: 'Search (Meilisearch)',
    icon: '🔍',
    description:
      'Full-text search engine powering instant search across products, stores, users, and audit records. Indexes are rebuilt automatically on data changes.',
    port: 7700,
    linkLabel: 'Open Meilisearch Dashboard',
    note: 'Master key configured via MEILI_MASTER_KEY env var.',
  },
  {
    key: 'ntfy',
    title: 'Notifications (Ntfy)',
    icon: '🔔',
    description:
      'Self-hosted push notification broker for real-time alerts to mobile apps and browsers. No third-party cloud required.',
    port: 8088,
    linkLabel: 'Open Ntfy Web UI',
    note: 'Topic prefix: storeprint/',
  },
  {
    key: 'keycloak',
    title: 'SSO / Identity (Keycloak)',
    icon: '🔐',
    description:
      'Enterprise SSO and identity provider. Manage users, roles, and OAuth2 / OIDC authentication flows from one central place.',
    port: 8080,
    linkLabel: 'Open Keycloak Admin',
    note: 'Realm: storeprint',
  },
]

const origin = () => {
  try { return window.location.origin } catch { return 'http://localhost' }
}

export default function Settings() {
  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    section: {
      background: colors.white,
      borderRadius: 12,
      padding: '24px 28px',
      boxShadow: shadow.sm,
      border: `1px solid ${colors.border}`,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 800,
      color: colors.dark,
      marginBottom: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    sectionDesc: {
      fontSize: 13,
      color: colors.midGrey,
      marginBottom: 16,
      lineHeight: 1.6,
    },
    row: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: { fontSize: 12, fontWeight: 700, color: colors.midGrey, minWidth: 120 },
    value: {
      fontSize: 13,
      color: colors.dark,
      fontFamily: 'monospace',
      background: colors.background,
      padding: '4px 10px',
      borderRadius: 6,
      border: `1px solid ${colors.border}`,
    },
    note: { fontSize: 12, color: colors.lightGrey, marginTop: 6 },
    link: {
      display: 'inline-block',
      marginTop: 12,
      fontSize: 13,
      fontWeight: 600,
      color: colors.primary,
      textDecoration: 'none',
      padding: '7px 14px',
      border: `1.5px solid ${colors.primary}`,
      borderRadius: 8,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: 20,
      marginBottom: 20,
    },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="System Settings"
        onBack={false}
      />

      {/* API & Services */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>⚙️</span> API &amp; Services
        </div>
        <div style={s.sectionDesc}>
          Core API configuration for the StorePrint platform.
        </div>
        <div style={s.row}>
          <span style={s.label}>API Base URL</span>
          <span style={s.value}>{origin()}/api</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Version</span>
          <span style={s.value}>1.0.0</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Admin Panel</span>
          <span style={s.value}>{origin()}/admin</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Mobile App</span>
          <span style={s.value}>Port 8081 (Expo / React Native)</span>
        </div>
      </div>

      {/* Infrastructure Services grid */}
      <div style={s.grid}>
        {SERVICE_LINKS.map((svc) => {
          const href = `${origin().replace(/:\d+$/, '')}:${svc.port}`
          return (
            <div key={svc.key} style={s.section}>
              <div style={s.sectionTitle}>
                <span>{svc.icon}</span> {svc.title}
              </div>
              <div style={s.sectionDesc}>{svc.description}</div>
              <div style={s.row}>
                <span style={s.label}>Default Port</span>
                <span style={s.value}>{svc.port}</span>
              </div>
              {svc.note && <div style={s.note}>{svc.note}</div>}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={s.link}
              >
                {svc.linkLabel} ↗
              </a>
            </div>
          )
        })}
      </div>

      {/* Mobile App info */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <span>📱</span> Mobile App
        </div>
        <div style={s.sectionDesc}>
          The StorePrint mobile app is built with React Native (Expo). It connects to the same
          API server and is served on port 8081 during development. Production builds are
          distributed as APK / IPA files or via MDM.
        </div>
        <div style={s.row}>
          <span style={s.label}>Dev Server</span>
          <span style={s.value}>{origin().replace(/:\d+$/, '')}:8081</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Admin Panel</span>
          <span style={s.value}>{origin()}/admin</span>
        </div>
        <div style={s.note}>
          All services run on the same host. Adjust ports in your .env / docker-compose.yml as
          needed.
        </div>
      </div>
    </div>
  )
}
