import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { colors, shadow, fonts } from '../theme'
import ideasLogo from '../assets/ideas_logo.png'

const NAV = [
  { label: 'Dashboard',           path: '/admin',                 icon: 'dashboard',            end: true },
  { label: 'Stores',              path: '/admin/stores',          icon: 'store' },
  { label: 'Users',               path: '/admin/users',           icon: 'group' },
  { label: 'Roles & Permissions', path: '/admin/roles',           icon: 'admin_panel_settings' },
  { label: 'Brand Hub',           path: '/admin/brand-hub',       icon: 'folder_shared' },
  { label: 'Audit Templates',     path: '/admin/audit-templates', icon: 'assignment' },
  { label: 'Env Checklists',      path: '/admin/env-checklists',  icon: 'fact_check' },
  { label: 'CX Surveys',          path: '/admin/surveys',         icon: 'poll' },
  { label: 'Training Courses',    path: '/admin/courses',         icon: 'school' },
  { label: 'Campaigns',           path: '/admin/campaigns',       icon: 'campaign' },
  { label: 'Visual Merch.',      path: '/admin/vm',              icon: 'image_search' },
  { label: 'Signage',            path: '/admin/signage',         icon: 'signpost' },
  { label: 'Settings',            path: '/admin/settings',        icon: 'settings' },
]

const PAGE_TITLES = {
  '/admin':                 'Dashboard',
  '/admin/stores':          'Stores',
  '/admin/users':           'Users',
  '/admin/roles':           'Roles & Permissions',
  '/admin/brand-hub':       'Brand Hub',
  '/admin/audit-templates': 'Audit Templates',
  '/admin/env-checklists':  'Env Checklists',
  '/admin/surveys':         'CX Surveys',
  '/admin/courses':         'Training Courses',
  '/admin/campaigns':       'Campaigns',
  '/admin/vm':              'Visual Merchandising',
  '/admin/signage':         'Signage',
  '/admin/settings':        'Settings',
}

const s = {
  shell: {
    display: 'flex', height: '100vh', overflow: 'hidden',
    background: '#f8f9fb', fontFamily: fonts.body,
  },
  sidebar: {
    width: 240, background: '#ffffff', display: 'flex', flexDirection: 'column',
    flexShrink: 0, borderRight: '1px solid #c3c6d6',
  },
  brand: {
    padding: '20px 16px 18px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  brandRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  brandName: {
    fontSize: 18, fontWeight: 700, color: '#003d9b',
    fontFamily: fonts.headline,
  },
  brandSub: {
    fontSize: 10, color: '#737685', letterSpacing: '0.08em',
    textTransform: 'uppercase', fontFamily: fonts.body, marginTop: 2,
  },
  nav: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
    color: '#434654', textDecoration: 'none', fontSize: 14,
    fontWeight: 500, cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s',
    fontFamily: fonts.body,
    borderLeft: '4px solid transparent',
  },
  navItemActive: {
    background: '#d4e0f8', color: '#576377',
    borderLeft: '4px solid #003d9b',
    paddingLeft: 12,
  },
  navItemHover: {
    background: '#e7e8ea',
  },
  sidebarFooter: {
    padding: 16, borderTop: '1px solid #c3c6d6', background: '#f3f4f6',
  },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: '#003d9b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#ffffff', fontWeight: 700, fontSize: 13, fontFamily: fonts.label,
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: '#191c1e', fontFamily: fonts.body },
  userRole: { fontSize: 11, color: '#737685', fontFamily: fonts.body },
  logoutBtn: {
    width: '100%', padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #c3c6d6',
    borderRadius: 8, color: '#434654',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    textAlign: 'center', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    fontFamily: fonts.body, transition: 'border-color 0.12s, color 0.12s',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: {
    height: 56, background: '#ffffff', borderBottom: '1px solid #c3c6d6',
    display: 'flex', alignItems: 'center', padding: '0 24px',
    justifyContent: 'space-between', flexShrink: 0,
  },
  topTitle: {
    fontSize: 28, fontWeight: 700, color: '#191c1e',
    fontFamily: fonts.headline,
  },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  notifBtn: {
    width: 40, height: 40, borderRadius: '50%', border: 'none',
    background: 'transparent', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#434654',
    transition: 'background 0.12s',
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#003d9b', color: '#ffffff',
    border: 'none', borderRadius: 8, padding: '8px 16px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: fonts.body, transition: 'background 0.12s',
  },
  content: { flex: 1, overflowY: 'auto', padding: 28 },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [hoveredPath, setHoveredPath] = useState(null)
  const [notifHover, setNotifHover] = useState(false)
  const [addHover, setAddHover] = useState(false)

  function handleLogout() { logout(); navigate('/admin/login') }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A'

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard'

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        {/* Logo area */}
        <div style={s.brand}>
          <div style={s.brandRow}>
            <img src={ideasLogo} alt="Ideas" style={{ height: 32, maxWidth: 80, objectFit: 'contain' }} />
            <div>
              <div style={s.brandName}>StorePrint</div>
              <div style={s.brandSub}>Admin Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                ...s.navItem,
                ...(isActive ? s.navItemActive : {}),
                ...(hoveredPath === item.path && !isActive ? s.navItemHover : {}),
              })}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, flexShrink: 0 }}
              >
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={s.sidebarFooter}>
          <div style={s.userRow}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <div style={s.userName}>{user?.name || 'Admin'}</div>
              <div style={s.userRole}>{user?.role_name || 'Administrator'}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.topbar}>
          <span style={s.topTitle}>{pageTitle}</span>
          <div style={s.topRight}>
            <button
              style={{
                ...s.notifBtn,
                background: notifHover ? '#e7e8ea' : 'transparent',
              }}
              onMouseEnter={() => setNotifHover(true)}
              onMouseLeave={() => setNotifHover(false)}
              title="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
            </button>
            <button
              style={{
                ...s.addBtn,
                background: addHover ? '#0052cc' : '#003d9b',
              }}
              onMouseEnter={() => setAddHover(true)}
              onMouseLeave={() => setAddHover(false)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Add New
            </button>
          </div>
        </div>
        <div style={s.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
