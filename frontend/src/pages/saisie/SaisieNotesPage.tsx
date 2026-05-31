import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'


// Constantes de design pour garder une charte graphique unifiée
const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"


/* TYPES ET INTERFACES */

// On définit ici la forme des données qu'on va manipuler dans cette page
// C'est très pratique pour que TypeScript nous aide à éviter les erreurs de frappe

interface Cours {
  id: number; code: string; nom: string; semestre: string; niveau: string
  nb_inscrits: number; capacite_max: number
}

interface Evaluation {
  id: number; nom: string; type: string; coefficient: number
  date_evaluation: string | null; verrouille: boolean
  nombre_notes: number; moyenne_classe: number | null
}

interface Inscrit {
  id: number; etudiant_id: number; cours_id: number
  nom: string; prenom: string; email: string
  numero_etudiant: string; niveau: string; filiere: string
}

// Représente une note déjà saisie en base de données pour un étudiant
interface NoteExistante {
  id: number; etudiant_id: number; evaluation_id: number
  note: number | null; commentaire: string | null
  nom: string; prenom: string; numero_etudiant: string
}


/*FONCTIONS UTILITAIRES (HELPERS)*/

/*
 Sécurise la conversion d'une valeur inconnue vers un nombre décimal.
 C'est utile quand on manipule des champs de texte pour les notes.
 */
function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null

  const n = parseFloat(String(v))
  return isNaN(n) ? null : n
}


/*
 Détermine dynamiquement la couleur de la note affichée.
 Vert pour une bonne note (>= 14), Jaune pour la moyenne, Rouge en dessous.
 */
function noteColor(note: number | string | null): string {
  const n = parseFloat(String(note ?? 0))
  
  return n >= 14 ? '#4ade80' : n >= 10 ? '#fbbf24' : '#f87171'
}


/*
Génère les initiales d'un étudiant pour son avatar (ex: "Alice Martin" -> "AM")
 */
function initials(prenom: string, nom: string) {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}


/* COMPOSANT : Panneau de détail */

/*
 Ce composant affiche le panneau latéral droit permettant au professeur de saisir, modifier et commenter la note d'un étudiant en particulier.
 */
function DetailPanel({
  inscrit,
  evaluation,
  noteExistante,
  onSave,
  saving,
}: {
  
  inscrit: Inscrit
  evaluation: Evaluation
  noteExistante: NoteExistante | null
  onSave: (etudiantId: number, note: number, commentaire: string) => void
  saving: boolean       // Permet de désactiver le bouton pendant la sauvegarde API
}) {

  // États locaux pour gérer la saisie en cours
  const [noteVal, setNoteVal] = useState(noteExistante?.note?.toString() ?? '')
  const [comment, setComment] = useState(noteExistante?.commentaire ?? '')


  // Si on change d'étudiant ou que la note est mise à jour depuis le serveur, 
  // on réinitialise les champs de saisie pour refléter la bonne donnée.
  useEffect(() => {
    setNoteVal(noteExistante?.note?.toString() ?? '')
    setComment(noteExistante?.commentaire ?? '')
  }, [inscrit.etudiant_id, noteExistante])


  // On remplace la virgule par un point pour que JavaScript puisse bien lire le nombre
  const parsed  = parseFloat(noteVal.replace(',', '.'))
  
  // Sécurité : la note n'est valide que si c'est un vrai nombre compris entre 0 et 20
  const isValid = !isNaN(parsed) && parsed >= 0 && parsed <= 20


  // Style réutilisable pour les champs de formulaire
  const input: React.CSSProperties = {
    background: '#111', border: '1px solid #2a2a2a', borderRadius: 10,
    color: '#fff', padding: '10px 14px', fontSize: 14, outline: 'none',
    width: '100%', transition: 'border-color 0.15s',
  }


  return (
    <div style={{
      background: '#161616', border: '1px solid #1f1f1f',
      borderRadius: 14, padding: '1.5rem', display: 'flex',
      flexDirection: 'column', gap: '1.25rem', height: 'fit-content',
      position: 'sticky', top: 0,
    }}>
      
      {/* En-tête : Informations de l'étudiant sélectionné */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700,
        }}>
          {initials(inscrit.prenom, inscrit.nom)}
        </div>

        <div>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>
            {inscrit.prenom} {inscrit.nom}
          </p>
          <p style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
            {inscrit.numero_etudiant} · {inscrit.filiere} · {inscrit.niveau}
          </p>
        </div>

      </div>


      {/* Rappel des informations de l'évaluation en cours de saisie */}
      <div style={{ padding: '10px 12px', borderRadius: 10, background: '#111', border: '1px solid #1f1f1f' }}>
        <p style={{ color: '#555', fontSize: 10, letterSpacing: '0.15em', marginBottom: 4 }}>ÉVALUATION</p>
        <p style={{ color: '#ccc', fontSize: 13, fontWeight: 600 }}>{evaluation.nom}</p>
        <p style={{ color: '#555', fontSize: 12, marginTop: 2 }}>
          Coefficient {evaluation.coefficient} · {evaluation.type}
        </p>
      </div>


      {/* Champ de saisie de la note sur 20 */}
      <div>
        <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.15em', marginBottom: 8 }}>
          {/* Le label change selon si on est en création ou en modification */}
          {noteExistante?.note !== null && noteExistante !== null ? 'MODIFIER LA NOTE' : 'SAISIR LA NOTE'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="text"
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            placeholder="0 – 20"
            style={{
              ...input,
              flex: 1,
              fontSize: 24, fontWeight: 700, fontFamily: 'monospace',
              color: isValid ? noteColor(parsed) : '#fff',
              textAlign: 'center',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
            onBlur={e  => { e.currentTarget.style.borderColor = '#2a2a2a' }}
          />
          <span style={{ color: '#444', fontSize: 18 }}>/20</span>
        </div>

        {/* Petite barre de progression visuelle qui se remplit selon la note */}
        {isValid && (
          <div style={{ height: 4, background: '#1f1f1f', borderRadius: 2, marginTop: 8 }}>
            <div style={{ height: '100%', width: `${(parsed / 20) * 100}%`, background: noteColor(parsed), borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        )}
      </div>


      {/* Champ de saisie du commentaire optionnel */}
      <div>
        <p style={{ color: '#555', fontSize: 11, letterSpacing: '0.15em', marginBottom: 8 }}>COMMENTAIRE (facultatif)</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Appréciation, remarques…"
          rows={3}
          style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
          onBlur={e  => { e.currentTarget.style.borderColor = '#2a2a2a' }}
        />
      </div>


      {/* Bouton de sauvegarde avec gestion des différents états (chargement, erreur, verrouillé) */}
      <button
        disabled={!isValid || saving || evaluation.verrouille}
        onClick={() => onSave(inscrit.etudiant_id, parsed, comment)}
        style={{
          background: isValid && !evaluation.verrouille ? ACCENT : '#1f1f1f',
          color: isValid && !evaluation.verrouille ? '#fff' : '#444',
          border: 'none', borderRadius: 10, padding: '12px',
          fontSize: 14, fontWeight: 700, cursor: isValid && !evaluation.verrouille ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s', width: '100%',
        }}
      >
        {saving ? 'Enregistrement…' : evaluation.verrouille ? 'Évaluation verrouillée' : 'Enregistrer & suivant →'}
      </button>

      
      {/* Message d'avertissement clair si le prof essaie de modifier une éval clôturée */}
      {evaluation.verrouille && (
        <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: -8 }}>
          Cette évaluation est verrouillée et ne peut plus être modifiée.
        </p>
      )}

    </div>
  )
}


/* PAGE PRINCIPALE DE SAISIE DES NOTES */



export default function SaisieNotesPage() {

  const { user } = useAuth()
  const qc       = useQueryClient()

  // États pour garder la trace de ce que l'utilisateur est en train de consulter
  const [selectedCoursId, setSelectedCoursId] = useState<number | null>(null)
  const [selectedEvalId,  setSelectedEvalId]  = useState<number | null>(null)
  const [selectedEtudId,  setSelectedEtudId]  = useState<number | null>(null)


  /*1. Récupération de l'ID du profil enseignant  */

  const { data: enseignantId } = useQuery({
    queryKey: ['profil-enseignant-id', user?.id],
    queryFn: async () => {
      const r    = await api.get('/enseignants')
      const list: Array<{ id: number; utilisateur_id: number }> = r.data
      
      return list.find(e => e.utilisateur_id === user!.id)?.id ?? null
    },
    // On lance la requête seulement si l'utilisateur est bien un prof
    enabled: !!user && user.role === 'enseignant',
  })


  /* 2. Récupération de la liste des cours de cet enseignant */

  const { data: dashData } = useQuery({
    queryKey: ['dashboard-enseignant'],
    queryFn: () => api.get('/dashboard/enseignant').then(r => r.data),
    enabled: !!user,
  })

  const cours: Cours[] = dashData?.cours ?? []


  // Auto-sélection intelligente : on pré-sélectionne le premier cours dès qu'il est chargé
  useEffect(() => {
    if (cours.length > 0 && !selectedCoursId) {
      setSelectedCoursId(cours[0].id)
    }
  }, [cours, selectedCoursId])


  /* 3. Récupération des évaluations liées au cours sélectionné  */

  const { data: evaluations = [] } = useQuery<Evaluation[]>({
    queryKey: ['evaluations', selectedCoursId],
    queryFn: () => api.get(`/evaluations?cours_id=${selectedCoursId}`).then(r => r.data),
    // Pas besoin de charger si aucun cours n'est cliqué
    enabled: !!selectedCoursId,
  })


  // Auto-sélection intelligente de l'évaluation
  useEffect(() => {
    if (evaluations.length > 0 && !selectedEvalId) {
      setSelectedEvalId(evaluations[0].id)
    } 
    // Si on change de cours et que l'ID de l'éval précédente n'existe plus, on reset au premier
    else if (evaluations.length > 0 && !evaluations.find(e => e.id === selectedEvalId)) {
      setSelectedEvalId(evaluations[0].id)
    }
  }, [evaluations, selectedEvalId])


  /* 4. Liste des étudiants inscrits au cours  */

  const { data: inscrits = [] } = useQuery<Inscrit[]>({
    queryKey: ['inscrits', selectedCoursId],
    queryFn: () => api.get(`/inscriptions?cours_id=${selectedCoursId}`).then(r => r.data),
    enabled: !!selectedCoursId,
  })


  /* 5. Récupération des notes existantes pour l'éval sélectionnée */

  const { data: notesExistantes = [] } = useQuery<NoteExistante[]>({
    queryKey: ['notes-eval', selectedEvalId],
    queryFn: () => api.get(`/notes?evaluation_id=${selectedEvalId}`).then(r => r.data),
    enabled: !!selectedEvalId,
  })

  // Optimisation : création d'une Map pour trouver une note instantanément sans faire de .find() à chaque fois
  const noteMap = new Map(notesExistantes.map(n => [n.etudiant_id, n]))


  /*6. Logique de sauvegarde (Mutation)  */

  const { mutate: saveNote, isPending: saving } = useMutation({
    mutationFn: async ({ etudiantId, note, commentaire }: { etudiantId: number; note: number; commentaire: string }) => {
      const existing = noteMap.get(etudiantId)
      
      // Si une note existe déjà, on fait une mise à jour (PUT)
      if (existing) {
        return api.put(`/notes/${existing.id}`, { note, commentaire })
      }
      
      // Sinon on en crée une nouvelle (POST)
      return api.post('/notes', {
        etudiant_id:   etudiantId,
        evaluation_id: selectedEvalId,
        note,
        commentaire,
        saisie_par:    user?.id,
      })
    },

    onSuccess: (_, { etudiantId }) => {
      // On rafraîchit la liste des notes pour avoir la donnée à jour
      qc.invalidateQueries({ queryKey: ['notes-eval', selectedEvalId] })
      qc.invalidateQueries({ queryKey: ['dashboard-enseignant'] })
      
      toast.success('Note enregistrée avec succès')
      
      // Fonctionnalité d'ergonomie : on passe automatiquement à l'étudiant suivant après avoir noté
      const idx  = inscrits.findIndex(i => i.etudiant_id === etudiantId)
      const next = inscrits[idx + 1]
      
      if (next) setSelectedEtudId(next.etudiant_id)
    },
    
    onError: () => toast.error('Erreur lors de l\'enregistrement de la note'),
  })


  /*VARIABLES DÉRIVÉES POUR L'AFFICHAGE */

  const selectedCours = cours.find(c => c.id === selectedCoursId) ?? null
  const selectedEval  = evaluations.find(e => e.id === selectedEvalId) ?? null
  
  // Par défaut, on sélectionne le premier étudiant de la liste s'il n'y en a pas
  const selectedEtud  = inscrits.find(i => i.etudiant_id === selectedEtudId) ?? inscrits[0] ?? null

  // Calcul du taux de remplissage pour la barre de progression
  const notedCount    = inscrits.filter(i => noteMap.has(i.etudiant_id) && noteMap.get(i.etudiant_id)!.note !== null).length
  const progressPct   = inscrits.length > 0 ? Math.round((notedCount / inscrits.length) * 100) : 0


  // Sécurité d'accès : on bloque complètement la page si ce n'est pas un prof ou un admin
  if (user?.role !== 'enseignant' && user?.role !== 'admin') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#555' }}>
        Accès refusé : Cette page est strictement réservée au corps enseignant.
      </div>
    )
  }


  return (
    <div style={{ background: '#111111', minHeight: '100%' }}>
      <div style={{ padding: '2rem 2.5rem' }}>

        {/* Fil d'Ariane (Breadcrumb) pour se repérer facilement */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.25rem' }}>
          {[
            selectedCours?.code ?? '…',
            selectedCours?.nom ?? '…',
            selectedEval?.nom ?? '…',
          ].map((crumb, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: i === arr.length - 1 ? '#888' : '#444', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {crumb}
              </span>
              {i < arr.length - 1 && <span style={{ color: '#2a2a2a' }}>›</span>}
            </span>
          ))}
        </div>


        {/* En-tête principal et bouton de verrouillage */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: '#fff', fontWeight: 700, lineHeight: 1.1 }}>
              Saisie des <span style={{ color: ACCENT, fontStyle: 'italic' }}>copies.</span>
            </h1>
            
            {/* Résumé des statistiques de l'évaluation sélectionnée */}
            {selectedEval && (
              <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>
                Coeff. {selectedEval.coefficient} · {inscrits.length} étudiants ·{' '}
                {notedCount} notés · {inscrits.length - notedCount} en attente
                
                {selectedEval.moyenne_classe !== null && (
                  <span> · Classe moyenne : <strong style={{ color: '#fff' }}>{selectedEval.moyenne_classe}/20</strong></span>
                )}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {/* Bouton pour clôturer définitivement les notes */}

          
            {selectedEval && !selectedEval.verrouille && (
              <button
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer',
                }}
                onClick={async () => {
                  if (confirm('Valider & verrouiller cette évaluation ? Cette action est irréversible.')) {
                    await api.put(`/evaluations/${selectedEvalId}/verrouiller`, {})
                    qc.invalidateQueries({ queryKey: ['evaluations', selectedCoursId] })
                    toast.success('Évaluation verrouillée avec succès')
                  }
                }}
              >
                Valider & clore
              </button>
            )}
          </div>

        </div>


        {/* Barre de progression globale du remplissage des notes */}
        {selectedEval && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#555', fontSize: 11, letterSpacing: '0.1em' }}>PROGRESSION DE SAISIE</span>
              <span style={{ color: '#888', fontSize: 11 }}>{notedCount}/{inscrits.length} ({progressPct}%)</span>
            </div>
            
            <div style={{ height: 5, background: '#1f1f1f', borderRadius: 3 }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: progressPct === 100 ? '#4ade80' : ACCENT,
                borderRadius: 3, transition: 'width 0.5s',
              }} />
            </div>
          </div>
        )}


        {/* Sélecteurs sous forme de "pilules" pour choisir le cours et l'évaluation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Bloc : Choix du cours */}
          <div>
            <p style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', marginBottom: 6 }}>COURS</p>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {cours.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCoursId(c.id); setSelectedEvalId(null) }}
                  style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: `1px solid ${selectedCoursId === c.id ? ACCENT : '#2a2a2a'}`,
                    background: selectedCoursId === c.id ? `rgba(232,69,37,0.1)` : 'transparent',
                    color: selectedCoursId === c.id ? '#fff' : '#666',
                  }}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Bloc : Choix de l'évaluation du cours sélectionné */}
          {evaluations.length > 0 && (
            <div>
              <p style={{ color: '#444', fontSize: 10, letterSpacing: '0.15em', marginBottom: 6 }}>ÉVALUATION</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {evaluations.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvalId(ev.id)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${selectedEvalId === ev.id ? '#3b82f6' : '#2a2a2a'}`,
                      background: selectedEvalId === ev.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: selectedEvalId === ev.id ? '#93c5fd' : '#666',
                    }}
                  >
                    {ev.nom}
                    {ev.verrouille && <span style={{ marginLeft: 4, opacity: 0.6 }}>🔒</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>


        {/* Structure principale : Liste des étudiants à gauche, Panneau de saisie à droite */}
        {selectedEval && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

            {/* Tableau contenant la liste des élèves */}
            <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, overflow: 'hidden' }}>
              
              {/* En-tête des colonnes */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 100px 90px',
                padding: '10px 16px', borderBottom: '1px solid #1f1f1f',
              }}>
                {['Étudiant', 'Numéro', 'Note', 'Statut'].map((h, i) => (
                  <span key={h} style={{ color: '#444', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, textAlign: i > 0 ? 'right' : 'left' }}>
                    {h}
                  </span>
                ))}
              </div>


              {/* Contenu du tableau */}
              {inscrits.length === 0 ? (
                
                <p style={{ color: '#444', fontSize: 13, padding: '2rem', textAlign: 'center' }}>
                  Aucun étudiant inscrit à ce cours pour le moment.
                </p>

              ) : (
                
                inscrits.map((inscrit, i) => {
                  const existing   = noteMap.get(inscrit.etudiant_id) ?? null
                  const hasNote    = existing?.note !== null && existing !== null
                  
                  // Permet de mettre en surbrillance l'étudiant en cours de traitement
                  const isSelected = selectedEtudId === inscrit.etudiant_id || (!selectedEtudId && i === 0)
                  const nc         = hasNote ? noteColor(existing!.note) : '#444'

                  return (
                    <div
                      key={inscrit.etudiant_id}
                      onClick={() => setSelectedEtudId(inscrit.etudiant_id)}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 120px 100px 90px',
                        padding: '11px 16px', cursor: 'pointer',
                        borderBottom: i < inscrits.length - 1 ? '1px solid #191919' : 'none',
                        background: isSelected ? '#1a1a1a' : 'transparent',
                        transition: 'background 0.1s',
                        alignItems: 'center',
                      }}
                    >
                      {/* Nom et Avatar miniature */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                        {isSelected && (
                          <div style={{ width: 3, height: 28, borderRadius: 2, background: ACCENT, flexShrink: 0 }} />
                        )}
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? ACCENT : '#222', border: '1px solid #333',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                        }}>
                          {initials(inscrit.prenom, inscrit.nom)}
                        </div>
                        <span style={{ color: '#ccc', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inscrit.prenom} {inscrit.nom}
                        </span>
                      </div>

                      {/* Numéro étudiant */}
                      <span style={{ color: '#555', fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>
                        {inscrit.numero_etudiant}
                      </span>

                      {/* Note obtenue */}
                      <span style={{ color: nc, fontSize: 13, fontWeight: 700, fontFamily: 'monospace', textAlign: 'right' }}>
                        {hasNote ? `${toNum(existing!.note)!.toFixed(1)}/20` : '—'}
                      </span>

                      {/* Badge d'avancement (SAISIR / NOTÉ) */}
                      <div style={{ textAlign: 'right' }}>
                        {hasNote ? (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
                            NOTÉ
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(232,69,37,0.08)', color: ACCENT, border: `1px solid ${ACCENT}33` }}>
                            SAISIR
                          </span>
                        )}
                      </div>

                    </div>
                  )
                })
              )}
            </div>


            {/* Injection du composant Panel latéral à droite */}
            {selectedEtud && (
              <DetailPanel
                inscrit={selectedEtud}
                evaluation={selectedEval}
                noteExistante={noteMap.get(selectedEtud.etudiant_id) ?? null}
                onSave={(etudiantId, note, commentaire) => saveNote({ etudiantId, note, commentaire })}
                saving={saving}
              />
            )}

          </div>
        )}

        {/* Message informatif si l'utilisateur a choisi un cours qui n'a pas encore d'évaluations paramétrées */}
        {!selectedEval && evaluations.length === 0 && selectedCoursId && (
          <div style={{ background: '#161616', border: '1px solid #1f1f1f', borderRadius: 14, padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#444', fontSize: 14 }}>Aucune évaluation créée pour ce cours.</p>
            <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>Créez d'abord une évaluation depuis la page Cours.</p>
          </div>
        )}

      </div>
    </div>
  )
}
