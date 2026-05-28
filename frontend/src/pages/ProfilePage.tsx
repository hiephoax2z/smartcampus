import { useState, FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'

export default function ProfilePage() {
  const { user } = useAuth()
  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')

  // Charge le profil étendu selon le rôle
  const { data: profil } = useQuery({
    queryKey: ['profil-detail', user?.id],
    queryFn: async () => {
      if (user?.role === 'etudiant') {
        const r = await api.get('/etudiants')
        return (r.data as Array<{ utilisateur_id: number } & Record<string, unknown>>)
          .find(e => e.utilisateur_id === user.id) ?? null
      }
      if (user?.role === 'enseignant') {
        const r = await api.get('/enseignants')
        return (r.data as Array<{ utilisateur_id: number } & Record<string, unknown>>)
          .find(e => e.utilisateur_id === user.id) ?? null
      }
      return null
    },
    enabled: !!user && user.role !== 'admin',
  })

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async () => {
      if (!profil) return
      const endpoint = user?.role === 'etudiant'
        ? `/etudiants/${(profil as { id: number }).id}`
        : `/enseignants/${(profil as { id: number }).id}`
      await api.put(endpoint, { password })
    },
    onSuccess: () => {
      toast.success('Mot de passe mis à jour')
      setPassword('')
      setPassword2('')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('Minimum 6 caractères'); return }
    if (password !== password2) { toast.error('Les mots de passe ne correspondent pas'); return }
    changePassword()
  }

  const roleLabel = { admin: 'Administrateur', enseignant: 'Enseignant', etudiant: 'Étudiant' }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mon profil</h1>

      {/* Infos principales */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user?.prenom} {user?.nom}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded capitalize">
              {user?.role ? roleLabel[user.role] : ''}
            </span>
          </div>
        </div>

        {/* Infos spécifiques au rôle */}
        {profil && (
          <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-50 pt-4">
            {user?.role === 'etudiant' && (
              <>
                <InfoRow label="N° étudiant"    value={(profil as Record<string, unknown>).numero_etudiant as string} />
                <InfoRow label="Niveau"          value={(profil as Record<string, unknown>).niveau as string} />
                <InfoRow label="Filière"         value={(profil as Record<string, unknown>).filiere as string} />
                <InfoRow label="Année acad."     value={(profil as Record<string, unknown>).annee_academique as string} />
                <InfoRow label="Statut"          value={(profil as Record<string, unknown>).statut as string} />
                <InfoRow label="Téléphone"       value={(profil as Record<string, unknown>).telephone as string} />
              </>
            )}
            {user?.role === 'enseignant' && (
              <>
                <InfoRow label="N° enseignant"  value={(profil as Record<string, unknown>).numero_enseignant as string} />
                <InfoRow label="Département"    value={(profil as Record<string, unknown>).departement as string} />
                <InfoRow label="Grade"          value={(profil as Record<string, unknown>).grade as string} />
                <InfoRow label="Téléphone"      value={(profil as Record<string, unknown>).telephone as string} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Changer le mot de passe */}
      {user?.role !== 'admin' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-700">Changer le mot de passe</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className={inp} placeholder="Minimum 6 caractères" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Confirmer</label>
              <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                className={inp} placeholder="Répéter le mot de passe" />
            </div>
            <button type="submit" disabled={isPending || !password}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {isPending ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value || '—'}</span>
    </>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
