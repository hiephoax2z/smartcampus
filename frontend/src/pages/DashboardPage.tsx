import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ACCENT  = '#E84525'
const SERIF   = "'Playfair Display', Georgia, serif"

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin')      return <DashboardAdmin />
  if (user.role === 'enseignant') return <DashboardEnseignant />
  return <DashboardEtudiant />
}

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN — dark premium
═══════════════════════════════════════════════════════════════════════════ */

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

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>PILOTAGE</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem,4vw,3rem)', color: '#fff', lineHeight: 1.1, fontWeight: 700 }}>
            Pilotage <span style={{ color: ACCENT, fontStyle: 'italic' }}>académique.</span>
          </h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>
            Vue d'ensemble · {user?.prenom} {user?.nom}
          </p>
        </div>

        {/* Stats cards */}
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

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>

          {/* Left — chart + cours table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Bar chart */}
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

            {/* Cours table */}
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

          {/* Right — activity feed */}
          <div style={card}>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>Derniers inscrits</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(derniersInscrits as DernierInscrit[]).map((e, i) => {
                const ini = ((e.prenom?.[0] ?? '') + (e.nom?.[0] ?? '')).toUpperCase()
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '8px 10px', borderRadius: 10, background: '#111', border: '1px solid #1a1a1a' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: ACCENT + '22', border: `1px solid ${ACCENT}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ACCENT }}>
                      {ini}
                    </div>
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

/* ═══════════════════════════════════════════════════════════════════════════
   ENSEIGNANT — dark premium
═══════════════════════════════════════════════════════════════════════════ */

interface NotesStat {
  id: number; code: string; nom: string
  moyenne_classe: number | null; nb_notes_saisies: number
  nb_evaluations: number; nb_inscrits: number
}
interface EtudiantRisque {
  nom: string; prenom: string; numero_etudiant: string
  filiere: string; cours_code: string; cours_id: number; nb_absences: number
}

function MiniSparkline({ avg: rawAvg }: { avg: number | string | null }) {
  if (rawAvg === null || rawAvg === undefined) return <span style={{ color: '#444', fontSize: 11 }}>—</span>
  const avg = parseFloat(String(rawAvg))
  if (isNaN(avg)) return <span style={{ color: '#444', fontSize: 11 }}>—</span>
  const color = avg >= 14 ? '#4ade80' : avg >= 10 ? '#fbbf24' : '#f87171'
  const pts   = [avg - 1.5, avg + 0.8, avg - 0.5, avg + 1.2, avg].map(v => Math.max(0, Math.min(20, v)))
  const minP  = Math.min(...pts); const maxP = Math.max(...pts, minP + 1)
  const sy    = (v: number) => 20 - ((v - minP) / (maxP - minP)) * 20
  const points = pts.map((v, i) => `${(i / 4) * 60},${sy(v)}`).join(' ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <svg width="60" height="24" viewBox="0 0 60 24" style={{ overflow: 'visible' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </svg>
      <span style={{ color, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
        {avg.toFixed(1)}<span style={{ color: '#555', fontSize: 11, fontWeight: 400 }}>/20</span>
      </span>
    </div>
  )
}

function RiskBadge({ count }: { count: number }) {
  if (count >= 4) return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>ABSENT &gt; 3</span>
  if (count >= 2) return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>RETARD ×{count}</span>
  return null
}

function DashboardEnseignant() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-enseignant'],
    queryFn: () => api.get('/dashboard/enseignant').then(r => r.data),
  })

  const { data: notifData } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => api.get('/notifications/unread').then(r => r.data as { unread: number }),
    refetchInterval: 30_000,
    enabled: !!user,
  })

  if (isLoading) return (
    <div style={{ background: '#111111', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
      <p style={{ color: '#555', fontSize: 13 }}>Chargement…</p>
    </div>
  )

  const {
    cours = [], evaluationsAVenir = [], prochainesSeances = [],
    notesStats = [], notesASaisirTotal = 0, etudiantsARisque = [],
  } = data ?? {}

  const totalEtudiants  = cours.reduce((s: number, c: CoursEnseignant) => s + (c.nb_inscrits || 0), 0)
  const unread          = notifData?.unread ?? 0

  // Today
  const jourIdx      = new Date().getDay()
  const JOURS_FR     = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
  const todaySessions: Seance[] = prochainesSeances.filter((s: Seance) => s.jour_semaine === JOURS_FR[jourIdx])

  // Most urgent evaluation (most copies remaining)
  const urgentEval: EvaluationAVenir | null = evaluationsAVenir.reduce(
    (max: EvaluationAVenir | null, ev: EvaluationAVenir) => {
      const remaining = ev.nb_inscrits - ev.notes_saisies
      if (!max || remaining > (max.nb_inscrits - max.notes_saisies)) return ev
      return max
    }, null
  )

  const card: React.CSSProperties = {
    background: '#161616', border: '1px solid #1f1f1f',
    borderRadius: 14, padding: '1.25rem 1.5rem',
  }

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem', maxWidth: 1400 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>TABLEAU DE BORD</p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', lineHeight: 1.1, fontWeight: 700 }}>
            Bonjour, <span style={{ color: ACCENT, fontStyle: 'italic' }}>Dr. {user?.nom}.</span>
          </h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>
            Professeur · {cours.length} cours actif{cours.length > 1 ? 's' : ''} · {totalEtudiants} étudiants suivis
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <DarkStatCard label="Cours actifs"      value={String(cours.length)}           unit=" cours" sub="ce semestre" />
          <DarkStatCard label="Notes à saisir"    value={String(notesASaisirTotal)}        sub={`${evaluationsAVenir.length} éval. en attente`} accent={notesASaisirTotal > 0} />
          <DarkStatCard label="Étudiants suivis"  value={String(totalEtudiants)}           sub={`${cours.length} groupes`} />
          <DarkStatCard label="Notifications"     value={String(unread)}                  sub="non lues" />
        </div>

        {/* Alert banner */}
        {urgentEval && (urgentEval.nb_inscrits - urgentEval.notes_saisies) > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.25rem', borderRadius: 12, marginBottom: '1.5rem',
            background: `rgba(232,69,37,0.08)`, border: `1px solid rgba(232,69,37,0.2)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <div>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  Saisie des notes — {urgentEval.cours_code}
                </p>
                <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                  {urgentEval.nom} · {urgentEval.nb_inscrits - urgentEval.notes_saisies} copies restantes
                  {urgentEval.date_evaluation ? ` · avant le ${formatDate(urgentEval.date_evaluation)}` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{ color: '#555', fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid #2a2a2a', cursor: 'pointer' }}>
                Plus tard
              </span>
              <a href="/saisie-notes" style={{
                color: '#fff', fontSize: 12, fontWeight: 600, padding: '5px 14px',
                borderRadius: 8, background: ACCENT, textDecoration: 'none',
              }}>
                Commencer →
              </a>
            </div>
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* MES COURS */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Mes cours</h3>
                <a href="/saisie-notes" style={{ color: ACCENT, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                  Saisir les notes →
                </a>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px', gap: 8, padding: '0 0 8px', borderBottom: '1px solid #1f1f1f' }}>
                {['Cours', 'Inscrits', 'Progression', 'Moyenne'].map((h, i) => (
                  <span key={h} style={{ color: '#444', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, textAlign: i > 0 ? 'right' : 'left' }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {(notesStats as NotesStat[]).map((stat, i) => {
                const pct = stat.nb_evaluations > 0
                  ? Math.round((stat.nb_notes_saisies / (stat.nb_evaluations * stat.nb_inscrits || 1)) * 100)
                  : 0
                return (
                  <div key={stat.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px', gap: 8,
                    padding: '12px 0', alignItems: 'center',
                    borderBottom: i < (notesStats as NotesStat[]).length - 1 ? '1px solid #191919' : 'none',
                  }}>
                    <div>
                      <p style={{ color: ACCENT, fontSize: 10, fontFamily: 'monospace', fontWeight: 700, marginBottom: 2 }}>{stat.code}</p>
                      <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.nom}</p>
                    </div>
                    <span style={{ color: '#666', fontSize: 13, textAlign: 'right' }}>{stat.nb_inscrits}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ height: 4, background: '#1f1f1f', borderRadius: 2, marginBottom: 3 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: '#3b82f6', borderRadius: 2 }} />
                      </div>
                      <span style={{ color: '#555', fontSize: 11 }}>{stat.nb_notes_saisies} / {stat.nb_evaluations * stat.nb_inscrits} notes</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <MiniSparkline avg={stat.moyenne_classe} />
                    </div>
                  </div>
                )
              })}

              {notesStats.length === 0 && (
                <p style={{ color: '#444', fontSize: 13, padding: '12px 0' }}>Aucun cours assigné.</p>
              )}
            </div>

            {/* ÉTUDIANTS À SURVEILLER */}
            {(etudiantsARisque as EtudiantRisque[]).length > 0 && (
              <div style={card}>
                <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>
                  Étudiants à surveiller
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    {(etudiantsARisque as EtudiantRisque[]).length}
                  </span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(etudiantsARisque as EtudiantRisque[]).map((e, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '8px 10px', borderRadius: 10, background: '#111',
                      border: '1px solid #1a1a1a',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: '#1e1e1e', border: '1px solid #2a2a2a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#666', fontSize: 11, fontWeight: 700,
                      }}>
                        {e.prenom[0]}{e.nom[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500 }}>{e.prenom} {e.nom}</p>
                        <p style={{ color: '#555', fontSize: 11 }}>{e.numero_etudiant} · {e.cours_code}</p>
                      </div>
                      <RiskBadge count={e.nb_absences} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Aujourd'hui */}
            <div style={card}>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>
                Aujourd'hui
                <span style={{ marginLeft: 8, color: '#444', fontSize: 12, fontWeight: 400 }}>
                  {todaySessions.length} séance{todaySessions.length !== 1 ? 's' : ''}
                </span>
              </h3>
              {todaySessions.length === 0 ? (
                <p style={{ color: '#444', fontSize: 13 }}>Aucune séance prévue aujourd'hui.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {todaySessions.map((s, i) => {
                    const tc = TYPE_COLORS[s.type] ?? TYPE_COLORS.cours
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '10px 12px', borderRadius: 10,
                        background: '#111', border: '1px solid #1a1a1a',
                      }}>
                        <div style={{ width: 3, height: 36, borderRadius: 2, background: tc.border, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#ccc', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.cours_nom}</p>
                          <p style={{ color: '#555', fontSize: 11 }}>
                            {s.heure_debut.slice(0, 5)} – {s.heure_fin.slice(0, 5)}
                            {s.salle_nom ? ` · ${s.salle_nom}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tc.text, background: tc.bg, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                          {TYPE_LABEL[s.type] ?? s.type}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Évaluations en attente */}
            <div style={card}>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>
                Évaluations en attente
              </h3>
              {evaluationsAVenir.length === 0 ? (
                <p style={{ color: '#444', fontSize: 13 }}>Tout est à jour.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(evaluationsAVenir as EvaluationAVenir[]).slice(0, 6).map((ev) => {
                    const remaining = ev.nb_inscrits - ev.notes_saisies
                    const pct = ev.nb_inscrits > 0 ? Math.round((ev.notes_saisies / ev.nb_inscrits) * 100) : 0
                    return (
                      <div key={ev.id} style={{ padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div>
                            <p style={{ color: '#ccc', fontSize: 12, fontWeight: 600 }}>{ev.nom}</p>
                            <p style={{ color: '#555', fontSize: 11 }}>{ev.cours_code} · {ev.type}</p>
                          </div>
                          {remaining > 0 && (
                            <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>
                              {remaining} restantes
                            </span>
                          )}
                        </div>
                        <div style={{ height: 3, background: '#1f1f1f', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#4ade80' : ACCENT, borderRadius: 2 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ÉTUDIANT — dark premium
═══════════════════════════════════════════════════════════════════════════ */

const TYPE_LABEL: Record<string, string> = {
  cours: 'CM', td: 'TD', tp: 'TP', examen: 'ÉVAL', projet: 'PROJET',
}

const TYPE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  cours:  { border: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd' },
  td:     { border: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', text: '#c4b5fd' },
  tp:     { border: '#10b981', bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7' },
  examen: { border: '#ef4444', bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5' },
  projet: { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fcd34d' },
}

function getSessionStatus(heure_debut: string, heure_fin: string) {
  const now    = new Date()
  const toMin  = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const startM = toMin(heure_debut)
  const endM   = toMin(heure_fin)
  const nowM   = now.getHours() * 60 + now.getMinutes()

  if (nowM >= endM)   return { label: 'TERMINÉ',  color: '#555',    bg: 'rgba(255,255,255,0.03)' }
  if (nowM >= startM) return { label: 'EN COURS', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' }

  const diff = startM - nowM
  const h    = Math.floor(diff / 60)
  const m    = diff % 60
  const label = h > 0
    ? `DANS ${h}H${m > 0 ? String(m).padStart(2, '0') : ''}`
    : `DANS ${m}MIN`
  return { label, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' }
}

function DashboardEtudiant() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-etudiant'],
    queryFn: () => api.get('/dashboard/etudiant').then(r => r.data),
  })

  const { data: notifData } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => api.get('/notifications/unread').then(r => r.data as { unread: number }),
    refetchInterval: 30_000,
    enabled: !!user,
  })

  const { data: notifResponse } = useQuery<{ notifications: EtudNotif[]; unread: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: !!user,
  })
  const notifList: EtudNotif[] = notifResponse?.notifications ?? []

  if (isLoading) return (
    <div style={{ background: '#111111', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
      <p style={{ color: '#555', fontSize: '13px' }}>Chargement…</p>
    </div>
  )

  const { cours = [], notesRecentes = [], prochainesSeances = [], absences = [] } = data ?? {}

  const jourIdx      = new Date().getDay()
  const JOURS_FR     = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
  const todaySessions: Seance[] = prochainesSeances.filter((s: Seance) => s.jour_semaine === JOURS_FR[jourIdx])

  const notesAvecVal: NoteRecente[] = notesRecentes.filter((n: NoteRecente) => n.note !== null)
  const moyenneNum   = notesAvecVal.length > 0
    ? notesAvecVal.reduce((sum: number, n: NoteRecente) => sum + (n.note ?? 0), 0) / notesAvecVal.length
    : null
  const ectsTotal    = cours.reduce((s: number, c: CoursEtudiant) => s + (c.credits || 0), 0)
  const unread       = notifData?.unread ?? 0
  const absencesCount = absences.length
  const totalS        = prochainesSeances.length || 1
  const presencePct   = Math.max(0, Math.round(((totalS - absencesCount) / totalS) * 100))

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '0 0 10px', fontSize: 11,
    color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase',
    fontWeight: 600, borderBottom: '1px solid #1f1f1f',
  }
  const td: React.CSSProperties = {
    padding: '10px 0', fontSize: 13, verticalAlign: 'middle',
    borderBottom: '1px solid #161616', color: '#888',
  }

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem', maxWidth: 1400 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#555', fontSize: '11px', letterSpacing: '0.18em', marginBottom: '8px' }}>
            TABLEAU DE BORD
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', lineHeight: 1.1, fontWeight: 700 }}>
            Bonjour,{' '}
            <span style={{ color: ACCENT, fontStyle: 'italic' }}>{user?.prenom}.</span>
          </h1>
          <p style={{ color: '#555', marginTop: '0.5rem', fontSize: '13px' }}>
            Voici un résumé de votre semaine académique.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <DarkStatCard
            label="Moyenne générale"
            value={moyenneNum !== null ? `${moyenneNum.toFixed(1)}` : '—'}
            unit={moyenneNum !== null ? '/20' : ''}
            sub="ce semestre"
            accent
          />
          <DarkStatCard label="ECTS validés" value={String(ectsTotal)} unit=" cr." sub="crédits obtenus" />
          <DarkStatCard label="Présence" value={`${presencePct}`} unit="%" sub="taux d'assiduité" />
          <DarkStatCard label="Notifications" value={String(unread)} sub="non lues" />
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Aujourd'hui */}
            <DarkPanel title="Aujourd'hui" subtitle={JOURS_FR[jourIdx].charAt(0).toUpperCase() + JOURS_FR[jourIdx].slice(1)}>
              {todaySessions.length === 0 ? (
                <p style={{ color: '#444', fontSize: '13px', padding: '0.75rem 0' }}>
                  Aucune séance prévue aujourd'hui.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {todaySessions.map((s, i) => {
                    const status = getSessionStatus(s.heure_debut, s.heure_fin)
                    const tc     = TYPE_COLORS[s.type] ?? TYPE_COLORS.cours
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.875rem 1rem', borderRadius: 12,
                        background: '#161616', border: '1px solid #1f1f1f',
                      }}>
                        {/* Type badge */}
                        <div style={{
                          width: 4, height: 44, borderRadius: 2,
                          background: tc.border, flexShrink: 0,
                        }} />
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: 2 }}>
                            {s.cours_nom}
                          </p>
                          <p style={{ color: '#666', fontSize: '12px' }}>
                            {s.heure_debut.slice(0, 5)} – {s.heure_fin.slice(0, 5)}
                            {s.salle_nom ? ` · ${s.salle_nom}` : ''}
                          </p>
                        </div>
                        {/* Type pill */}
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                          padding: '2px 8px', borderRadius: 4,
                          background: tc.bg, color: tc.text,
                          border: `1px solid ${tc.border}22`,
                        }}>
                          {TYPE_LABEL[s.type] ?? s.type.toUpperCase()}
                        </span>
                        {/* Status */}
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                          padding: '4px 10px', borderRadius: 20,
                          background: status.bg, color: status.color,
                          flexShrink: 0,
                        }}>
                          {status.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </DarkPanel>

            {/* Notes récentes */}
            <DarkPanel title="Notes récemment publiées">
              {notesRecentes.length === 0 ? (
                <p style={{ color: '#444', fontSize: '13px', padding: '0.75rem 0' }}>Aucune note disponible.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Évaluation</th>
                      <th style={th}>Cours</th>
                      <th style={th}>Type</th>
                      <th style={{ ...th, textAlign: 'right' }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(notesRecentes as NoteRecente[]).map((n, i) => (
                      <tr key={i}>
                        <td style={{ ...td, color: '#ccc', fontWeight: 500 }}>{n.evaluation_nom}</td>
                        <td style={td}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: ACCENT }}>{n.cours_code}</span>
                        </td>
                        <td style={td}>
                          <span style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                            background: '#1a1a1a', color: '#666',
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                          }}>
                            {n.evaluation_type}
                          </span>
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <NoteDisplay note={n.note} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </DarkPanel>
          </div>

          {/* Right — Inbox */}
          <div>
            <DarkPanel title="Boîte de réception" subtitle={`${unread} non lue${unread !== 1 ? 's' : ''}`}>
              {notifList.length === 0 ? (
                <p style={{ color: '#444', fontSize: '13px', padding: '0.75rem 0' }}>Aucune notification.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifList.slice(0, 8).map((n, i) => (
                    <div key={i} style={{
                      padding: '0.75rem',
                      borderRadius: 10,
                      background: n.lu ? 'transparent' : '#161616',
                      border: `1px solid ${n.lu ? '#181818' : '#222'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        {!n.lu && (
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: ACCENT, marginTop: 5, flexShrink: 0,
                          }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: n.lu ? '#555' : '#bbb',
                            fontSize: 13, lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            overflow: 'hidden',
                          }}>
                            {n.message}
                          </p>
                          <p style={{ color: '#3a3a3a', fontSize: 11, marginTop: 4 }}>
                            {formatDate(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DarkPanel>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Dark shared components ─────────────────────────────────────────────── */

function DarkStatCard({ label, value, unit = '', sub, accent = false }: {
  label: string; value: string; unit?: string; sub: string; accent?: boolean
}) {
  return (
    <div style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 14, padding: '1.25rem 1.5rem',
    }}>
      <p style={{ fontSize: 11, color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, marginBottom: 4, fontFamily: 'monospace' }}>
        <span style={{ color: accent ? ACCENT : '#fff' }}>{value}</span>
        {unit && <span style={{ fontSize: '1rem', color: '#555', fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
      </p>
      <p style={{ fontSize: 12, color: '#444' }}>{sub}</p>
    </div>
  )
}

function DarkPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 14, padding: '1.25rem 1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{title}</h3>
        {subtitle && <span style={{ color: '#444', fontSize: 12 }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}

function NoteDisplay({ note }: { note: number | string | null }) {
  if (note === null || note === undefined) return <span style={{ color: '#444' }}>—</span>
  const n = parseFloat(String(note))
  if (isNaN(n)) return <span style={{ color: '#444' }}>—</span>
  const color = n >= 14 ? '#4ade80' : n >= 10 ? '#fbbf24' : '#f87171'
  return (
    <span style={{ color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
      {n.toFixed(1)}<span style={{ color: '#444', fontSize: 11 }}>/20</span>
    </span>
  )
}

/* ── Light shared components (admin / enseignant) ───────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function StatCardLight({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-700',
    violet:  'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}

function TauxBadge({ taux }: { taux: number }) {
  const color = taux >= 90 ? 'text-red-600' : taux >= 70 ? 'text-amber-600' : 'text-emerald-600'
  return <span className={`font-semibold text-xs ${color}`}>{taux}%</span>
}

function CapaciteBadge({ current, max }: { current: number; max: number }) {
  const pct   = Math.round((current / max) * 100)
  const color = pct >= 90 ? 'bg-red-100 text-red-700' : pct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${color}`}>
      {current}/{max}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

function SeanceCardLight({ seance }: { seance: Seance }) {
  const typeColors: Record<string, string> = {
    cours: 'bg-blue-50 text-blue-700', td: 'bg-violet-50 text-violet-700',
    tp: 'bg-emerald-50 text-emerald-700', examen: 'bg-red-50 text-red-700',
  }
  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="capitalize text-xs font-medium text-gray-500">{seance.jour_semaine}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[seance.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {TYPE_LABEL[seance.type] ?? seance.type}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{seance.cours_nom}</p>
      <p className="text-xs text-gray-400">{seance.heure_debut.slice(0, 5)} – {seance.heure_fin.slice(0, 5)}</p>
      {seance.salle_nom && <p className="text-xs text-gray-400">{seance.salle_nom}</p>}
    </div>
  )
}

function EmptyLight({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 py-2">{text}</p>
}

function Spinner() {
  return <p className="p-6 text-gray-400 text-sm">Chargement…</p>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

/* ── Types ──────────────────────────────────────────────────────────────── */

interface CoursPopulaire  { code: string; nom: string; capacite_max: number; nb_inscrits: number; taux_remplissage: number }
interface DernierInscrit  { nom: string; prenom: string; filiere: string; niveau: string; numero_etudiant: string; created_at: string }
interface CoursEnseignant { id: number; code: string; nom: string; niveau: string; semestre: string; nb_inscrits: number; capacite_max: number }
interface CoursEtudiant   { id: number; code: string; nom: string; credits: number; semestre: string }
interface EvaluationAVenir{ id: number; nom: string; type: string; cours_code: string; date_evaluation?: string; notes_saisies: number; nb_inscrits: number }
interface NoteRecente     { evaluation_nom: string; evaluation_type: string; cours_code: string; cours_nom: string; note: number | null; date_saisie: string }
interface Seance          { jour_semaine: string; heure_debut: string; heure_fin: string; type: string; cours_nom: string; cours_code: string; salle_nom?: string; batiment?: string }
interface EtudNotif       { id: number; message: string; lu: boolean; created_at: string }
