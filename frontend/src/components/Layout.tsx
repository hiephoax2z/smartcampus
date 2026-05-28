import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ACCENT = '#E84525'

/* ── SVG icons ──────────────────────────────────────────────────────────── */

const IcoGrid = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
    <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1.5"/>
    <rect x="9"   y="0.5" width="5.5" height="5.5" rx="1.5"/>
    <rect x="0.5" y="9"   width="5.5" height="5.5" rx="1.5"/>
    <rect x="9"   y="9"   width="5.5" height="5.5" rx="1.5"/>
  </svg>
)

const IcoCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1.5" y="2.5" width="12" height="11" rx="2"/>
    <path d="M1.5 6.5h12M5 1.5v2M10 1.5v2"/>
  </svg>
)

const IcoChart = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 11.5L5 7l3 3 5.5-6.5"/>
  </svg>
)

const IcoBook = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M2 2h4a2 2 0 012 2v9a1.5 1.5 0 00-1.5-1.5H2V2z"/>
    <path d="M13 2H9a2 2 0 00-2 2v9a1.5 1.5 0 011.5-1.5H13V2z"/>
  </svg>
)

const IcoUsers = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="5.5" cy="4.5" r="2.5"/>
    <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/>
    <path d="M10.5 3.5a2.5 2.5 0 010 4.5M14 13c0-2-1.2-3.5-3.5-3.5"/>
  </svg>
)

const IcoUser = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="7.5" cy="5" r="2.5"/>
    <path d="M2 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
  </svg>
)

const IcoBell = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M7.5 1.5A4 4 0 003.5 5.5V9L2 11h11L11.5 9V5.5A4 4 0 007.5 1.5z"/>
    <path d="M6 11.5a1.5 1.5 0 003 0"/>
  </svg>
)

const IcoCheck = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 8l3.5 3.5 6.5-7.5"/>
  </svg>
)

const IcoMsg = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 2.5h11a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2V3.5a1 1 0 011-1z"/>
  </svg>
)

const IcoLogout = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 2H3a1 1 0 00-1 1v9a1 1 0 001 1h2.5"/>
    <path d="M10 5l3.5 2.5L10 10M13.5 7.5H5.5"/>
  </svg>
)

const IcoSearch = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="5.5" cy="5.5" r="4"/>
    <path d="M9 9l2.5 2.5"/>
  </svg>
)

/* ── Nav structure ──────────────────────────────────────────────────────── */

interface NavItem {
  to: string
  label: string
  icon: JSX.Element
  badge?: boolean
  roles: string[]
}

const NAV_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'ESPACE PERSONNEL',
    items: [
      { to: '/dashboard',       label: "Vue d'ensemble", icon: <IcoGrid />,     roles: ['admin', 'enseignant', 'etudiant'] },
      { to: '/emploi-du-temps', label: 'Emploi du temps', icon: <IcoCalendar />, roles: ['admin', 'enseignant', 'etudiant'] },
      { to: '/notes',           label: 'Notes & relevés',  icon: <IcoChart />,    roles: ['etudiant'] },
      { to: '/cours',           label: 'Mes cours',         icon: <IcoBook />,     roles: ['admin', 'enseignant', 'etudiant'] },
      { to: '/mes-presences',   label: 'Présences',         icon: <IcoCheck />,    roles: ['etudiant'] },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { to: '/etudiants',   label: 'Étudiants',   icon: <IcoUsers />, roles: ['admin'] },
      { to: '/enseignants', label: 'Enseignants',  icon: <IcoUser />,  roles: ['admin'] },
    ],
  },
  {
    label: 'COMMUNAUTÉ',
    items: [
      { to: '/presences',     label: 'Présences',        icon: <IcoCheck />, roles: ['admin', 'enseignant'] },
      { to: '/saisie-notes',  label: 'Saisir les notes', icon: <IcoChart />, roles: ['enseignant'] },
      { to: '/messagerie',    label: 'Messagerie',       icon: <IcoMsg />,   roles: ['admin', 'enseignant', 'etudiant'] },
      { to: '/notifications', label: 'Notifications',    icon: <IcoBell />,  badge: true, roles: ['admin', 'enseignant', 'etudiant'] },
    ],
  },
]

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':       "Vue d'ensemble",
  '/emploi-du-temps': 'Emploi du temps',
  '/notes':           'Notes & relevés',
  '/cours':           'Mes cours',
  '/presences':       'Présences',
  '/notifications':   'Notifications',
  '/profil':          'Mon profil',
  '/etudiants':       'Étudiants',
  '/enseignants':     'Enseignants',
  '/saisie-notes':    'Saisir les notes',
  '/messagerie':      'Messagerie',
  '/mes-presences':   'Présences',
}

/* ── Layout ─────────────────────────────────────────────────────────────── */

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const { data: notifData } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => api.get('/notifications/unread').then(r => r.data as { unread: number }),
    refetchInterval: 30_000,
    enabled: !!user,
  })
  const unread = notifData?.unread ?? 0

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials    = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()
  const currentPage = PAGE_LABELS[location.pathname] ?? ''

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0e0e' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col sticky top-0 h-screen"
        style={{ background: '#0a0a0a', borderRight: '1px solid #181818' }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid #161616' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
              style={{ background: ACCENT }}
            >P</div>
            <div>
              <p className="text-white text-xs font-bold tracking-[0.18em]">POLYNUM</p>
              <p className="text-xs tracking-[0.12em]" style={{ color: '#444' }}>SMART CAMPUS</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(
              item => user?.role && item.roles.includes(user.role)
            )
            if (visible.length === 0) return null
            return (
              <div key={section.label}>
                <p
                  className="text-xs font-semibold tracking-[0.18em] mb-1.5 px-2"
                  style={{ color: '#333' }}
                >
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {visible.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-[#1a1a1a] text-white'
                            : 'text-[#666] hover:text-[#ccc] hover:bg-[#111]'
                        }`
                      }
                    >
                      <span className="w-4 flex-shrink-0 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && unread > 0 && (
                        <span
                          className="text-white flex items-center justify-center flex-shrink-0 rounded-full"
                          style={{
                            background: ACCENT,
                            width: 18, height: 18,
                            fontSize: 10, fontWeight: 700,
                          }}
                        >
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid #161616' }}>
          <NavLink
            to="/profil"
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition hover:bg-[#111]"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs capitalize" style={{ color: '#444' }}>{user?.role}</p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition mt-0.5 text-[#555] hover:text-[#ff6b6b] hover:bg-[rgba(255,80,80,0.05)]"
          >
            <span className="w-4 flex-shrink-0 flex items-center justify-center"><IcoLogout /></span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top header */}
        <header
          className="flex items-center justify-between px-6 h-12 flex-shrink-0 sticky top-0 z-10"
          style={{ background: '#0a0a0a', borderBottom: '1px solid #181818' }}
        >
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: '#3a3a3a' }}>POLYNUM</span>
            <span style={{ color: '#252525' }}>›</span>
            <span style={{ color: '#666' }}>{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-default"
              style={{ background: '#141414', border: '1px solid #1f1f1f', color: '#444' }}
            >
              <IcoSearch />
              <span className="text-xs">Rechercher…</span>
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-[#1a1a1a]"
              style={{ background: '#141414', border: '1px solid #1f1f1f', color: '#555' }}
            >
              <IcoBell />
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: ACCENT, fontSize: 9, fontWeight: 700 }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#f4f4f5' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
