import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/client'

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2']

export default function CreateEtudiantPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({
    nom: '', prenom: '', email: '', password: '',
    numero_etudiant: '', niveau: 'L1',
    filiere: '', annee_academique: '',
  })

  function set(key: string, value: string) {
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/etudiants', fields)
      navigate('/etudiants')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/etudiants" className="text-sm text-blue-600 hover:underline">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Ajouter un étudiant</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom" required>
            <input type="text" required value={fields.prenom}
              onChange={e => set('prenom', e.target.value)} className={input} />
          </Field>
          <Field label="Nom" required>
            <input type="text" required value={fields.nom}
              onChange={e => set('nom', e.target.value)} className={input} />
          </Field>
        </div>

        <Field label="Email" required>
          <input type="email" required value={fields.email}
            onChange={e => set('email', e.target.value)} className={input}
            placeholder="prenom.nom@etu.smartcampus.fr" />
        </Field>

        <Field label="Mot de passe" required>
          <input type="password" required value={fields.password}
            onChange={e => set('password', e.target.value)} className={input}
            placeholder="Minimum 8 caractères" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Numéro étudiant" required>
            <input type="text" required value={fields.numero_etudiant}
              onChange={e => set('numero_etudiant', e.target.value)}
              className={input} placeholder="ETU-2024-006" />
          </Field>
          <Field label="Niveau" required>
            <select value={fields.niveau} onChange={e => set('niveau', e.target.value)} className={input}>
              {NIVEAUX.map(n => <option key={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Filière">
          <input type="text" value={fields.filiere}
            onChange={e => set('filiere', e.target.value)}
            className={input} placeholder="Informatique, Réseaux…" />
        </Field>

        <Field label="Année académique">
          <input type="text" value={fields.annee_academique}
            onChange={e => set('annee_academique', e.target.value)}
            className={input} placeholder="2024-2025" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Enregistrement…' : 'Créer l\'étudiant'}
          </button>
          <Link to="/etudiants"
            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
