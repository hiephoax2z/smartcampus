import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface Etudiant {
  id: number
  nom: string
  prenom: string
  email: string
  numero_etudiant: string
  niveau: string
  filiere: string
  statut: 'inscrit' | 'suspendu' | 'diplome'
  moyenne: number | null
}

const STATUT_META: Record<string, { color: string; bg: string; label: string }> = {
  inscrit:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)',   label: 'Inscrit'  },
  suspendu: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   label: 'Suspendu' },
  diplome:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Diplômé'  },
}

const FILIERE_COLOR: Record<string, string> = {
  Informatique: '#3b82f6',
  Mathématiques: '#8b5cf6',
  Physique:      '#06b6d4',
  Chimie:        '#10b981',
  Biologie:      '#f59e0b',
  Économie:      '#ec4899',
}
function filiereColor(f: string) {
  return FILIERE_COLOR[f] ?? ACCENT
}
function initials(nom: string, prenom: string) {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase()
}
function fmtNote(n: number | null) {
  if (n === null || n === undefined) return '—'
  const v = parseFloat(String(n))
  if (isNaN(v)) return '—'
  return v.toFixed(1)
}
function noteColor(n: number | null) {
  if (n === null) return '#444'
  const v = parseFloat(String(n))
  return v >= 14 ? '#4ade80' : v >= 10 ? '#fbbf24' : '#f87171'
}

const NIVEAUX = ['L1','L2','L3','M1','M2']

export default function EtudiantsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: etudiants = [], isLoading } = useQuery<Etudiant[]>({
    queryKey: ['etudiants'],
    queryFn: () => api.get('/etudiants').then(r => r.data),
  })

  const { mutate: deleteEtudiant, isPending: deleting } = useMutation({
    mutationFn: (id: number) => api.delete(`/etudiants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['etudiants'] }); setDeleteId(null) },
  })

  const filieres = [...new Set(etudiants.map(e => e.filiere).filter(Boolean))].sort()

  const filtered = etudiants.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q || [e.nom, e.prenom, e.email, e.numero_etudiant, e.filiere, e.niveau]
      .some(v => v?.toLowerCase().includes(q))
    return matchSearch
      && (!filterNiveau  || e.niveau  === filterNiveau)
      && (!filterFiliere || e.filiere === filterFiliere)
      && (!filterStatut  || e.statut  === filterStatut)
  })

  const stats = {
    total:    etudiants.length,
    inscrits: etudiants.filter(e => e.statut === 'inscrit').length,
    suspendus:etudiants.filter(e => e.statut === 'suspendu').length,
    diplomes: etudiants.filter(e => e.statut === 'diplome').length,
  }

  const sel = { background: '#111', border: '1px solid #222', borderRadius: 8, color: '#ccc', fontSize: 12, padding: '6px 10px', outline: 'none', cursor: 'pointer' }

  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.18em', marginBottom: 8 }}>ADMINISTRATION</p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.8rem,3vw,2.4rem)', color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
              Gestion des <span style={{ color: ACCENT, fontStyle: 'italic' }}>étudiants.</span>
            </h1>
          </div>
          <Link
            to="/etudiants/create"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}
          >
            + Ajouter un étudiant
          </Link>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'TOTAL', val: stats.total,     color: '#fff' },
            { label: 'INSCRITS',  val: stats.inscrits,  color: '#4ade80' },
            { label: 'SUSPENDUS', val: stats.suspendus, color: '#fbbf24' },
            { label: 'DIPLÔMÉS',  val: stats.diplomes,  color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
              <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.12em', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#161616', border: '1px solid #1f1f1f', borderRadius: 8, padding: '6px 12px', color: '#555' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l2.5 2.5"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un étudiant…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ccc', fontSize: 13, width: '100%' }}
            />
          </div>
          <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} style={sel}>
            <option value="">Tous les niveaux</option>
            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)} style={sel}>
            <option value="">Toutes les filières</option>
            {filieres.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={sel}>
            <option value="">Tous les statuts</option>
            <option value="inscrit">Inscrits</option>
            <option value="suspendu">Suspendus</option>
            <option value="diplome">Diplômés</option>
          </select>
          {(filterNiveau || filterFiliere || filterStatut || search) && (
            <button
              onClick={() => { setSearch(''); setFilterNiveau(''); setFilterFiliere(''); setFilterStatut('') }}
              style={{ fontSize: 12, color: '#555', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 8px' }}
            >
              Réinitialiser
            </button>
          )}
          <span style={{ color: '#444', fontSize: 12, marginLeft: 'auto' }}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 80px 130px 80px 100px 60px', padding: '10px 1.5rem', borderBottom: '1px solid #1e1e1e', gap: 8 }}>
            {['', 'Étudiant', 'Numéro', 'Niveau', 'Filière', 'Moyenne', 'Statut', ''].map((h, i) => (
              <span key={i} style={{ color: '#333', fontSize: 10, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#555', fontSize: 13 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#444', fontSize: 14 }}>
              {search || filterNiveau || filterFiliere || filterStatut ? 'Aucun résultat pour ces filtres.' : 'Aucun étudiant enregistré.'}
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
              {filtered.map((e, i) => {
                const fc = filiereColor(e.filiere)
                const sm = STATUT_META[e.statut] ?? STATUT_META.inscrit
                return (
                  <div
                    key={e.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '40px 1fr 120px 80px 130px 80px 100px 60px',
                      padding: '12px 1.5rem', alignItems: 'center', gap: 8,
                      borderBottom: i < filtered.length - 1 ? '1px solid #191919' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#1a1a1a')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: fc + '22', border: `1px solid ${fc}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: fc,
                    }}>
                      {initials(e.nom, e.prenom)}
                    </div>

                    {/* Nom */}
                    <div style={{ minWidth: 0 }}>
                      <Link to={`/etudiants/${e.id}`} style={{ color: '#ccc', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.prenom} {e.nom}
                      </Link>
                      <p style={{ color: '#444', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</p>
                    </div>

                    {/* Numéro */}
                    <span style={{ color: ACCENT, fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{e.numero_etudiant}</span>

                    {/* Niveau */}
                    <span style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>{e.niveau}</span>

                    {/* Filière */}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: fc + '18', color: fc, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      {e.filiere}
                    </span>

                    {/* Moyenne */}
                    <span style={{ color: noteColor(e.moyenne), fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtNote(e.moyenne)}{e.moyenne !== null ? <span style={{ color: '#444', fontSize: 10, fontWeight: 400 }}>/20</span> : ''}
                    </span>

                    {/* Statut */}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: sm.bg, color: sm.color, display: 'inline-block' }}>
                      {sm.label}
                    </span>

                    {/* Actions */}
                    <button
                      onClick={() => setDeleteId(e.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', fontSize: 11, transition: 'color 0.15s', padding: '4px' }}
                      onMouseEnter={ev => (ev.currentTarget.style.color = '#f87171')}
                      onMouseLeave={ev => (ev.currentTarget.style.color = '#333')}
                    >
                      Supprimer
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 16, padding: '2rem', maxWidth: 380, width: '90%' }}>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Supprimer l'étudiant ?</p>
            <p style={{ color: '#666', fontSize: 13, marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Cette action supprimera également toutes ses notes et inscriptions. Elle est irréversible.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={() => deleteEtudiant(deleteId)}
                disabled={deleting}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
