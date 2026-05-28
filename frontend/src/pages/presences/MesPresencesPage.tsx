import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface Bilan {
  taux_global: number
  nb_presences: number
  nb_absences: number
  nb_retards: number
  nb_excuses: number
  heatmap: Array<{ date: string; statut: string }>
  par_cours: Array<{ code: string; nom: string; taux: number; total: number }>
  historique: Array<{ id: number; date_seance: string; statut: string; commentaire?: string; heure_debut: string; heure_fin: string; seance_type: string; cours_code: string; cours_nom: string }>
}

const STATUT_META: Record<string, { color: string; bg: string; label: string }> = {
  present: { color:'#4ade80', bg:'rgba(74,222,128,0.12)',  label:'Présent' },
  absent:  { color:'#f87171', bg:'rgba(248,113,113,0.12)', label:'Absent' },
  retard:  { color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  label:'Retard' },
  excuse:  { color:'#94a3b8', bg:'rgba(148,163,184,0.12)', label:'Excusé' },
}

const TYPE_COLORS: Record<string,string> = { cours:'#3b82f6', td:'#8b5cf6', tp:'#10b981', examen:'#ef4444' }

/* ── Heatmap ──────────────────────────────────────────────────────────────── */
function Heatmap({ data }: { data: Array<{ date: string; statut: string }> }) {
  const byDate: Record<string, string> = {}
  data.forEach(d => { byDate[d.date] = d.statut })

  const today = new Date(); today.setHours(0,0,0,0)
  const days: Array<{ date: string; statut: string | null }> = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const ds = d.toISOString().slice(0,10)
    days.push({ date: ds, statut: byDate[ds] ?? null })
  }

  // Group into weeks (columns of 7)
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i+7))

  return (
    <div>
      <div style={{ display:'flex', gap:3 }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {week.map((day, di) => {
              const s = day.statut
              const bg = s === 'present' ? '#4ade80'
                       : s === 'absent'  ? '#ef4444'
                       : s === 'retard'  ? '#fbbf24'
                       : s === 'excuse'  ? '#94a3b8'
                       : '#1f1f1f'
              const op = s ? 0.8 : 0.4
              return (
                <div key={di} title={`${day.date}${s ? ` · ${s}` : ''}`} style={{
                  width:10, height:10, borderRadius:2,
                  background:bg, opacity:op,
                }}/>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:'1rem', marginTop:'0.75rem', flexWrap:'wrap' }}>
        {Object.entries(STATUT_META).map(([k,v]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:v.color }}/>
            <span style={{ color:'#444', fontSize:11 }}>{v.label}</span>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:'#1f1f1f', opacity:0.4 }}/>
          <span style={{ color:'#444', fontSize:11 }}>Non planifié</span>
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function MesPresencesPage() {
  const { data: bilan, isLoading } = useQuery<Bilan>({
    queryKey: ['presence-bilan'],
    queryFn:  () => api.get('/presences/bilan').then(r => r.data),
  })

  if (isLoading) return (
    <div style={{ background:'#111111', minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#555', fontSize:13 }}>Chargement…</p>
    </div>
  )

  const taux = bilan?.taux_global ?? 0

  return (
    <div style={{ background:'#111111', minHeight:'100%' }}>
      <div style={{ padding:'2rem 2.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'1.75rem' }}>
          <p style={{ color:'#555', fontSize:11, letterSpacing:'0.18em', marginBottom:8 }}>ASSIDUITÉ</p>
          <h1 style={{ fontFamily:SERIF, fontSize:'clamp(1.8rem,3vw,2.4rem)', color:'#fff', fontWeight:700, lineHeight:1.1 }}>
            Mes <span style={{ color:ACCENT, fontStyle:'italic' }}>présences.</span>
          </h1>
        </div>

        {/* ── Stats cards ────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {/* Taux global */}
          <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'1.25rem 1.5rem', gridColumn:'span 1' }}>
            <p style={{ color:'#555', fontSize:11, letterSpacing:'0.12em', marginBottom:8 }}>TAUX GLOBAL</p>
            <p style={{ fontFamily:SERIF, fontSize:42, fontWeight:700, lineHeight:1, color: taux>=85?'#4ade80':taux>=70?'#fbbf24':'#f87171' }}>
              {taux}<span style={{ fontSize:20, color:'#555' }}>%</span>
            </p>
            <div style={{ height:4, background:'#1f1f1f', borderRadius:2, marginTop:12 }}>
              <div style={{ height:'100%', width:`${taux}%`, borderRadius:2, background: taux>=85?'#4ade80':taux>=70?'#fbbf24':'#f87171', transition:'width 0.8s' }}/>
            </div>
          </div>

          {[
            { label:'PRÉSENCES',  val:bilan?.nb_presences??0, color:'#4ade80' },
            { label:'RETARDS',    val:bilan?.nb_retards??0,   color:'#fbbf24' },
            { label:'ABSENCES',   val:bilan?.nb_absences??0,  color:'#f87171' },
            { label:'EXCUSÉES',   val:bilan?.nb_excuses??0,   color:'#94a3b8' },
          ].map(s => (
            <div key={s.label} style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'1.25rem 1.5rem' }}>
              <p style={{ color:'#555', fontSize:11, letterSpacing:'0.12em', marginBottom:8 }}>{s.label}</p>
              <p style={{ fontSize:32, fontWeight:700, color:s.color, fontFamily:'monospace', lineHeight:1 }}>{s.val}</p>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.25rem', alignItems:'start' }}>

          {/* ── Colonne principale ──────────────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Heatmap */}
            <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'1.25rem 1.5rem' }}>
              <p style={{ color:'#fff', fontSize:14, fontWeight:600, marginBottom:'1rem' }}>Heatmap — 90 derniers jours</p>
              <Heatmap data={bilan?.heatmap ?? []} />
            </div>

            {/* Historique */}
            <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, overflow:'hidden' }}>
              <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #1e1e1e' }}>
                <p style={{ color:'#fff', fontSize:14, fontWeight:600 }}>Historique des séances</p>
              </div>
              {/* Header cols */}
              <div style={{ display:'grid', gridTemplateColumns:'90px 80px 1fr 70px 90px', padding:'6px 1.25rem', borderBottom:'1px solid #191919' }}>
                {['Date','Heure','Cours','Type','Statut'].map(h=>(
                  <span key={h} style={{ color:'#333', fontSize:10, letterSpacing:'0.12em', fontWeight:700 }}>{h}</span>
                ))}
              </div>
              <div style={{ maxHeight:360, overflowY:'auto' }}>
                {(bilan?.historique ?? []).map((h, i) => {
                  const sm = STATUT_META[h.statut] ?? STATUT_META.absent
                  const tc = TYPE_COLORS[h.seance_type] ?? '#555'
                  return (
                    <div key={h.id} style={{ display:'grid', gridTemplateColumns:'90px 80px 1fr 70px 90px', padding:'10px 1.25rem', alignItems:'center', borderBottom: i < (bilan?.historique.length??0)-1 ? '1px solid #191919':'none' }}>
                      <span style={{ color:'#888', fontSize:12, fontFamily:'monospace' }}>
                        {new Date(h.date_seance).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                      </span>
                      <span style={{ color:'#666', fontSize:11 }}>{h.heure_debut.slice(0,5)}</span>
                      <div>
                        <p style={{ color:'#ccc', fontSize:12, fontWeight:600 }}>{h.cours_code}</p>
                        <p style={{ color:'#444', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.cours_nom}</p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em', padding:'2px 7px', borderRadius:4, background:tc+'22', color:tc, textTransform:'uppercase' }}>
                        {h.seance_type}
                      </span>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:5, background:sm.bg, color:sm.color, display:'inline-block' }}>
                        {sm.label}
                      </span>
                    </div>
                  )
                })}
                {(bilan?.historique ?? []).length === 0 && (
                  <p style={{ padding:'2rem', color:'#444', textAlign:'center', fontSize:13 }}>Aucun historique</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar : par cours ─────────────────────────────────── */}
          <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'1.25rem 1.5rem' }}>
            <p style={{ color:'#fff', fontSize:14, fontWeight:600, marginBottom:'1rem' }}>Par cours</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {(bilan?.par_cours ?? []).map(c => (
                <div key={c.code}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div>
                      <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{c.code}</span>
                      <span style={{ color:'#444', fontSize:11, marginLeft:8 }}>{c.nom.slice(0,20)}{c.nom.length>20?'…':''}</span>
                    </div>
                    <span style={{ color: c.taux>=85?'#4ade80':c.taux>=70?'#fbbf24':'#f87171', fontSize:12, fontWeight:700 }}>
                      {c.taux}%
                    </span>
                  </div>
                  <div style={{ height:5, background:'#1f1f1f', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${c.taux}%`, background: c.taux>=85?'#4ade80':c.taux>=70?'#fbbf24':'#ef4444', borderRadius:3, transition:'width 0.5s' }}/>
                  </div>
                  <p style={{ color:'#333', fontSize:10, marginTop:3 }}>{c.total} séances</p>
                </div>
              ))}
              {(bilan?.par_cours ?? []).length === 0 && (
                <p style={{ color:'#444', fontSize:13 }}>Aucune donnée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
