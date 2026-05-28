import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface Enseignant {
  id: number
  nom: string
  prenom: string
  email: string
  numero_enseignant: string
  departement: string
  grade: string
  specialite?: string
  bureau?: string
  telephone?: string
  nb_cours: number
}

const GRADE_SHORT: Record<string, string> = {
  'Professeur': 'PR',
  'Maître de conférences': 'MCF',
  'Maître de conférences HDR': 'HDR',
  'ATER': 'ATER',
  'Doctorant': 'DOC',
}

const DEPT_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899',
]

function initials(nom: string, prenom: string) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase()
}

export default function EnseignantsPage() {
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')

  const { data: enseignants = [], isLoading } = useQuery<Enseignant[]>({
    queryKey: ['enseignants'],
    queryFn: () => api.get('/enseignants').then(r => r.data),
  })

  const depts = [...new Set(enseignants.map(e => e.departement).filter(Boolean))].sort()
  const deptColorMap: Record<string, string> = {}
  depts.forEach((d, i) => { deptColorMap[d] = DEPT_COLORS[i % DEPT_COLORS.length] })

  const deptStats = depts.map(d => ({
    dept: d,
    color: deptColorMap[d],
    count: enseignants.filter(e => e.departement === d).length,
    cours: enseignants.filter(e => e.departement === d).reduce((s, e) => s + (e.nb_cours ?? 0), 0),
  }))

  const filtered = enseignants.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || [e.nom, e.prenom, e.email, e.numero_enseignant, e.departement, e.grade]
      .some(v => v?.toLowerCase().includes(q))
    return matchSearch && (!filterDept || e.departement === filterDept)
  })

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>ADMINISTRATION</p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
              Corps <span style={{ color: ACCENT, fontStyle: 'italic' }}>enseignant.</span>
            </h1>
          </div>
        </div>

        {/* Stats + dept breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'TOTAL ENSEIGNANTS', val: enseignants.length, color: '#fff' },
              { label: 'DÉPARTEMENTS',       val: depts.length,        color: '#3b82f6' },
              { label: 'COURS ACTIFS',        val: enseignants.reduce((s, e) => s + (e.nb_cours ?? 0), 0), color: '#4ade80' },
            ].map(s => (
              <div key={s.label} style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
                <p style={{ color: '#555', fontSize: 10, letterSpacing: '0.12em', marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Dept breakdown */}
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: '0.875rem' }}>Répartition par département</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {deptStats.map(d => (
                <div key={d.dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ color: '#aaa', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{d.dept}</span>
                    </div>
                    <span style={{ color: d.color, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{d.count}</span>
                  </div>
                  <div style={{ height: 3, background: '#1f1f1f', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.round((d.count / enseignants.length) * 100)}%`, background: d.color, borderRadius: 2, opacity: 0.7, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
              {deptStats.length === 0 && <p style={{ color: '#444', fontSize: 13 }}>Aucun département</p>}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '6px 12px', color: '#555' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l2.5 2.5"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un enseignant…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ccc', fontSize: 13, width: '100%' }}
            />
          </div>
          <select
            value={filterDept} onChange={e => setFilterDept(e.target.value)}
            style={{ background: '#111', border: '1px solid #222', borderRadius: 8, color: '#ccc', fontSize: 12, padding: '6px 10px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Tous les départements</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ color: '#444', fontSize: 12 }}>{filtered.length} enseignant{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 130px 1fr 70px 60px', padding: '10px 1.5rem', borderBottom: '1px solid #1e1e1e', gap: 12 }}>
            {['', 'Enseignant', 'Numéro', 'Département', 'Grade', 'Cours'].map((h, i) => (
              <span key={i} style={{ color: '#333', fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: 13 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#444', fontSize: 14 }}>
              {search || filterDept ? 'Aucun résultat.' : 'Aucun enseignant enregistré.'}
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}>
              {filtered.map((e, i) => {
                const dc = deptColorMap[e.departement] ?? '#555'
                const gs = GRADE_SHORT[e.grade] ?? e.grade?.slice(0, 3).toUpperCase() ?? '—'
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '44px 1fr 130px 1fr 70px 60px',
                      padding: '12px 1.5rem', alignItems: 'center', gap: 12,
                      borderBottom: i < filtered.length - 1 ? '1px solid #191919' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#1a1a1a')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: dc + '22', border: `1px solid ${dc}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: dc,
                    }}>
                      {initials(e.nom, e.prenom)}
                    </div>

                    {/* Nom */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#ccc', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.prenom} {e.nom}
                      </p>
                      <p style={{ color: '#444', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</p>
                    </div>

                    {/* Numéro */}
                    <span style={{ color: ACCENT, fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{e.numero_enseignant}</span>

                    {/* Département */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dc, flexShrink: 0 }} />
                      <span style={{ color: '#888', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.departement}</span>
                    </div>

                    {/* Grade */}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#1f1f1f', color: '#666', letterSpacing: '0.06em' }}>
                      {gs}
                    </span>

                    {/* Nb cours */}
                    <span style={{ color: e.nb_cours > 0 ? '#4ade80' : '#333', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', textAlign: 'center' }}>
                      {e.nb_cours ?? 0}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
