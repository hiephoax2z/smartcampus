import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface Notif {
  id: number
  titre: string
  message: string
  type: string
  lu: number
  created_at: string
}

const TYPE_COLORS: Record<string, { border: string; bg: string; icon: string }> = {
  note:            { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  icon: '📝' },
  absence:         { border: '#ef4444', bg: 'rgba(239,68,68,0.08)',   icon: '⚠' },
  cours:           { border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  icon: '📚' },
  emploi_du_temps: { border: '#10b981', bg: 'rgba(16,185,129,0.08)',  icon: '📅' },
  general:         { border: '#555',    bg: 'rgba(255,255,255,0.02)', icon: '🔔' },
}

function formatDate(d: string) {
  const date = new Date(d)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60)   return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ notifications: Notif[]; unread: number }>({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications').then(r => r.data),
  })

  const { mutate: markRead } = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notif-unread'] })
      toast.success('Toutes les notifications lues')
    },
  })

  const notifs = data?.notifications ?? []
  const unread = data?.unread ?? 0

  if (isLoading) {
    return (
      <div style={{ background: '#111111', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555', fontSize: 13 }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>INBOX</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
                Notifi<span style={{ color: ACCENT, fontStyle: 'italic' }}>cations.</span>
              </h1>
              {unread > 0 && (
                <span style={{
                  background: ACCENT, color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 9px', borderRadius: 20,
                }}>
                  {unread}
                </span>
              )}
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAll()}
              style={{
                fontSize: 12, color: '#666', background: '#161616',
                border: '1px solid #222', borderRadius: 8,
                padding: '6px 14px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ccc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#666')}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Empty state */}
        {notifs.length === 0 ? (
          <div style={{
            background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: 16, padding: '4rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>🔔</div>
            <p style={{ color: '#444', fontSize: 14 }}>Aucune notification</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifs.map(n => {
              const meta = TYPE_COLORS[n.type] ?? TYPE_COLORS.general
              const isUnread = !n.lu
              return (
                <div
                  key={n.id}
                  onClick={() => isUnread && markRead(n.id)}
                  style={{
                    background: isUnread ? meta.bg : '#141414',
                    border: `1px solid ${isUnread ? meta.border + '44' : '#1c1c1c'}`,
                    borderLeft: `3px solid ${isUnread ? meta.border : '#222'}`,
                    borderRadius: 12,
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    cursor: isUnread ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    opacity: isUnread ? 1 : 0.65,
                  }}
                  onMouseEnter={e => { if (isUnread) e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={e => { if (isUnread) e.currentTarget.style.opacity = '1' }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.4 }}>
                    {meta.icon}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                      <p style={{
                        color: isUnread ? '#fff' : '#888',
                        fontSize: 13, fontWeight: isUnread ? 600 : 500,
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {n.titre}
                      </p>
                      {isUnread && (
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: meta.border, flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <p style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ color: '#333', fontSize: 11, marginTop: 6 }}>{formatDate(n.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
