import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow, fonts } from '../../theme'
import PageHeader from '../../components/PageHeader'

const SERVICE_LINKS = [
  { key: 'minio',     title: 'Storage (MinIO)',        icon: '🗄️', description: 'Self-hosted S3-compatible object storage for all media assets.', port: 9001, linkLabel: 'Open MinIO Console',        note: 'Default bucket: storeprint-media' },
  { key: 'meili',     title: 'Search (Meilisearch)',   icon: '🔍', description: 'Full-text search engine powering instant search across all records.', port: 7700, linkLabel: 'Open Meilisearch Dashboard', note: 'Master key configured via MEILI_MASTER_KEY env var.' },
  { key: 'ntfy',      title: 'Notifications (Ntfy)',   icon: '🔔', description: 'Self-hosted push notification broker for real-time alerts.', port: 8088, linkLabel: 'Open Ntfy Web UI',           note: 'Topic prefix: storeprint/' },
  { key: 'keycloak',  title: 'SSO / Identity (Keycloak)', icon: '🔐', description: 'Enterprise SSO and identity provider for OAuth2 / OIDC flows.', port: 8080, linkLabel: 'Open Keycloak Admin',       note: 'Realm: storeprint' },
]

const origin = () => { try { return window.location.origin } catch { return 'http://localhost' } }

function getData(res) { return res?.data?.data ?? res?.data ?? null }

export default function Settings() {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { data: raw, isLoading } = useQuery({
    queryKey: ['brand'],
    queryFn: () => client.get('/brand'),
    onSuccess: (res) => {
      const b = getData(res)
      if (b && !form) setForm({ name: b.name || '', app_name: b.app_name || '', primary_color: b.primary_color || '#10b981', secondary_color: b.secondary_color || '#003d9b' })
    },
  })
  const brand = getData(raw)

  // Sync form when brand loads
  React.useEffect(() => {
    if (brand && !form) {
      setForm({ name: brand.name || '', app_name: brand.app_name || '', primary_color: brand.primary_color || '#10b981', secondary_color: brand.secondary_color || '#003d9b' })
    }
  }, [brand])

  const updateMutation = useMutation({
    mutationFn: (data) => client.put('/brand', data),
    onSuccess: () => { qc.invalidateQueries(['brand']); setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      await client.post('/brand/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      qc.invalidateQueries(['brand'])
    } finally { setUploading(false) }
  }

  const s = {
    page:         { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    card:         { background: colors.white, borderRadius: 12, padding: '24px 28px', boxShadow: shadow.sm, border: `1px solid ${colors.border}`, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 800, color: colors.dark, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 },
    sectionDesc:  { fontSize: 13, color: colors.midGrey, marginBottom: 20, lineHeight: 1.6 },
    grid2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    label:        { fontSize: 12, fontWeight: 700, color: colors.midGrey, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' },
    input:        { width: '100%', padding: '10px 12px', fontSize: 14, border: `1.5px solid ${colors.border}`, borderRadius: 8, outline: 'none', color: colors.dark, boxSizing: 'border-box' },
    row:          { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 },
    monoVal:      { fontSize: 13, color: colors.dark, fontFamily: 'monospace', background: colors.background, padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.border}` },
    note:         { fontSize: 12, color: colors.lightGrey, marginTop: 6 },
    link:         { display: 'inline-block', marginTop: 12, fontSize: 13, fontWeight: 600, color: colors.primary, textDecoration: 'none', padding: '7px 14px', border: `1.5px solid ${colors.primary}`, borderRadius: 8 },
    grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 20 },
    saveBtn:      { marginTop: 20, padding: '10px 28px', background: colors.primary, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    logoBox:      { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 },
    logoImg:      { width: 100, height: 100, objectFit: 'contain', borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.background, padding: 8 },
    logoPlaceholder: { width: 100, height: 100, borderRadius: 12, border: `2px dashed ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: colors.background },
    uploadBtn:    { padding: '8px 18px', border: `1.5px solid ${colors.primary}`, borderRadius: 8, color: colors.primary, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'transparent' },
  }

  return (
    <div style={s.page}>
      <PageHeader title="System Settings" onBack={false} />

      {/* ── Brand Identity ── */}
      <div style={s.card}>
        <div style={s.sectionTitle}>🏢 Brand Identity</div>
        <div style={s.sectionDesc}>Configure your company name, logo, and brand colors. These appear in the mobile app and admin portal.</div>

        {/* Logo */}
        <label style={s.label}>Company Logo</label>
        <div style={s.logoBox}>
          {brand?.logo_url
            ? <img src={brand.logo_url} alt="Logo" style={s.logoImg} />
            : <div style={s.logoPlaceholder}>🏢</div>
          }
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <button style={s.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : brand?.logo_url ? '🔄 Replace Logo' : '⬆ Upload Logo'}
            </button>
            <div style={s.note}>PNG or JPG, max 5MB. Displayed in mobile app header and login screen.</div>
          </div>
        </div>

        {/* Name fields */}
        {form && (
          <>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Company Name</label>
                <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ideas" />
              </div>
              <div>
                <label style={s.label}>App Name</label>
                <input style={s.input} value={form.app_name} onChange={e => setForm(f => ({ ...f, app_name: e.target.value }))} placeholder="e.g. StorePrint" />
              </div>
            </div>

            <div style={{ ...s.grid2, marginTop: 16 }}>
              <div>
                <label style={s.label}>Primary Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} style={{ width: 44, height: 36, borderRadius: 6, border: `1.5px solid ${colors.border}`, cursor: 'pointer', padding: 2 }} />
                  <input style={{ ...s.input, width: 120 }} value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={s.label}>Secondary Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={form.secondary_color} onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))} style={{ width: 44, height: 36, borderRadius: 6, border: `1.5px solid ${colors.border}`, cursor: 'pointer', padding: 2 }} />
                  <input style={{ ...s.input, width: 120 }} value={form.secondary_color} onChange={e => setForm(f => ({ ...f, secondary_color: e.target.value }))} />
                </div>
              </div>
            </div>

            <button style={{ ...s.saveBtn, background: saved ? colors.success : colors.primary }} onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </>
        )}
      </div>

      {/* ── API & Services ── */}
      <div style={s.card}>
        <div style={s.sectionTitle}>⚙️ API &amp; Services</div>
        <div style={s.sectionDesc}>Core API configuration for the StorePrint platform.</div>
        <div style={s.row}><span style={{ fontSize: 12, fontWeight: 700, color: colors.midGrey, minWidth: 120 }}>API Base URL</span><span style={s.monoVal}>{origin()}/api</span></div>
        <div style={s.row}><span style={{ fontSize: 12, fontWeight: 700, color: colors.midGrey, minWidth: 120 }}>Version</span><span style={s.monoVal}>1.0.0</span></div>
        <div style={s.row}><span style={{ fontSize: 12, fontWeight: 700, color: colors.midGrey, minWidth: 120 }}>Admin Panel</span><span style={s.monoVal}>{origin()}/admin</span></div>
      </div>

      {/* ── Infrastructure ── */}
      <div style={s.grid}>
        {SERVICE_LINKS.map((svc) => {
          const href = `${origin().replace(/:\d+$/, '')}:${svc.port}`
          return (
            <div key={svc.key} style={s.card}>
              <div style={s.sectionTitle}><span>{svc.icon}</span> {svc.title}</div>
              <div style={s.sectionDesc}>{svc.description}</div>
              <div style={s.row}><span style={{ fontSize: 12, fontWeight: 700, color: colors.midGrey, minWidth: 120 }}>Default Port</span><span style={s.monoVal}>{svc.port}</span></div>
              {svc.note && <div style={s.note}>{svc.note}</div>}
              <a href={href} target="_blank" rel="noopener noreferrer" style={s.link}>{svc.linkLabel} ↗</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
