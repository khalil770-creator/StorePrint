import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../../api/client'
import { colors, shadow } from '../../theme'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'

function getData(res) {
  return res?.data?.data ?? res?.data ?? []
}

const CATEGORY_COLORS = {
  compliance: { bg: '#FEE2E2', color: '#991B1B' },
  sales: { bg: '#D1FAE5', color: '#065F46' },
  operations: { bg: '#DBEAFE', color: '#1E40AF' },
  product: { bg: '#EDE9FE', color: '#5B21B6' },
  safety: { bg: '#FEF3C7', color: '#92400E' },
}

function CategoryChip({ category }) {
  const style = CATEGORY_COLORS[category?.toLowerCase()] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: style.bg,
      color: style.color,
      textTransform: 'capitalize',
    }}>
      {category || 'Uncategorised'}
    </span>
  )
}

export default function CoursesList() {
  const navigate = useNavigate()

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ['training-courses'],
    queryFn: () => client.get('/training/courses'),
  })

  const courses = Array.isArray(getData(raw)) ? getData(raw) : []

  const s = {
    page: { padding: '32px 40px', background: colors.background, minHeight: '100vh' },
    createBtn: {
      padding: '9px 18px',
      background: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 16,
    },
    card: {
      background: colors.white,
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: shadow.sm,
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    name: { fontSize: 15, fontWeight: 800, color: colors.dark, flex: 1 },
    metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
    meta: { fontSize: 12, color: colors.midGrey },
    passMark: {
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: colors.primaryBg,
      color: colors.primary,
    },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    editBtn: {
      padding: '6px 14px',
      background: colors.primaryBg,
      color: colors.primary,
      border: `1.5px solid ${colors.primary}`,
      borderRadius: 7,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
    },
    empty: {
      textAlign: 'center',
      padding: '72px 0',
      color: colors.lightGrey,
      fontSize: 14,
    },
    errorText: { color: colors.error, fontSize: 13, padding: '16px 0' },
    loadText: { color: colors.midGrey, fontSize: 13, padding: '16px 0' },
  }

  return (
    <div style={s.page}>
      <PageHeader
        title="Training Courses"
        subtitle="Manage staff training content"
        onBack={false}
        actions={
          <button
            style={s.createBtn}
            onClick={() => navigate('/admin/courses/new')}
          >
            + New Course
          </button>
        }
      />

      {isLoading && <div style={s.loadText}>Loading courses…</div>}
      {error && <div style={s.errorText}>Failed to load training courses.</div>}

      {!isLoading && !error && courses.length === 0 && (
        <div style={s.empty}>
          No training courses yet.<br />
          Click <strong>+ New Course</strong> to create one.
        </div>
      )}

      {courses.length > 0 && (
        <div style={s.grid}>
          {courses.map((c) => (
            <div key={c.id ?? c._id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.name}>{c.title}</div>
                <Badge status={c.status} label={c.status} />
              </div>
              {c.description && <div style={s.meta}>{c.description}</div>}
              <div style={s.metaRow}>
                {c.category && <CategoryChip category={c.category} />}
                {c.pass_mark != null && (
                  <span style={s.passMark}>Pass: {c.pass_mark}%</span>
                )}
                {c.duration_minutes != null && (
                  <span style={s.meta}>{c.duration_minutes} min</span>
                )}
              </div>
              <div style={s.meta}>
                {(c.modules?.length ?? c.module_count ?? 0)} module
                {(c.modules?.length ?? c.module_count ?? 0) === 1 ? '' : 's'}
              </div>
              <div style={s.footer}>
                <span style={s.meta}>
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                </span>
                <button
                  style={s.editBtn}
                  onClick={() => navigate(`/admin/courses/${c.id ?? c._id}`)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
