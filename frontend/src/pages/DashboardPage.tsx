GIT_AUTHOR_DATE="2026-04-17T14:30:00" GIT_COMMITTER_DATE="2026-04-17T14:30:00" git commit -m "feat: build admin dashboard"
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin')      return <DashboardAdmin />
  if (user.role === 'enseignant') return <DashboardEnseignant />
  return <DashboardEtudiant />
}

interface CoursPopulaire { code: string; nom: string; capacite_max: number; nb_inscrits: number; taux_remplissage: number }
interface DernierInscrit { nom: string; prenom: string; filiere: string; niveau: string; numero_etudiant: string; created_at: string }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function CoursBarChart({ cours }: { cours: CoursPopulaire[] }) {
  if (!cours || cours.length === 0) return <p style={{ color: '#444', fontSize: 13 }}>Aucune donnée.</p>
  const maxVal = Math.max(...cours.map(c => c.nb_inscrits), 1)
  const W = 460, H = 120, pad = 40, barW = Math.floor((W - pad * 2) / cours.length) - 6
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ overflow: 'visible' }}>
      {cours.map((c, i) => {
        const barH = Math.max(4, Math.round((c.nb_inscrits / maxVal) * H))
        const x    = pad + i * ((W - pad * 2) / cours.length) + 3
        const y    = H - barH
        const pct  = c.taux_remplissage
        const col  = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#4ade80'
        return (
          <g key={c.code}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={col} opacity={0.8} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill="#666" fontSize={9}>{c.nb_inscrits}</text>
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fill="#555" fontSize={9}>{c.code}</text>
          </g>
        )
      })}
      <line x1={pad - 4} y1={0} x2={pad - 4} y2={H} stroke="#1f1f1f" strokeWidth={1} />
      <line x1={pad - 4} y1={H} x2={W - pad + 4} y2={H} stroke="#1f1f1f" strokeWidth={1} />
    </svg>
  )
}

function DashboardAdmin() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => api.get('/dashboard/admin').then(r => r.data),
  })

  if (isLoading) return (
    <div style={{ background: '#111111', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#555', fontSize: 13 }}>Chargement…</p>
    </div>
  )

  const { stats, coursPopulaires = [], derniersInscrits = [] } = data ?? {}
  const card: React.CSSProperties = { background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem', maxWidth: 1400 }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>PILOTAGE</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem,4vw,3rem)', color: '#fff', lineHeight: 1.1, fontWeight: 700 }}>
            Pilotage <span style={{ color: ACCENT, fontStyle: 'italic' }}>académique.</span>
          </h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>Vue d'ensemble · {user?.prenom} {user?.nom}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'ÉTUDIANTS INSCRITS', val: stats?.total_etudiants,   color: '#3b82f6' },
            { label: 'ENSEIGNANTS',         val: stats?.total_enseignants,  color: '#8b5cf6' },
            { label: 'COURS ACTIFS',         val: stats?.total_cours_actifs, color: '#10b981' },
            { label: 'INSCRIPTIONS',         val: stats?.total_inscriptions, color: '#fbbf24' },
            { label: 'NOTES SAISIES',        val: stats?.total_notes,        color: '#fff' },
            { label: 'ABSENCES',             val: stats?.total_absences,     color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={card}>
              <p style={{ color: '#444', fontSize: 10, letterSpacing: '0.12em', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.val ?? '—'}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Occupation des cours</p>
                <div style={{ display: 'flex', gap: '0.875rem' }}>
                  {[{ col: '#4ade80', label: '< 70%' }, { col: '#fbbf24', label: '70–90%' }, { col: '#f87171', label: '> 90%' }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: l.col }} />
                      <span style={{ color: '#444', fontSize: 10 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <CoursBarChart cours={coursPopulaires} />
            </div>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid #1e1e1e' }}>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Cours les plus remplis</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 80px', padding: '8px 1.5rem', borderBottom: '1px solid #191919', gap: 8 }}>
                {['Code', 'Nom', 'Inscrits', 'Taux', 'Capacité'].map(h => (
                  <span key={h} style={{ color: '#333', fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {(coursPopulaires as CoursPopulaire[]).map((c, i) => {
                const pct = c.taux_remplissage
                const col = pct >= 90 ? '#f87171' : pct >= 70 ? '#fbbf24' : '#4ade80'
                return (
                  <div key={c.code} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 80px', padding: '12px 1.5rem', alignItems: 'center', gap: 8, borderBottom: i < coursPopulaires.length - 1 ? '1px solid #191919' : 'none' }}>
                    <span style={{ color: ACCENT, fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{c.code}</span>
                    <span style={{ color: '#888', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</span>
                    <span style={{ color: '#666', fontSize: 13, fontFamily: 'monospace' }}>{c.nb_inscrits}</span>
                    <div>
                      <div style={{ height: 4, background: '#1f1f1f', borderRadius: 2, marginBottom: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: col, borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <span style={{ color: '#555', fontSize: 12 }}>{c.capacite_max}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={card}>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>Derniers inscrits</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(derniersInscrits as DernierInscrit[]).map((e, i) => {
                const ini = ((e.prenom?.[0] ?? '') + (e.nom?.[0] ?? '')).toUpperCase()
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '8px 10px', borderRadius: 10, background: '#111', border: '1px solid #1a1a1a' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: ACCENT + '22', border: `1px solid ${ACCENT}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ACCENT }}>{ini}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#ccc', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.prenom} {e.nom}</p>
                      <p style={{ color: '#444', fontSize: 11 }}>{e.filiere} · {e.niveau}</p>
                    </div>
                    <span style={{ color: '#333', fontSize: 10, flexShrink: 0 }}>{formatDate(e.created_at)}</span>
                  </div>
                )
              })}
              {derniersInscrits.length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Aucune inscription récente.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardEnseignant() {
  return <div>Enseignant</div>
}

function DashboardEtudiant() {
  return <div>Etudiant</div>
}
