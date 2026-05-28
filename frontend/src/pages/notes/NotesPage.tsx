import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface NoteRaw {
  id: number
  etudiant_id: number
  evaluation_id: number
  note: number | null
  coefficient: number
  evaluation_nom: string
  evaluation_type: string
  cours_code: string
  cours_nom: string
  commentaire?: string
  date_saisie?: string
  verrouille: boolean
}

interface CoursGroup {
  code: string
  nom: string
  notes: NoteRaw[]
  moyenne: number | null
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}

function weightedAvg(notes: NoteRaw[]): number | null {
  const valid = notes.filter(n => toNum(n.note) !== null)
  if (valid.length === 0) return null
  const totalCoeff = valid.reduce((s, n) => s + (toNum(n.coefficient) ?? 1), 0)
  if (totalCoeff === 0) return null
  return valid.reduce((s, n) => s + (toNum(n.note) ?? 0) * (toNum(n.coefficient) ?? 1), 0) / totalCoeff
}

function noteColor(note: number | string | null): string {
  const n = parseFloat(String(note ?? 0))
  return n >= 14 ? '#4ade80' : n >= 10 ? '#fbbf24' : '#f87171'
}

function noteBg(note: number | string | null): string {
  const n = parseFloat(String(note ?? 0))
  return n >= 14 ? 'rgba(74,222,128,0.08)' : n >= 10 ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)'
}

function EctsCircle({ validated, total }: { validated: number; total: number }) {
  const pct = total > 0 ? Math.min(validated / total, 1) : 0
  const r   = 38
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1f1f1f" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={ACCENT} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>
          {validated}
        </span>
        <span style={{ color: '#555', fontSize: 10 }}>/ {total}</span>
      </div>
    </div>
  )
}

function CoursCard({ groupe, defaultOpen = false }: { groupe: CoursGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const avg = groupe.moyenne
  const color = avg !== null ? noteColor(avg) : '#555'

  const hasNotes = groupe.notes.some(n => n.note !== null)

  return (
    <div style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Course header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.25rem', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Left: code + name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: ACCENT, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, marginBottom: 3 }}>
            {groupe.code}
          </p>
          <p style={{ color: '#ccc', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {groupe.nom}
          </p>
        </div>

        {/* Moyenne */}
        {avg !== null ? (
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: noteBg(avg),
            border: `1px solid ${color}22`,
            textAlign: 'center', flexShrink: 0,
          }}>
            <span style={{ color, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
              {(toNum(avg) ?? 0).toFixed(2)}
            </span>
            <span style={{ color: '#555', fontSize: 11 }}>/20</span>
          </div>
        ) : (
          <span style={{ color: '#444', fontSize: 13 }}>— notes</span>
        )}

        {/* Progress bar */}
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ height: 4, background: '#222', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: avg !== null ? `${(avg / 20) * 100}%` : '0%',
              background: avg !== null ? color : '#333',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>

        {/* Evals count */}
        <span style={{ color: '#444', fontSize: 12, flexShrink: 0, width: 60, textAlign: 'right' }}>
          {groupe.notes.length} eval.
        </span>

        {/* Chevron */}
        <span style={{ color: '#555', fontSize: 14, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▾
        </span>
      </button>

      {/* Evaluation rows */}
      {open && (
        <div style={{ borderTop: '1px solid #1f1f1f' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 60px 90px',
            padding: '6px 1.25rem', gap: '0.5rem',
          }}>
            {['Évaluation', 'Type', 'Coeff.', 'Note'].map(h => (
              <span key={h} style={{ color: '#444', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, textAlign: h === 'Note' ? 'right' : 'left' }}>
                {h}
              </span>
            ))}
          </div>

          {groupe.notes.map((n, i) => {
            const nc = toNum(n.note) !== null ? noteColor(n.note) : '#444'
            return (
              <div
                key={n.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 60px 90px',
                  padding: '10px 1.25rem', gap: '0.5rem', alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid #191919',
                }}
              >
                <div>
                  <p style={{ color: '#ccc', fontSize: 13, fontWeight: 500 }}>{n.evaluation_nom}</p>
                  {n.date_saisie && (
                    <p style={{ color: '#444', fontSize: 11, marginTop: 2 }}>
                      {new Date(n.date_saisie).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  padding: '2px 8px', borderRadius: 4,
                  background: '#1a1a1a', color: '#666',
                  textTransform: 'uppercase', display: 'inline-block',
                }}>
                  {n.evaluation_type}
                </span>
                <span style={{ color: '#555', fontSize: 13 }}>×{n.coefficient}</span>
                <div style={{ textAlign: 'right' }}>
                  {toNum(n.note) !== null ? (
                    <>
                      <span style={{ color: nc, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
                        {toNum(n.note)!.toFixed(1)}
                      </span>
                      <span style={{ color: '#444', fontSize: 11 }}>/20</span>
                      {/* mini bar */}
                      <div style={{ height: 2, background: '#1f1f1f', borderRadius: 1, marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${(toNum(n.note)! / 20) * 100}%`, background: nc, borderRadius: 1 }} />
                      </div>
                    </>
                  ) : (
                    <span style={{ color: '#444', fontSize: 13 }}>—</span>
                  )}
                </div>
              </div>
            )
          })}

          {!hasNotes && (
            <p style={{ padding: '12px 1.25rem', color: '#444', fontSize: 13 }}>
              Aucune note saisie pour ce cours.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */

export default function NotesPage() {
  const { user } = useAuth()

  const etudiantId = user?.profil_id ?? null

  /* Fetch notes */
  const { data: notesData, isLoading } = useQuery<{ notes: NoteRaw[]; moyenne: number | null }>({
    queryKey: ['notes-etudiant', etudiantId],
    queryFn: () => api.get(`/notes?etudiant_id=${etudiantId}`).then(r => r.data),
    enabled: !!etudiantId,
  })

  /* Fetch cours for ECTS */
  const { data: dashData } = useQuery({
    queryKey: ['dashboard-etudiant'],
    queryFn: () => api.get('/dashboard/etudiant').then(r => r.data),
    enabled: !!user,
  })

  if (user?.role !== 'etudiant') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>
        Cette page est réservée aux étudiants.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ background: '#111111', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <p style={{ color: '#555', fontSize: 13 }}>Chargement…</p>
      </div>
    )
  }

  const notes    = notesData?.notes ?? []
  const moyenne  = notesData?.moyenne ?? null
  const cours    = dashData?.cours ?? []
  const ectsTotal = cours.reduce((s: number, c: { credits: number }) => s + (c.credits || 0), 0)

  /* Group notes by course */
  const groupMap: Record<string, CoursGroup> = {}
  notes.forEach(n => {
    if (!groupMap[n.cours_code]) {
      groupMap[n.cours_code] = { code: n.cours_code, nom: n.cours_nom, notes: [], moyenne: null }
    }
    groupMap[n.cours_code].notes.push(n)
  })
  const groupes: CoursGroup[] = Object.values(groupMap).map(g => ({
    ...g,
    moyenne: weightedAvg(g.notes),
  }))
  groupes.sort((a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1))

  const coursAvecNotes = groupes.filter(g => g.moyenne !== null).length
  const ectsValidesEst = Math.round((coursAvecNotes / Math.max(cours.length, 1)) * ectsTotal)

  /* Trend sparkline data (last 5 notes with values) */
  const trendNotes = [...notes]
    .filter(n => n.note !== null && n.date_saisie)
    .sort((a, b) => new Date(a.date_saisie!).getTime() - new Date(b.date_saisie!).getTime())
    .slice(-6)
    .map(n => n.note as number)

  const sparkMin = Math.min(...trendNotes, 0)
  const sparkMax = Math.max(...trendNotes, 20)
  const sparkH   = 40
  const sparkW   = 120

  function sparkY(v: number) {
    return sparkH - ((v - sparkMin) / (sparkMax - sparkMin || 1)) * sparkH
  }

  const sparkPoints = trendNotes.map((v, i) => {
    const x = (i / Math.max(trendNotes.length - 1, 1)) * sparkW
    const y = sparkY(v)
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem', maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>
            RÉSULTATS ACADÉMIQUES
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
            Mes <span style={{ color: ACCENT, fontStyle: 'italic' }}>résultats.</span>
          </h1>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', marginBottom: '2rem', alignItems: 'stretch' }}>

          {/* Moyenne + sparkline */}
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
            <p style={{ color: '#444', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Moyenne générale
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                {toNum(moyenne) !== null ? (
                  <>
                    <span style={{ color: noteColor(moyenne), fontSize: 36, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>
                      {toNum(moyenne)!.toFixed(2)}
                    </span>
                    <span style={{ color: '#555', fontSize: 16 }}>/20</span>
                  </>
                ) : (
                  <span style={{ color: '#444', fontSize: 28 }}>—</span>
                )}
              </div>
              {trendNotes.length >= 2 && (
                <svg width={sparkW} height={sparkH + 4} style={{ overflow: 'visible', flexShrink: 0 }}>
                  <polyline
                    points={sparkPoints}
                    fill="none"
                    stroke={moyenne !== null ? noteColor(moyenne) : '#555'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                  />
                  {trendNotes.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / Math.max(trendNotes.length - 1, 1)) * sparkW}
                      cy={sparkY(v)}
                      r="3"
                      fill={moyenne !== null ? noteColor(moyenne) : '#555'}
                      opacity="0.8"
                    />
                  ))}
                </svg>
              )}
            </div>
            <p style={{ color: '#444', fontSize: 12, marginTop: 8 }}>
              {notes.filter(n => n.note !== null).length} évaluation{notes.filter(n => n.note !== null).length !== 1 ? 's' : ''} notée{notes.filter(n => n.note !== null).length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Notes count */}
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
            <p style={{ color: '#444', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Cours évalués
            </p>
            <p style={{ color: '#fff', fontSize: 36, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, marginBottom: 8 }}>
              {coursAvecNotes}
              <span style={{ color: '#555', fontSize: 16 }}>/{cours.length}</span>
            </p>
            <p style={{ color: '#444', fontSize: 12 }}>matières avec résultats</p>
          </div>

          {/* Évals à venir */}
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
            <p style={{ color: '#444', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
              Évaluations totales
            </p>
            <p style={{ color: '#fff', fontSize: 36, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, marginBottom: 8 }}>
              {notes.length}
            </p>
            <p style={{ color: '#444', fontSize: 12 }}>
              {notes.filter(n => n.note !== null).length} avec note · {notes.filter(n => n.note === null).length} en attente
            </p>
          </div>

          {/* ECTS circle */}
          <div style={{
            background: '#161616', border: '1px solid #1f1f1f',
            borderRadius: 14, padding: '1.25rem 1.5rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <EctsCircle validated={ectsValidesEst} total={ectsTotal} />
            <p style={{ color: '#444', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
              ECTS
            </p>
          </div>
        </div>

        {/* Course list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groupes.length === 0 ? (
            <div style={{
              background: '#161616', border: '1px solid #1f1f1f',
              borderRadius: 14, padding: '3rem', textAlign: 'center',
            }}>
              <p style={{ color: '#444', fontSize: 14 }}>Aucune note disponible pour le moment.</p>
            </div>
          ) : (
            groupes.map((groupe, i) => (
              <CoursCard key={groupe.code} groupe={groupe} defaultOpen={i === 0} />
            ))
          )}
        </div>

      </div>
    </div>
  )
}
