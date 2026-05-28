import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'

export default function EtudiantDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: etudiant, isLoading } = useQuery({
    queryKey: ['etudiant', id],
    queryFn: () => api.get(`/etudiants/${id}`).then((r) => r.data),
  })

  const { data: notes } = useQuery({
    queryKey: ['notes-etudiant', id],
    queryFn: () => api.get(`/notes?etudiant_id=${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: inscriptions = [] } = useQuery({
    queryKey: ['inscriptions-etudiant', id],
    queryFn: () => api.get(`/inscriptions?etudiant_id=${id}`).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <p className="p-6 text-gray-500">Chargement…</p>
  if (!etudiant) return <p className="p-6 text-red-500">Étudiant introuvable</p>

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Link to="/etudiants" className="text-sm text-blue-600 hover:underline">
        ← Retour à la liste
      </Link>

      <div className="bg-white rounded-xl border p-6 space-y-2">
        <h1 className="text-2xl font-bold text-gray-800">
          {etudiant.prenom} {etudiant.nom}
        </h1>
        <p className="text-sm text-gray-500">{etudiant.email}</p>
        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
          <span className="text-gray-500">N° étudiant</span>
          <span className="font-medium">{etudiant.numero_etudiant}</span>
          <span className="text-gray-500">Niveau</span>
          <span className="font-medium">{etudiant.niveau}</span>
          <span className="text-gray-500">Filière</span>
          <span className="font-medium">{etudiant.filiere}</span>
          <span className="text-gray-500">Statut</span>
          <span className="font-medium capitalize">{etudiant.statut}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold text-gray-700">
          Cours inscrits ({inscriptions.length})
        </h2>
        {inscriptions.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune inscription</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {inscriptions.map((i: { id: number; cours_code: string; cours_nom: string; semestre: string }) => (
              <li key={i.id} className="flex gap-2">
                <span className="font-mono text-blue-600">{i.cours_code}</span>
                <span>{i.cours_nom}</span>
                <span className="text-gray-400 ml-auto">{i.semestre}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notes && (
        <div className="bg-white rounded-xl border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Notes</h2>
            {notes.moyenne !== null && (
              <span className="text-sm font-bold text-blue-600">
                Moyenne : {notes.moyenne}/20
              </span>
            )}
          </div>
          {notes.notes.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune note</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {notes.notes.map((n: { id: number; cours_code: string; evaluation_nom: string; note: number | null }) => (
                <li key={n.id} className="flex gap-2">
                  <span className="font-mono text-gray-500">{n.cours_code}</span>
                  <span className="flex-1">{n.evaluation_nom}</span>
                  <span className="font-bold">
                    {n.note !== null ? `${n.note}/20` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
