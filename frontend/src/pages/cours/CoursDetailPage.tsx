import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import AddNoteModal from './AddNoteModal'

/*
 Composant principal de la page de détails d'un cours.
 Il rassemble et affiche toutes les infos : la description,  les séances, les évaluations et les étudiants inscrits.
 */
export default function CoursDetailPage() {
  // On récupère l'ID du cours directement depuis l'URL
  const { id } = useParams<{ id: string }>()

  // On récupère l'utilisateur actuel pour gérer ce qu'il a le droit de voir ou faire
  const { user } = useAuth()

  // Petit état local pour savoir si la fenêtre d'ajout de note est ouverte
  const [modalOpen, setModalOpen] = useState(false)

  // Requête pour obtenir les infos générales du cours
  const { data: cours, isLoading } = useQuery({
    queryKey: ['cours', id],
    queryFn: () => api.get(`/cours/${id}`).then((r) => r.data),
  })

  //  On récupère la liste des étudiants qui participent à ce cours
  const { data: inscrits = [] } = useQuery({
    queryKey: ['inscrits-cours', id],
    queryFn: () => api.get(`/inscriptions?cours_id=${id}`).then((r) => r.data),
    // On lance la requête seulement si on a bien récupéré un ID
    enabled: !!id,
  })

  //  Récupération de tous les examens et devoirs prévus
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-cours', id],
    queryFn: () => api.get(`/evaluations?cours_id=${id}`).then((r) => r.data),
    enabled: !!id,
  })

  // On récupère l'emploi du temps (les différentes séances de ce cours)
  const { data: seances = [] } = useQuery({
    queryKey: ['seances-cours', id],
    queryFn: () => api.get(`/seances?cours_id=${id}`).then((r) => r.data),
    enabled: !!id,
  })

  // On affiche un petit texte de patience le temps que le serveur réponde
  if (isLoading) return <p className="p-6 text-gray-500">Chargement…</p>

  // Sécurité au cas où l'utilisateur arrive sur un cours qui n'existe pas
  if (!cours) return <p className="p-6 text-red-500">Cours introuvable</p>

  // On vérifie si la personne connectée a l'autorisation de donner des notes
  const canSaisirNote = user?.role === 'admin' || user?.role === 'enseignant'

  return (
    <div className="p-6 space-y-6 max-w-3xl">

      {/* En-tête avec le lien de retour et le bouton d'action */}
      <div className="flex items-center justify-between">
        <Link to="/cours" className="text-sm text-blue-600 hover:underline">
          ← Retour aux cours
        </Link>

        {/* Le bouton n'apparaît que si l'utilisateur est un prof ou un admin */}
        {canSaisirNote && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Saisir une note
          </button>
        )}
      </div>

      {/* Bloc des infos générales du cours (nom, crédits, détails) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-sm text-blue-600">{cours.code}</span>
            <h1 className="text-2xl font-bold text-gray-800">{cours.nom}</h1>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
            {cours.credits} crédits
          </span>
        </div>

        {/* On affiche la description seulement s'il y en a une renseignée */}
        {cours.description && (
          <p className="text-sm text-gray-600 mt-2">{cours.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          <span className="text-gray-500">Niveau</span>
          <span className="font-medium">{cours.niveau}</span>
          <span className="text-gray-500">Semestre</span>
          <span className="font-medium">{cours.semestre}</span>
          <span className="text-gray-500">Enseignant</span>
          <span className="font-medium">{cours.enseignant_nom ?? '—'}</span>
          <span className="text-gray-500">Inscrits</span>
          <span className="font-medium">{inscrits.length} / {cours.capacite_max}</span>
        </div>
      </div>

      {/* Bloc des séances (horaires et salles) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <h2 className="font-semibold text-gray-700">Séances ({seances.length})</h2>

        {/* Message explicite si l'emploi du temps est encore vide */}
        {seances.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune séance</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {seances.map((s: { id: number; jour_semaine: string; heure_debut: string; heure_fin: string; type: string; salle_nom?: string }) => (
              <li key={s.id} className="flex gap-3 items-center">
                <span className="capitalize w-24 text-gray-600">{s.jour_semaine}</span>
                <span className="text-gray-800">{s.heure_debut} – {s.heure_fin}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{s.type}</span>

                {/* La salle s'affiche à droite uniquement si elle a été assignée */}
                {s.salle_nom && <span className="ml-auto text-gray-400 text-xs">{s.salle_nom}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bloc des évaluations (devoirs, partiels, etc.) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <h2 className="font-semibold text-gray-700">Évaluations ({evaluations.length})</h2>

        {evaluations.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune évaluation</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {evaluations.map((ev: { id: number; nom: string; type: string; coefficient: number; date_evaluation?: string; verrouille: number; moyenne_classe?: number }) => (
              <li key={ev.id} className="flex gap-3 items-center">
                <span className="flex-1 font-medium text-gray-800">{ev.nom}</span>
                <span className="text-gray-400 text-xs">{ev.type}</span>
                <span className="text-gray-400 text-xs">coeff. {ev.coefficient}</span>

                {/* Petit badge pour voir rapidement si l'évaluation est encore ouverte */}
                {ev.verrouille ? (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">🔒</span>
                ) : (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Ouvert</span>
                )}

                {/* Affichage de la moyenne de la classe si elle existe */}
                {ev.moyenne_classe != null && (
                  <span className="text-blue-600 font-bold text-xs">{ev.moyenne_classe}/20</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bloc de la liste des étudiants inscrits */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <h2 className="font-semibold text-gray-700">Étudiants inscrits ({inscrits.length})</h2>

        {inscrits.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun étudiant inscrit</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {inscrits.map((i: { etudiant_id: number; nom: string; prenom: string; email: string; numero_etudiant: string }) => (
              <li key={i.etudiant_id} className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-400 w-28">{i.numero_etudiant}</span>
                <span className="font-medium text-gray-800">{i.prenom} {i.nom}</span>
                <span className="ml-auto text-gray-400 text-xs">{i.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fenêtre modale qui s'affiche par-dessus quand on veut ajouter une note */}
      {modalOpen && (
        <AddNoteModal
          coursId={Number(id)}
          inscrits={inscrits}
          evaluations={evaluations}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
