import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

const NIVEAUX   = ['L1', 'L2', 'L3', 'M1', 'M2']
const SEMESTRES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10']

interface Enseignant {
  id: number
  nom: string
  prenom: string
  departement: string
}

export default function CreateCoursPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({
    code: '', nom: '', description: '',
    credits: '3', coefficient: '1.0', capacite_max: '30',
    niveau: 'L3', semestre: 'S5',
    annee_academique: '', departement: '',
    enseignant_id: '',
  })

  const { data: enseignants = [] } = useQuery<Enseignant[]>({
    queryKey: ['enseignants'],
    queryFn: () => api.get('/enseignants').then(r => r.data),
  })

  function set(key: string, value: string) {
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/cours', {
        ...fields,
        credits:       parseInt(fields.credits),
        coefficient:   parseFloat(fields.coefficient),
        capacite_max:  parseInt(fields.capacite_max),
        enseignant_id: fields.enseignant_id ? parseInt(fields.enseignant_id) : null,
      })
      navigate('/cours')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/cours" className="text-sm text-blue-600 hover:underline">← Retour</Link>
        <h1 className="text-xl font-bold text-gray-800">Ajouter un cours</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Code" required>
            <input type="text" required value={fields.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              className={input} placeholder="INF301" />
          </Field>
          <Field label="Département">
            <input type="text" value={fields.departement}
              onChange={e => set('departement', e.target.value)}
              className={input} placeholder="Informatique" />
          </Field>
        </div>

        <Field label="Nom du cours" required>
          <input type="text" required value={fields.nom}
            onChange={e => set('nom', e.target.value)}
            className={input} placeholder="Algorithmique avancée" />
        </Field>

        <Field label="Description">
          <textarea value={fields.description}
            onChange={e => set('description', e.target.value)}
            className={`${input} h-20 resize-none`}
            placeholder="Contenu du cours…" />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Crédits">
            <input type="number" min="1" max="30" value={fields.credits}
              onChange={e => set('credits', e.target.value)} className={input} />
          </Field>
          <Field label="Coefficient">
            <input type="number" min="0.5" max="5" step="0.5" value={fields.coefficient}
              onChange={e => set('coefficient', e.target.value)} className={input} />
          </Field>
          <Field label="Capacité max">
            <input type="number" min="1" max="500" value={fields.capacite_max}
              onChange={e => set('capacite_max', e.target.value)} className={input} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Niveau">
            <select value={fields.niveau} onChange={e => set('niveau', e.target.value)} className={input}>
              {NIVEAUX.map(n => <option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Semestre">
            <select value={fields.semestre} onChange={e => set('semestre', e.target.value)} className={input}>
              {SEMESTRES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Année académique">
            <input type="text" value={fields.annee_academique}
              onChange={e => set('annee_academique', e.target.value)}
              className={input} placeholder="2024-2025" />
          </Field>
        </div>

        <Field label="Enseignant responsable">
          <select value={fields.enseignant_id} onChange={e => set('enseignant_id', e.target.value)} className={input}>
            <option value="">— Aucun —</option>
            {enseignants.map(en => (
              <option key={en.id} value={en.id}>
                {en.prenom} {en.nom} ({en.departement})
              </option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Enregistrement…' : 'Créer le cours'}
          </button>
          <Link to="/cours"
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
