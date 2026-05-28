import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { key: 'etudiant',   label: 'Étudiant',   placeholder: 'prenom.nom@etu.smartcampus.fr' },
  { key: 'enseignant', label: 'Enseignant', placeholder: 'prenom.nom@smartcampus.fr'     },
  { key: 'admin',      label: 'Admin',      placeholder: 'admin@smartcampus.fr'           },
]

const SERIF  = "'Playfair Display', Georgia, serif"
const ACCENT = '#E84525'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [role,     setRole]     = useState('etudiant')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const currentRole = ROLES.find(r => r.key === role)!

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Identifiants invalides. Vérifiez votre email et mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Panneau gauche ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[56%] flex-col"
        style={{ background: '#0a0a0a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-12 py-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center font-bold text-white text-sm"
              style={{ background: ACCENT }}>
              P
            </div>
            <div>
              <p className="text-white text-xs font-bold tracking-[0.2em]">POLYNUM</p>
              <p className="text-xs tracking-[0.2em]" style={{ color: '#555' }}>SMART CAMPUS</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: '#555' }}>
            Besoin d'aide ?{' '}
            <span style={{ color: ACCENT }} className="cursor-pointer hover:opacity-80 transition">
              support@polynum.fr →
            </span>
          </p>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col justify-center px-12 pb-12">
          <p className="text-xs tracking-[0.2em] mb-10" style={{ color: '#555' }}>
            <span style={{ color: ACCENT }}>●</span>
            {' '}PLATEFORME ACADÉMIQUE · 2025-2026
          </p>

          <div style={{ fontFamily: SERIF, lineHeight: 1.05 }}>
            <h1 className="text-white font-bold" style={{ fontSize: '4rem' }}>
              La gestion
            </h1>
            <h1 className="font-bold italic" style={{ fontSize: '4rem', color: ACCENT }}>
              académique
            </h1>
            <h1 className="text-white font-bold" style={{ fontSize: '4rem' }}>
              de notre <span className="italic">époque.</span>
            </h1>
          </div>

          <p className="mt-8 mb-10 leading-relaxed text-[0.95rem] max-w-md" style={{ color: '#888' }}>
            Étudiants, enseignants et scolarité. Un seul espace, des
            permissions claires. Inscriptions, notes, emplois du temps,
            présences — sans friction.
          </p>

          {/* Stats */}
          <div className="pt-8 flex gap-14" style={{ borderTop: '1px solid #1f1f1f' }}>
            {[
              { val: 'v 4.2',  sub: 'BUILD STABLE' },
              { val: '3 rôles', sub: 'ÉTUDIANT · ENSEIGNANT · ADMIN' },
              { val: 'RGPD',   sub: 'DONNÉES HÉBERGÉES EN FRANCE' },
            ].map(s => (
              <div key={s.val}>
                <p className="text-white font-bold text-lg" style={{ fontFamily: 'monospace' }}>{s.val}</p>
                <p className="text-xs tracking-[0.15em] mt-1" style={{ color: '#444' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-12 py-5"
          style={{ borderTop: '1px solid #141414' }}>
          {[
            'POLYNUM · ÉCOLE NATIONALE D\'INGÉNIEURS NUMÉRIQUES',
            null,
            '© 2026 POLYNUM',
            'MENTIONS · CONFIDENTIALITÉ · STATUT',
          ].map((t, i) =>
            t === null ? (
              <p key={i} className="text-xs" style={{ color: '#555' }}>
                <span className="text-green-500">●</span> TOUS LES SERVICES OPÉRATIONNELS
              </p>
            ) : (
              <p key={i} className="text-xs tracking-wider" style={{ color: '#444' }}>{t}</p>
            )
          )}
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ─────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: '#111111' }}
      >
        <div className="w-full max-w-[400px]">

          <p className="text-xs tracking-[0.2em] mb-4" style={{ color: '#555' }}>CONNEXION</p>

          <h2 className="text-white mb-2 font-bold" style={{ fontFamily: SERIF, fontSize: '2.4rem' }}>
            Bon retour.
          </h2>
          <p className="text-sm mb-8" style={{ color: '#888' }}>
            Connectez-vous avec votre identifiant institutionnel.
          </p>

          {/* Sélecteur de rôle */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: '#1a1a1a' }}>
            {ROLES.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all"
                style={role === r.key
                  ? { background: '#2a2a2a', color: '#fff' }
                  : { color: '#666' }
                }
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(232,69,37,0.1)', color: '#ff7a5a', border: '1px solid rgba(232,69,37,0.2)' }}>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs tracking-[0.15em]" style={{ color: '#555' }}>
                IDENTIFIANT
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={currentRole.placeholder}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#fff',
                  outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
                onBlur={e =>  { e.currentTarget.style.borderColor = '#2a2a2a' }}
                className="w-full rounded-xl px-4 py-3.5 text-sm transition placeholder-[#444]"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-[0.15em]" style={{ color: '#555' }}>
                  MOT DE PASSE
                </label>
                <button type="button" className="text-xs transition hover:opacity-70"
                  style={{ color: '#888' }}>
                  Oublié ?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  color: '#fff',
                  outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
                onBlur={e =>  { e.currentTarget.style.borderColor = '#2a2a2a' }}
                className="w-full rounded-xl px-4 py-3.5 text-sm transition"
              />
            </div>

            {/* Remember */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setRemember(r => !r)}
                className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition"
                style={{
                  background: remember ? ACCENT : '#2a2a2a',
                  border: `1px solid ${remember ? ACCENT : '#3a3a3a'}`,
                }}
              >
                {remember && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
              </div>
              <span className="text-sm" style={{ color: '#888' }}>
                Garder ma session active pendant 30 jours
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-4 text-sm font-semibold flex items-center justify-between px-6 transition-opacity disabled:opacity-50 mt-2"
              style={{ background: ACCENT, color: '#fff' }}
            >
              <span>{loading ? 'Connexion en cours…' : 'Accéder à mon espace'}</span>
              {!loading && <span className="text-base">→</span>}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1" style={{ borderTop: '1px solid #222' }} />
            <span className="text-xs" style={{ color: '#555' }}>OU</span>
            <div className="flex-1" style={{ borderTop: '1px solid #222' }} />
          </div>

          {/* ENT */}
          <button
            type="button"
            className="w-full rounded-xl py-3.5 text-sm font-medium flex items-center justify-center gap-3 transition"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#222' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
          >
            <span style={{ color: '#555' }}>●</span>
            Continuer avec l'ENT national
          </button>
        </div>
      </div>
    </div>
  )
}
