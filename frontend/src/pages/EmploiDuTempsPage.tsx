import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'] as const

const TYPE_META: Record<string, { label: string; border: string; bg: string; text: string; chip: string }> = {
  cours:  { label: 'CM',         border: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', chip: 'rgba(59,130,246,0.12)' },
  td:     { label: 'TD',         border: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', chip: 'rgba(139,92,246,0.12)' },
  tp:     { label: 'TP',         border: '#10b981', bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', chip: 'rgba(16,185,129,0.12)' },
  examen: { label: 'ÉVALUATION', border: '#ef4444', bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', chip: 'rgba(239,68,68,0.12)' },
}

interface Seance {
  id: number
  jour_semaine: string
  heure_debut: string
  heure_fin: string
  type: string
  cours_nom: string
  cours_code: string
  salle_nom?: string
  batiment?: string
  enseignant_nom?: string
}

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const HEURES     = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
const GRID_START  = toMin('08:00')
const SLOT_HEIGHT = 68

function seanceStyle(s: Seance) {
  const top    = (toMin(s.heure_debut) - GRID_START) / 60 * SLOT_HEIGHT
  const height = (toMin(s.heure_fin) - toMin(s.heure_debut)) / 60 * SLOT_HEIGHT - 4
  return { top, height }
}

/* ── Week helpers ─────────────────────────────────────────────────────────── */

function getMondayOf(offset: number): Date {
  const today = new Date()
  const day   = today.getDay() // 0=sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

const MOIS_FR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']
const MOIS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function fmtDay(d: Date) {
  return String(d.getDate()).padStart(2, '0') + ' ' + MOIS_FR[d.getMonth()]
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function EmploiDuTempsPage() {
  const { user } = useAuth()
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(Object.keys(TYPE_META)))

  function toggleType(type: string) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  /* Week dates */
  const monday    = useMemo(() => getMondayOf(weekOffset), [weekOffset])
  const weekDates = useMemo(() => JOURS.map((_, i) => addDays(monday, i)), [monday])
  const today     = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const friday    = weekDates[4]

  const weekLabel = useMemo(() => {
    const m1 = monday.getMonth(), m2 = friday.getMonth()
    if (m1 === m2) return `${MOIS_LONG[m1]} ${monday.getFullYear()}`
    return `${MOIS_FR[m1]} – ${MOIS_FR[m2]} ${friday.getFullYear()}`
  }, [monday, friday])

  /* ── Data fetching ──────────────────────────────────────────────────── */

  const profilId = user?.profil_id ?? null

  const endpoint =
    user?.role === 'etudiant'   && profilId ? `/seances?etudiant_id=${profilId}` :
    user?.role === 'enseignant' && profilId ? `/seances?enseignant_id=${profilId}` : null

  const { data: seances = [], isLoading } = useQuery<Seance[]>({
    queryKey: ['seances-edt', endpoint],
    queryFn:  () => api.get(endpoint!).then(r => r.data),
    enabled:  !!endpoint,
  })

  const { data: tousLesCours = [] } = useQuery<Array<{ id: number }>>({
    queryKey: ['cours'],
    queryFn:  () => api.get('/cours').then(r => r.data),
    enabled:  user?.role === 'admin',
  })

  const { data: seancesAdmin = [] } = useQuery<Seance[]>({
    queryKey: ['seances-admin'],
    queryFn:  async () => {
      const all = await Promise.all(tousLesCours.map(c => api.get(`/seances?cours_id=${c.id}`).then(r => r.data)))
      return all.flat()
    },
    enabled: user?.role === 'admin' && tousLesCours.length > 0,
  })

  const allSeances: Seance[] = user?.role === 'admin' ? seancesAdmin : seances

  /* ── Stats ──────────────────────────────────────────────────────────── */

  const heuresParType: Record<string, number> = {}
  const sallesCount:   Record<string, number> = {}

  allSeances.forEach(s => {
    const dur = (toMin(s.heure_fin) - toMin(s.heure_debut)) / 60
    heuresParType[s.type] = (heuresParType[s.type] ?? 0) + dur
    if (s.salle_nom) sallesCount[s.salle_nom] = (sallesCount[s.salle_nom] ?? 0) + 1
  })

  const maxH      = Math.max(...Object.values(heuresParType), 1)
  const topSalles = Object.entries(sallesCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  /* Group by day, filtered */
  const parJour: Record<string, Seance[]> = {}
  JOURS.forEach(j => { parJour[j] = [] })
  allSeances.forEach(s => {
    if (parJour[s.jour_semaine] && activeTypes.has(s.type)) parJour[s.jour_semaine].push(s)
  })

  if (isLoading) {
    return (
      <div style={{ background: '#111111', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555', fontSize: 13 }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>PLANNING</p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
              Emploi du <span style={{ color: ACCENT, fontStyle: 'italic' }}>temps.</span>
            </h1>
          </div>

          {/* Navigation semaine */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #222',
                background: '#161616', color: '#777', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ccc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#777')}
            >
              ‹
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
                {weekLabel}
              </p>
              <p style={{ color: '#444', fontSize: 11, marginTop: 2 }}>
                {monday.getDate()} – {friday.getDate()} {MOIS_FR[friday.getMonth()]}
              </p>
            </div>

            <button
              onClick={() => setWeekOffset(w => w + 1)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #222',
                background: '#161616', color: '#777', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ccc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#777')}
            >
              ›
            </button>

            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                  padding: '5px 12px', borderRadius: 6,
                  background: ACCENT + '18', color: ACCENT,
                  border: `1px solid ${ACCENT}44`, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        {/* ── Filter chips ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const active = activeTypes.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${active ? meta.border : '#2a2a2a'}`,
                  background: active ? meta.chip : 'transparent',
                  color: active ? meta.text : '#555',
                }}
              >
                {meta.label}
              </button>
            )
          })}
        </div>

        {/* ── Grid ──────────────────────────────────────────────────── */}
        {allSeances.length === 0 ? (
          <div style={{
            background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: 14, padding: '3rem', textAlign: 'center',
          }}>
            <p style={{ color: '#444', fontSize: 14 }}>Aucune séance planifiée</p>
          </div>
        ) : (
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, overflow: 'auto' }}>
            <div style={{ display: 'flex', minWidth: 700 }}>

              {/* Colonne heures */}
              <div style={{ width: 56, flexShrink: 0, borderRight: '1px solid #1f1f1f', paddingTop: 52 }}>
                {HEURES.map(h => (
                  <div key={h} style={{ height: SLOT_HEIGHT, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 4 }}>
                    <span style={{ color: '#333', fontSize: 11, fontFamily: 'monospace' }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Colonnes jours */}
              {JOURS.map((jour, idx) => {
                const date     = weekDates[idx]
                const isToday  = isSameDay(date, today)
                return (
                  <div key={jour} style={{ flex: 1, borderRight: '1px solid #1a1a1a', minWidth: 0 }}>

                    {/* En-tête jour */}
                    <div style={{
                      height: 52, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      borderBottom: '1px solid #1f1f1f',
                      background: isToday ? 'rgba(232,69,37,0.06)' : 'transparent',
                      gap: 2,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: isToday ? 700 : 500, letterSpacing: '0.12em',
                        color: isToday ? ACCENT : '#555',
                        textTransform: 'uppercase',
                      }}>
                        {jour.slice(0, 3)}
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: isToday ? 700 : 400,
                        color: isToday ? '#fff' : '#444',
                        fontFamily: 'monospace',
                      }}>
                        {fmtDay(date)}
                      </span>
                      {isToday && (
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, display: 'block' }} />
                      )}
                    </div>

                    {/* Zone grille */}
                    <div style={{ position: 'relative', height: SLOT_HEIGHT * HEURES.length }}>
                      {HEURES.map((_, i) => (
                        <div key={i} style={{
                          position: 'absolute', left: 0, right: 0,
                          top: i * SLOT_HEIGHT, borderTop: '1px solid #1a1a1a',
                        }} />
                      ))}

                      {parJour[jour].map(s => {
                        const { top, height } = seanceStyle(s)
                        const meta = TYPE_META[s.type] ?? TYPE_META.cours
                        return (
                          <div
                            key={s.id}
                            style={{
                              position: 'absolute', left: 3, right: 3,
                              top, height,
                              borderRadius: 8,
                              borderLeft: `3px solid ${meta.border}`,
                              background: meta.bg,
                              padding: '6px 8px',
                              overflow: 'hidden',
                              cursor: 'default',
                            }}
                          >
                            <p style={{ fontSize: 11, fontWeight: 700, color: meta.text, lineHeight: 1.2, marginBottom: 2 }}>
                              {s.cours_code}
                            </p>
                            <p style={{ fontSize: 10, color: meta.text, opacity: 0.8, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.cours_nom}
                            </p>
                            {height > 40 && (
                              <p style={{ fontSize: 10, color: meta.text, opacity: 0.6, lineHeight: 1.2, marginTop: 2 }}>
                                {s.heure_debut.slice(0,5)}–{s.heure_fin.slice(0,5)}
                                {s.salle_nom ? ` · ${s.salle_nom}` : ''}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Stats section ─────────────────────────────────────────── */}
        {allSeances.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>

            <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>
                Volume horaire par type
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {Object.entries(heuresParType).map(([type, h]) => {
                  const meta = TYPE_META[type] ?? TYPE_META.cours
                  const pct  = (h / maxH) * 100
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: meta.text, fontSize: 12, fontWeight: 600 }}>{meta.label}</span>
                        <span style={{ color: '#555', fontSize: 12 }}>{h.toFixed(1)}h</span>
                      </div>
                      <div style={{ height: 4, background: '#1f1f1f', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: meta.border, borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
              <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: '1rem' }}>
                Salles fréquentées
              </h3>
              {topSalles.length === 0 ? (
                <p style={{ color: '#444', fontSize: 13 }}>Aucune salle renseignée</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topSalles.map(([salle, count], i) => (
                    <div key={salle} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: i === 0 ? ACCENT : '#222',
                        color: i === 0 ? '#fff' : '#555',
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, color: '#ccc', fontSize: 13 }}>{salle}</span>
                      <span style={{ color: '#555', fontSize: 12 }}>{count} séance{count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
