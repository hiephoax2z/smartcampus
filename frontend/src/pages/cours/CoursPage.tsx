import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'


// Quelques constantes de style pour garder une cohérence visuelle sur la page
const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"


/*TYPES ET INTERFACES */

// Structure d'un cours standard tel qu'il vient de la base de données
interface Cours {
  id: number; code: string; nom: string; credits: number; semestre: string
  niveau: string; enseignant_nom: string; capacite_max: number; departement: string
  nb_inscrits?: number; nb_seances?: number; nb_evals?: number
}

// Structure spécifique pour la vue étudiant genre ses propres cours et le catalogue global
interface MesCours {
  enrolled: (Cours & { ma_moyenne: number | null; nb_notes_saisies: number; nb_evals: number; nb_seances: number; prochaine_jour?: string; prochaine_heure?: string })[]
  catalogue: (Cours & { nb_inscrits: number })[]
}


// Petit dictionnaire pour raccourcir l'affichage des jours de la semaine
const JOURS_SHORT: Record<string,string> = { lundi:'Lun',mardi:'Mar',mercredi:'Mer',jeudi:'Jeu',vendredi:'Ven' }


/*FONCTIONS UTILITAIRES */

/* 
Génère un thème de couleur (bordure, texte, fond) selon le code du cours.
Ex: L'informatique (INF) est bleu, les maths (MAT) en violet, le reste en rouge.
 */

function codeColor(code: string): { border:string; text:string; bg:string } {
  const p = code.slice(0,3)

  if (p === 'INF') return { border:'#3b82f6', text:'#93c5fd', bg:'rgba(59,130,246,0.1)' }
  if (p === 'MAT') return { border:'#8b5cf6', text:'#c4b5fd', bg:'rgba(139,92,246,0.1)' }

  // Couleur par défaut si la matière n'est pas reconnue
  return { border: ACCENT, text:'#fca5a5', bg:'rgba(232,69,37,0.1)' }
}


/*
 Transforme un nom complet en initiales pour les petits avatars.
 Ex: "Jean Dupont" devient "JD"
 */

function initials(name: string) {
  return (name ?? '').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase() || '?'
}


/*
 Détermine la couleur d'une note.
 Vert = bien, Jaune = moyen, Rouge = sous la moyenne.
 */

function noteColor(n: number|null) {
  if (n === null) return '#555' // Gris si pas encore de note

  return n >= 14 ? '#4ade80' : n >= 10 ? '#fbbf24' : '#f87171'
}


/*
 Sécurité pour transformer une donnée inconnue en nombre propre.
 Retourne 'null' si la conversion échoue (ex: texte vide).
 */

function toNum(v: unknown): number | null {
  const n = parseFloat(String(v ?? ''))
  return isNaN(n) ? null : n
}


/*COMPOSANT : Vue Étudiant */

function EtudiantView() {

  const navigate = useNavigate()

  // On récupère les cours de l'étudiant (ceux où il est inscrit + le catalogue global)
  const { data, isLoading } = useQuery<MesCours>({
    queryKey: ['mes-cours'],

    queryFn:  () => api.get('/cours/mes-cours').then(r => r.data),
  })


  // On sépare bien les deux listes pour l'affichage (avec un tableau vide par défaut en cas de pépin)
  const enrolled  = data?.enrolled  ?? []
  const catalogue = data?.catalogue ?? []


  // Squelette de chargement le temps que l'API réponde
  if (isLoading) {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
        {[1,2,3,4].map(i => <div key={i} style={{height:200,background:'#161616',borderRadius:14,border:'1px solid #1f1f1f'}}/>)}
      </div>
    )
  }


  return (
    <>
      {/* BLOC 1 : Les cours dans lesquels l'étudiant est actuellement inscrit */}
      {enrolled.length === 0 ? (

        // Message si l'étudiant n'a encore rien choisi
        <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, padding:'4rem', textAlign:'center' }}>
          <p style={{ color:'#444', fontSize:14 }}>Aucun cours inscrit</p>
        </div>

      ) : (

        // Grille des cours actifs de l'étudiant
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          
          {enrolled.map(c => {
            
            // Calculs nécessaires pour l'affichage dynamique de la carte
            const color = codeColor(c.code)
            const avg   = toNum(c.ma_moyenne)
            const nc    = noteColor(avg)
            
            // On calcule un pourcentage d'avancement du cours en fonction du nombre de notes déjà saisies
            const avancement = c.nb_evals > 0 ? Math.round((c.nb_notes_saisies / c.nb_evals) * 100) : 0
            
            // Formatage propre du prochain cours prévu
            const jour  = c.prochaine_jour ? JOURS_SHORT[c.prochaine_jour] ?? c.prochaine_jour : null
            const heure = c.prochaine_heure ? c.prochaine_heure.slice(0,5) : null


            return (
              <div
                key={c.id}
                onClick={() => navigate(`/cours/${c.id}`)}
                style={{
                  background:'#161616', border:'1px solid #1f1f1f',
                  borderLeft:`3px solid ${color.border}`,
                  borderRadius:14, padding:'1.25rem',
                  cursor:'pointer', transition:'background 0.15s',
                  display:'flex', flexDirection:'column', gap:'0.875rem',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#1a1a1a'}
                onMouseLeave={e => e.currentTarget.style.background='#161616'}
              >

                {/* En-tête de la carte : Titre du cours et moyenne actuelle de l'élève */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, fontFamily:'monospace', color:color.text, background:color.bg, padding:'2px 7px', borderRadius:4 }}>
                        {c.code}
                      </span>
                      <span style={{ color:'#444', fontSize:10 }}>{c.nb_evals} éval. · {c.nb_seances} séances</span>
                    </div>
                    
                    <p style={{ color:'#fff', fontSize:14, fontWeight:600, lineHeight:1.3 }}>{c.nom}</p>
                    <p style={{ color:'#555', fontSize:12, marginTop:3 }}>{c.enseignant_nom ?? '—'}</p>
                  </div>
                  
                  {/* Affichage de la moyenne sur 20 (si elle existe) */}
                  {avg !== null && (
                    <div style={{ textAlign:'center', flexShrink:0, marginLeft:'0.75rem' }}>
                      <p style={{ color:nc, fontSize:22, fontWeight:700, fontFamily:'monospace', lineHeight:1 }}>{avg.toFixed(1)}</p>
                      <p style={{ color:'#444', fontSize:9, marginTop:2 }}>/20</p>
                    </div>
                  )}

                </div>


                {/* Barre de progression : Avancement du cours */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ color:'#444', fontSize:11 }}>Avancement</span>
                    <span style={{ color: avancement >= 80 ? '#4ade80' : '#888', fontSize:11, fontWeight:600 }}>{avancement}%</span>
                  </div>
                  
                  <div style={{ height:3, background:'#1f1f1f', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${avancement}%`, background:color.border, borderRadius:2, transition:'width 0.5s' }}/>
                  </div>
                </div>


                {/* Pied de la carte : Date et heure de la prochaine séance prévue */}
                {jour && heure && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.5rem', borderTop:'1px solid #1e1e1e' }}>
                    <span style={{ color:'#444', fontSize:11 }}>Prochaine séance</span>
                    
                    <span style={{ color:'#ccc', fontSize:11, fontWeight:600, fontFamily:'monospace' }}>
                      {jour} {heure}
                    </span>
                  </div>
                )}

              </div>
            )
          })}

        </div>
      )}


      {/* BLOC 2 : Le catalogue global (Cours disponibles à l'inscription) */}
      {catalogue.length > 0 && (
        
        <div style={{ marginTop:'2rem' }}>
          
          <p style={{ color:'#333', fontSize:11, letterSpacing:'0.18em', fontWeight:700, marginBottom:'0.875rem' }}>
            CATALOGUE — COURS DISPONIBLES À L'INSCRIPTION
          </p>
          
          <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, overflow:'hidden' }}>
            
            {/* En-tête du tableau du catalogue */}
            <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 60px 80px 100px', padding:'8px 1.25rem', borderBottom:'1px solid #1e1e1e' }}>
              {['Code','Intitulé','ECTS','Inscrits','Statut'].map(h=>(
                <span key={h} style={{ color:'#333', fontSize:10, letterSpacing:'0.12em', fontWeight:700 }}>{h}</span>
              ))}
            </div>
            

            {/* Lignes du tableau pour chaque cours du catalogue */}
            {catalogue.map((c,i) => {
              
              const color  = codeColor(c.code)
              // On vérifie si la classe est déjà pleine
              const plein  = c.capacite_max > 0 && c.nb_inscrits >= c.capacite_max
              
              return (
                <div key={c.id} style={{ display:'grid', gridTemplateColumns:'100px 1fr 60px 80px 100px', padding:'12px 1.25rem', alignItems:'center', borderBottom: i < catalogue.length-1 ? '1px solid #191919' : 'none' }}>
                  
                  <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:700, color:color.text }}>{c.code}</span>
                  
                  <div>
                    <p style={{ color:'#ccc', fontSize:13 }}>{c.nom}</p>
                    <p style={{ color:'#444', fontSize:11 }}>{c.niveau} · S{c.semestre}</p>
                  </div>
                  
                  <span style={{ color:'#666', fontSize:12 }}>{c.credits}</span>
                  
                  <span style={{ color:'#666', fontSize:12 }}>{c.nb_inscrits}/{c.capacite_max}</span>
                  
                  {/* Badge de statut du cours (Ouvert vs Complet) */}
                  <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:5, display:'inline-block', textAlign:'center',
                    background: plein ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                    color: plein ? '#f87171' : '#4ade80',
                  }}>
                    {plein ? 'Complet' : 'Ouvert'}
                  </span>

                </div>
              )
            })}

          </div>

        </div>
      )}
    </>
  )
}


/* COMPOSANT : Vue Admin / Enseignant */

function AdminView() {

  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  // États pour gérer la barre de recherche et le filtre par département
  const [search, setSearch]     = useState('')
  const [deptFilter, setDept]   = useState('')


  // Requête pour récupérer la totalité des cours de l'école
  const { data: cours = [], isLoading } = useQuery<Cours[]>({
    queryKey: ['cours'],

    queryFn:  () => api.get('/cours').then(r => r.data),
  })


  // Mutation pour permettre à l'admin de supprimer/désactiver un cours
  const { mutate: disableCours } = useMutation({
    mutationFn: (id: number) => api.delete(`/cours/${id}`),

    // En cas de succès, on raffraichit la liste des cours et on affiche un petit message
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['cours'] }); toast.success('Cours désactivé') },
    
    onError:    () => toast.error('Erreur'),
  })


  // On extrait la liste unique de tous les départements existants pour remplir le selecteur (dropdown)
  const depts    = [...new Set(cours.map(c => c.departement).filter(Boolean))]
  
  // Filtrage côté client de la liste selon la recherche tapée et le département sélectionné
  const filtered = cours.filter(c => {
    const q = search.toLowerCase()

    return (!q || [c.code,c.nom,c.enseignant_nom,c.departement].some(v=>v?.toLowerCase().includes(q)))
        && (!deptFilter || c.departement === deptFilter)
  })


  return (
    <>
      {/* Barre d'outils du haut : Recherche, Filtres et Bouton d'ajout */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        
        {/* Champ de recherche */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#161616', border:'1px solid #222', borderRadius:8, padding:'7px 12px', color:'#555' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l2.5 2.5"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ background:'transparent', border:'none', outline:'none', color:'#ccc', fontSize:12, width:160 }}/>
        </div>

        {/* Menu déroulant pour filtrer par département */}
        <select value={deptFilter} onChange={e=>setDept(e.target.value)}
          style={{ background:'#161616', border:'1px solid #222', borderRadius:8, padding:'7px 12px', color:deptFilter?'#ccc':'#555', fontSize:12, cursor:'pointer', outline:'none' }}>
          
          <option value="">Tous les depts</option>
          {depts.map(d=><option key={d} value={d}>{d}</option>)}

        </select>

        {/* Le bouton pour créer un cours n'apparaît que pour l'admin, pas pour les profs */}
        {user?.role === 'admin' && (
          <Link to="/cours/create" style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:ACCENT, color:'#fff', fontSize:12, fontWeight:600, padding:'7px 14px', borderRadius:8, textDecoration:'none' }}>
            + Nouveau cours
          </Link>
        )}

      </div>


      {/* Affichage du chargement ou de la liste filtrée */}
      {isLoading ? (

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(288px,1fr))', gap:'1rem' }}>
          {[1,2,3,4,5,6].map(i=><div key={i} style={{height:180,background:'#161616',borderRadius:14}}/>)}
        </div>

      ) : (

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(288px,1fr))', gap:'1rem' }}>
          
          {filtered.map(c => {
            
            const color = codeColor(c.code)
            // On calcule le taux de remplissage de la classe
            const taux  = c.capacite_max ? Math.round(((c.nb_inscrits??0)/c.capacite_max)*100) : 0


            return (
              <div key={c.id} onClick={() => navigate(`/cours/${c.id}`)}
                style={{ background:'#161616', border:'1px solid #1f1f1f', borderTop:`3px solid ${color.border}`, borderRadius:14, padding:'1.25rem', cursor:'pointer', transition:'background 0.15s', display:'flex', flexDirection:'column', gap:'0.875rem' }}
                onMouseEnter={e=>e.currentTarget.style.background='#1a1a1a'}
                onMouseLeave={e=>e.currentTarget.style.background='#161616'}
              >

                {/* En-tête : Code du cours, Nom et Semestre */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:700, fontFamily:'monospace', color:color.text, background:color.bg, padding:'3px 8px', borderRadius:5, display:'inline-block', marginBottom:8 }}>{c.code}</span>
                    <p style={{ color:'#fff', fontSize:15, fontWeight:600, lineHeight:1.3 }}>{c.nom}</p>
                  </div>
                  <span style={{ fontSize:11, color:'#555', background:'#111', border:'1px solid #222', padding:'3px 8px', borderRadius:5, whiteSpace:'nowrap', flexShrink:0 }}>{c.semestre}</span>
                </div>


                {/* Info du prof et du niveau */}
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:color.bg, border:`1px solid ${color.border}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:color.text, flexShrink:0 }}>{initials(c.enseignant_nom??'')}</div>
                  <span style={{ color:'#666', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.enseignant_nom??'—'}</span>
                  <span style={{ marginLeft:'auto', color:'#444', fontSize:11, flexShrink:0 }}>{c.niveau}</span>
                </div>


                {/* Barre de jauge du nombre d'inscrits par rapport à la capacité max */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ color:'#444', fontSize:11 }}>Inscrits</span>
                    {/* Le texte passe en rouge si le cours est rempli à 90% ou plus */}
                    <span style={{ color:taux>=90?'#f87171':'#666', fontSize:11 }}>{c.nb_inscrits??0} / {c.capacite_max}</span>
                  </div>

                  <div style={{ height:3, background:'#1f1f1f', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${Math.min(taux,100)}%`, background:taux>=90?'#ef4444':taux>=70?'#f59e0b':color.border, borderRadius:2 }}/>
                  </div>
                </div>


                {/* Statistiques rapides du cours et bouton admin */}
                <div style={{ display:'flex', gap:'0.75rem', paddingTop:'0.5rem', borderTop:'1px solid #1e1e1e' }}>
                  
                  {[{val:c.credits,label:'ECTS'},{val:c.nb_seances??0,label:'séances'},{val:c.nb_evals??0,label:'évals'}].map(s=>(
                    <div key={s.label} style={{ flex:1, textAlign:'center' }}>
                      <p style={{ color:'#fff', fontSize:15, fontWeight:700, fontFamily:'monospace' }}>{s.val}</p>
                      <p style={{ color:'#444', fontSize:10 }}>{s.label}</p>
                    </div>
                  ))}

                  {/* Le bouton "Désactiver" n'est disponible que pour les comptes Administrateurs */}
                  {user?.role==='admin' && (
                    <button onClick={e=>{e.stopPropagation();disableCours(c.id)}}
                      style={{ fontSize:10, color:'#555', background:'transparent', border:'1px solid #222', borderRadius:5, padding:'3px 8px', cursor:'pointer', alignSelf:'center' }}
                      onMouseEnter={e=>{e.currentTarget.style.color='#f87171';e.currentTarget.style.borderColor='#f87171'}}
                      onMouseLeave={e=>{e.currentTarget.style.color='#555';e.currentTarget.style.borderColor='#222'}}
                    >
                      Désactiver
                    </button>
                  )}

                </div>

              </div>
            )
          })}

        </div>
      )}
    </>
  )
}


/* PAGE PRINCIPALE */

/*
 C'est le composant maître appelé par le routeur. 
 Son rôle est d'afficher le titre de la page puis de déléguer le reste de l'affichage au bon sous-composant selon le rôle.
 */
export default function CoursPage() {

  const { user } = useAuth()


  return (
    <div style={{ background:'#111111', minHeight:'100%' }}>
      <div style={{ padding:'2rem 2.5rem' }}>
        
        {/* Titre principal de la page avec la typographie Serif stylisée */}
        <div style={{ marginBottom:'1.75rem' }}>
          <p style={{ color:'#555', fontSize:11, letterSpacing:'0.18em', marginBottom:8 }}>CATALOGUE</p>
          
          <h1 style={{ fontFamily:SERIF, fontSize:'clamp(1.8rem,3vw,2.4rem)', color:'#fff', fontWeight:700, lineHeight:1.1 }}>
            Mes <span style={{ color:ACCENT, fontStyle:'italic' }}>cours.</span>
          </h1>
        </div>

        {/* On aiguille l'utilisateur vers la vue correspondante à ses droits. Les profs ("enseignant") ont la même vue que les admins ici */}
        {user?.role === 'etudiant' ? <EtudiantView /> : <AdminView />}

      </div>
    </div>
  )
}
