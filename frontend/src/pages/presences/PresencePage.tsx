import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface Seance {
  id: number; cours_id: number; jour_semaine: string
  heure_debut: string; heure_fin: string; type: string
  cours_code: string; cours_nom: string; salle_nom?: string
}
interface Presence {
  id: number; etudiant_id: number; nom: string; prenom: string
  numero_etudiant: string; statut: 'present' | 'absent' | 'retard' | 'excuse'
}

const STATUTS = ['present', 'absent', 'retard', 'excuse'] as const
const SM: Record<string, { label: string; color: string; bg: string; border: string }> = {
  present: { label:'Présent',  color:'#4ade80', bg:'rgba(74,222,128,0.15)',   border:'rgba(74,222,128,0.4)' },
  absent:  { label:'Absent',   color:'#f87171', bg:'rgba(248,113,113,0.12)',  border:'rgba(248,113,113,0.3)' },
  retard:  { label:'Retard',   color:'#fbbf24', bg:'rgba(251,191,36,0.15)',   border:'rgba(251,191,36,0.4)' },
  excuse:  { label:'Excusé',   color:'#94a3b8', bg:'rgba(148,163,184,0.12)', border:'rgba(148,163,184,0.3)' },
}
const TYPE_C: Record<string,string> = { cours:'#3b82f6', td:'#8b5cf6', tp:'#10b981', examen:'#ef4444' }

function rndCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return [2,1,2].map(n => Array.from({length:n},()=>chars[Math.floor(Math.random()*chars.length)]).join('')).join('-')
}
function initials(p: string, n: string) { return ((p?.[0]??'')+(n?.[0]??'')).toUpperCase() }

export default function PresencePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedSeance, setSelectedSeance] = useState<number|null>(null)
  const [qrCode,  setQrCode]  = useState(rndCode)
  const [timer,   setTimer]   = useState(300)
  const [timerOn, setTimerOn] = useState(false)
  const [markedSet, setMarkedSet] = useState<Set<number>>(new Set())

  /* ── Timer ── */
  useEffect(() => {
    if (!timerOn) return
    if (timer <= 0) { setTimerOn(false); return }
    const t = setTimeout(() => setTimer(s => s-1), 1000)
    return () => clearTimeout(t)
  }, [timerOn, timer])

  const regenerate = useCallback(() => {
    setQrCode(rndCode()); setTimer(300); setTimerOn(true)
  }, [])

  const fmtTimer = `${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`
  const enseignantId = user?.profil_id ?? null

  /* ── Data ── */
  const { data: seances = [], isLoading: loadingSeances } = useQuery<Seance[]>({
    queryKey: ['seances-presence', enseignantId, user?.role],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const cours = await api.get('/cours').then(r => r.data as Array<{id:number}>)
        const all   = await Promise.all(cours.map(c => api.get(`/seances?cours_id=${c.id}`).then(r => r.data)))
        return all.flat()
      }
      if (enseignantId) return api.get(`/seances?enseignant_id=${enseignantId}`).then(r => r.data)
      return []
    },
    enabled: user?.role === 'admin' || !!enseignantId,
  })

  const { data: presences = [], isLoading: loadingP } = useQuery<Presence[]>({
    queryKey: ['presences', selectedSeance],
    queryFn:  () => api.get(`/presences?seance_id=${selectedSeance}`).then(r => r.data),
    enabled:  !!selectedSeance,
  })

  const { mutate: initSeance, isPending: initing } = useMutation({
    mutationFn: () => api.post(`/presences/seance/${selectedSeance}/init`),
    onSuccess: (r) => {
      const count = (r.data as {created:number}).created
      toast.success(count > 0 ? `${count} étudiants chargés` : 'Feuille déjà initialisée')
      qc.invalidateQueries({ queryKey: ['presences', selectedSeance] })
      setMarkedSet(new Set())
    },
    onError: () => toast.error("Erreur d'initialisation"),
  })

  const { mutate: updatePresence } = useMutation({
    mutationFn: ({ eid, statut }: {eid:number; statut:string}) =>
      api.post('/presences', { etudiant_id:eid, seance_id:selectedSeance, statut }),
    onSuccess: (_,vars) => {
      setMarkedSet(s => { const n=new Set(s); n.add(vars.eid); return n })
      qc.invalidateQueries({ queryKey: ['presences', selectedSeance] })
    },
    onError: () => toast.error('Erreur'),
  })

  const { mutate: markAll } = useMutation({
    mutationFn: () => Promise.all(presences.map(p =>
      api.post('/presences', { etudiant_id:p.etudiant_id, seance_id:selectedSeance, statut:'present' })
    )),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presences', selectedSeance] })
      toast.success('Tous marqués présents')
    },
  })

  const seanceActive = seances.find(s => s.id === selectedSeance)
  const stats = {
    present: presences.filter(p=>p.statut==='present').length,
    retard:  presences.filter(p=>p.statut==='retard').length,
    excuse:  presences.filter(p=>p.statut==='excuse').length,
    absent:  presences.filter(p=>p.statut==='absent' && markedSet.has(p.etudiant_id)).length,
    attente: presences.filter(p=>p.statut==='absent' && !markedSet.has(p.etudiant_id)).length,
  }

  const seancesByCours: Record<string, Seance[]> = {}
  seances.forEach(s => { const k=s.cours_code; seancesByCours[k]=seancesByCours[k]??[]; seancesByCours[k].push(s) })

  return (
    <div style={{ background:'#111111', minHeight:'100%' }}>
      <div style={{ padding:'2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'1.75rem', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#555', fontSize:11, letterSpacing:'0.18em', marginBottom:8 }}>GESTION</p>
            <h1 style={{ fontFamily:SERIF, fontSize:'clamp(1.8rem,3vw,2.4rem)', color:'#fff', fontWeight:700, lineHeight:1.1 }}>
              Feuille <span style={{ color:ACCENT, fontStyle:'italic' }}>d'appel.</span>
            </h1>
          </div>
          {selectedSeance && presences.length > 0 && (
            <div style={{ display:'flex', gap:'0.625rem' }}>
              <button onClick={() => markAll()}
                style={{ padding:'8px 16px', borderRadius:8, background:'rgba(74,222,128,0.1)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.3)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                Marquer tous présents
              </button>
              <button style={{ padding:'8px 16px', borderRadius:8, background:ACCENT, color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                Clôturer la séance
              </button>
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:'1.25rem', alignItems:'start' }}>

          {/* ── Sidebar séances ───────────────────────────────────────── */}
          <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #1e1e1e' }}>
              <p style={{ color:'#555', fontSize:11, letterSpacing:'0.15em', fontWeight:600 }}>SÉANCES — {seances.length}</p>
            </div>
            {loadingSeances ? (
              <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {[1,2,3].map(i=><div key={i} style={{height:48,background:'#1a1a1a',borderRadius:8}}/>)}
              </div>
            ) : (
              <div style={{ maxHeight:'70vh', overflowY:'auto' }}>
                {Object.entries(seancesByCours).map(([code, list]) => (
                  <div key={code}>
                    <p style={{ padding:'5px 1.25rem', color:'#333', fontSize:10, letterSpacing:'0.15em', fontWeight:700, background:'#111', borderBottom:'1px solid #1a1a1a' }}>{code}</p>
                    {list.map(s => {
                      const active = selectedSeance === s.id
                      const tc = TYPE_C[s.type] ?? '#555'
                      return (
                        <button key={s.id} onClick={() => { setSelectedSeance(s.id); setMarkedSet(new Set()) }}
                          style={{ width:'100%', textAlign:'left', padding:'0.75rem 1.25rem', background:active?'#1e1e1e':'transparent', borderLeft:`3px solid ${active?ACCENT:'transparent'}`, borderBottom:'1px solid #191919', border:'none', cursor:'pointer' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:3 }}>
                            <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:tc+'22', color:tc, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.type}</span>
                            <span style={{ color:active?'#ccc':'#666', fontSize:12, textTransform:'capitalize' }}>{s.jour_semaine}</span>
                          </div>
                          <p style={{ color:'#444', fontSize:11 }}>{s.heure_debut.slice(0,5)} – {s.heure_fin.slice(0,5)}{s.salle_nom?` · ${s.salle_nom}`:''}</p>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Panel principal ──────────────────────────────────────── */}
          {!selectedSeance ? (
            <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'5rem', textAlign:'center' }}>
              <p style={{ fontSize:32, opacity:0.3, marginBottom:12 }}>📋</p>
              <p style={{ color:'#555', fontSize:14 }}>Sélectionnez une séance</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

              {/* Breadcrumb infos séance */}
              {seanceActive && (
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                  <span style={{ color:'#444', fontSize:12 }}>SÉANCE DE COURS</span>
                  <span style={{ color:'#333' }}>›</span>
                  <span style={{ color:TYPE_C[seanceActive.type]??'#555', fontSize:12, fontWeight:700 }}>{seanceActive.cours_code}</span>
                  <span style={{ color:'#333' }}>›</span>
                  <span style={{ color:'#666', fontSize:12 }}>{presences.length} étudiants</span>
                  <span style={{ color:'#333' }}>›</span>
                  <span style={{ color:'#555', fontSize:12 }}>{seanceActive.heure_debut.slice(0,5)} – {seanceActive.heure_fin.slice(0,5)}</span>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'1.25rem', alignItems:'start' }}>

                {/* ── QR + Stats ─────────────────────────────────────── */}
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                  {/* QR Code */}
                  <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'1.25rem', textAlign:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                      <p style={{ color:'#555', fontSize:10, letterSpacing:'0.15em', fontWeight:700 }}>QR DE POINTAGE</p>
                      {timerOn && (
                        <span style={{ fontSize:11, fontWeight:700, color: timer<60?'#f87171':ACCENT, fontFamily:'monospace', background:ACCENT+'18', padding:'2px 8px', borderRadius:4 }}>
                          ACTIF {fmtTimer}
                        </span>
                      )}
                    </div>

                    <div style={{ background:'#fff', borderRadius:12, padding:16, display:'inline-block', marginBottom:'1rem' }}>
                      <QRCodeSVG value={`POLYNUM:${qrCode}`} size={140} level="M" />
                    </div>

                    <p style={{ color:'#fff', fontSize:28, fontWeight:700, fontFamily:'monospace', letterSpacing:'0.15em', marginBottom:6 }}>
                      {qrCode}
                    </p>
                    <p style={{ color:'#444', fontSize:11, marginBottom:'1rem' }}>
                      Les étudiants saisissent ce code pour se marquer
                    </p>

                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button onClick={regenerate}
                        style={{ flex:1, padding:'7px', borderRadius:7, background:'#111', border:'1px solid #222', color:'#888', fontSize:12, cursor:'pointer', transition:'color 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.color='#ccc'}
                        onMouseLeave={e=>e.currentTarget.style.color='#888'}>
                        Régénérer
                      </button>
                      <button onClick={() => setTimerOn(t=>!t)}
                        style={{ flex:1, padding:'7px', borderRadius:7, background: timerOn?ACCENT+'18':'#111', border:`1px solid ${timerOn?ACCENT+'44':'#222'}`, color:timerOn?ACCENT:'#888', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {timerOn ? 'Pause' : 'Activer'}
                      </button>
                    </div>

                    {presences.length === 0 && (
                      <button onClick={() => initSeance()} disabled={initing}
                        style={{ width:'100%', marginTop:'0.75rem', padding:'8px', borderRadius:8, background:ACCENT, color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', opacity:initing?0.6:1 }}>
                        {initing ? 'Chargement…' : '+ Initialiser la feuille'}
                      </button>
                    )}
                  </div>

                  {/* Récap */}
                  {presences.length > 0 && (
                    <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'1.25rem' }}>
                      <p style={{ color:'#555', fontSize:10, letterSpacing:'0.15em', fontWeight:700, marginBottom:'1rem' }}>RÉCAP · SÉANCE</p>
                      {[
                        { key:'present', label:'Présents',   val:stats.present },
                        { key:'retard',  label:'Retards',    val:stats.retard },
                        { key:'excuse',  label:'Abs. justifiées', val:stats.excuse },
                        { key:'absent',  label:'Absents',    val:stats.absent },
                        { key:'attente', label:'En attente', val:stats.attente, color:'#555' },
                      ].map(s => {
                        const meta = SM[s.key] ?? { color:s.color??'#555', bg:'transparent', border:'transparent' }
                        const pct  = presences.length > 0 ? (s.val/presences.length)*100 : 0
                        return (
                          <div key={s.key} style={{ marginBottom:'0.75rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ color:meta.color, fontSize:12 }}>{s.label}</span>
                              <span style={{ color:meta.color, fontSize:13, fontWeight:700, fontFamily:'monospace' }}>{s.val}</span>
                            </div>
                            <div style={{ height:3, background:'#1f1f1f', borderRadius:2 }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:meta.color, borderRadius:2, transition:'width 0.4s', opacity:0.7 }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Grille étudiants ──────────────────────────────── */}
                <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #1e1e1e', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ color:'#fff', fontSize:14, fontWeight:600 }}>
                        ÉTUDIANTS PRÉSENTS · POINTAGE EN TEMPS RÉEL
                      </p>
                      <p style={{ color:'#555', fontSize:12, marginTop:2 }}>{presences.length} étudiants</p>
                    </div>
                    {/* Légende */}
                    <div style={{ display:'flex', gap:'0.75rem' }}>
                      {Object.entries(SM).map(([k,v])=>(
                        <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:v.color }}/>
                          <span style={{ color:'#444', fontSize:10 }}>{v.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {loadingP ? (
                    <div style={{ padding:'2rem', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.75rem' }}>
                      {[1,2,3,4,5,6,7,8].map(i=><div key={i} style={{height:72,background:'#1a1a1a',borderRadius:10}}/>)}
                    </div>
                  ) : presences.length === 0 ? (
                    <div style={{ padding:'4rem', textAlign:'center' }}>
                      <p style={{ color:'#444', fontSize:14 }}>Feuille non initialisée</p>
                      <p style={{ color:'#333', fontSize:12, marginTop:6 }}>Cliquez sur "Initialiser la feuille"</p>
                    </div>
                  ) : (
                    <div style={{ padding:'1rem', maxHeight:'60vh', overflowY:'auto' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'0.625rem' }}>
                        {presences.map(p => {
                          const isMarked = markedSet.has(p.etudiant_id)
                          const displayStatut = (!isMarked && p.statut === 'absent') ? 'attente' : p.statut
                          const meta = SM[p.statut] ?? SM.absent
                          const isAttente = displayStatut === 'attente'
                          return (
                            <div key={p.id}
                              style={{
                                borderRadius:10, padding:'0.75rem 0.5rem', textAlign:'center', cursor:'pointer',
                                background: isAttente ? '#1a1a1a' : meta.bg,
                                border: `1px solid ${isAttente ? '#252525' : meta.border}`,
                                transition:'all 0.15s',
                              }}
                            >
                              {/* Avatar */}
                              <div style={{
                                width:36, height:36, borderRadius:'50%', margin:'0 auto 6px',
                                background: isAttente ? '#222' : meta.bg,
                                border: `2px solid ${isAttente ? '#333' : meta.color}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:12, fontWeight:700,
                                color: isAttente ? '#555' : meta.color,
                              }}>
                                {initials(p.prenom, p.nom)}
                              </div>
                              <p style={{ color: isAttente ? '#666' : '#ccc', fontSize:11, fontWeight:600, lineHeight:1.2, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {p.prenom}
                              </p>
                              {/* Status buttons (compact) */}
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                                {STATUTS.map(s => {
                                  const m = SM[s]
                                  const on = p.statut === s && isMarked
                                  return (
                                    <button key={s} onClick={() => updatePresence({eid:p.etudiant_id, statut:s})}
                                      title={m.label}
                                      style={{
                                        padding:'2px 0', borderRadius:4, fontSize:8, fontWeight:700,
                                        background: on ? m.bg : '#111', color: on ? m.color : '#333',
                                        border: `1px solid ${on ? m.border : '#1e1e1e'}`,
                                        cursor:'pointer', letterSpacing:'0.04em',
                                        transition:'all 0.1s',
                                      }}
                                    >
                                      {s === 'present' ? 'P' : s === 'absent' ? 'A' : s === 'retard' ? 'R' : 'E'}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {stats.attente > 0 && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1rem', padding:'0.75rem 1rem', background:'#1a1a1a', borderRadius:8, border:'1px solid #222' }}>
                          <span style={{ color:'#555', fontSize:12 }}>Marquer absent les {stats.attente} en attente</span>
                          <button onClick={() => {
                            presences.filter(p=>p.statut==='absent'&&!markedSet.has(p.etudiant_id))
                              .forEach(p => updatePresence({eid:p.etudiant_id, statut:'absent'}))
                          }} style={{ fontSize:11, color:ACCENT, background:'transparent', border:`1px solid ${ACCENT}44`, padding:'4px 10px', borderRadius:5, cursor:'pointer' }}>
                            Confirmer absences
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
