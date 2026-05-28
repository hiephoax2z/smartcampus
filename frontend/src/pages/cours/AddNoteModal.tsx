import { FormEvent, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Inscrit {
  id: number
  etudiant_id: number
  nom: string
  prenom: string
  numero_etudiant: string
}

interface Evaluation {
  id: number
  nom: string
  type: string
  verrouille: number
}

interface Props {
  coursId: number
  inscrits: Inscrit[]
  evaluations: Evaluation[]
  onClose: () => void
}

export default function AddNoteModal({ coursId, inscrits, evaluations, onClose }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [etudiantId, setEtudiantId]     = useState('')
  const [evaluationId, setEvaluationId] = useState('')
  const [note, setNote]                 = useState('')
  const [commentaire, setCommentaire]   = useState('')

  const evalDisponibles = evaluations.filter(ev => !ev.verrouille)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const noteVal = parseFloat(note)
    if (isNaN(noteVal) || noteVal < 0 || noteVal > 20) {
      setError('La note doit être comprise entre 0 et 20')
      return
    }

    setLoading(true)
    try {
      await api.post('/notes', {
        etudiant_id:   parseInt(etudiantId),
        evaluation_id: parseInt(evaluationId),
        note:          noteVal,
        commentaire:   commentaire || null,
        saisie_par:    user?.id,
      })
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['notes-cours', String(coursId)] })
      setTimeout(onClose, 800)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Saisir une note</h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded">Note enregistrée !</p>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Étudiant <span className="text-red-500">*</span>
            </label>
            <select required value={etudiantId} onChange={e => setEtudiantId(e.target.value)}
              className={select}>
              <option value="">— Choisir un étudiant —</option>
              {inscrits.map(i => (
                <option key={i.etudiant_id} value={i.etudiant_id}>
                  {i.prenom} {i.nom} ({i.numero_etudiant})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Évaluation <span className="text-red-500">*</span>
            </label>
            {evalDisponibles.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
                Toutes les évaluations sont verrouillées.
              </p>
            ) : (
              <select required value={evaluationId} onChange={e => setEvaluationId(e.target.value)}
                className={select}>
                <option value="">— Choisir une évaluation —</option>
                {evalDisponibles.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nom} ({ev.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Note /20 <span className="text-red-500">*</span>
              </label>
              <input type="number" required min="0" max="20" step="0.25"
                value={note} onChange={e => setNote(e.target.value)}
                className={select} placeholder="Ex : 14.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Commentaire</label>
            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
              className={`${select} h-16 resize-none`}
              placeholder="Observation facultative…" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit"
              disabled={loading || success || evalDisponibles.length === 0}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? 'Enregistrement…' : 'Enregistrer la note'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const select = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
