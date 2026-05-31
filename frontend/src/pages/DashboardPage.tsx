GIT_AUTHOR_DATE="2026-04-13T11:00:00" GIT_COMMITTER_DATE="2026-04-13T11:00:00" git commit -m "feat: add role-based routing"
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin')      return <DashboardAdmin />
  if (user.role === 'enseignant') return <DashboardEnseignant />
  return <DashboardEtudiant />
}

function DashboardAdmin() {
  return <div>Admin</div>
}

function DashboardEnseignant() {
  return <div>Enseignant</div>
}

function DashboardEtudiant() {
  return <div>Etudiant</div>
}
