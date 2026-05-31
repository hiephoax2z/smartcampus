GIT_AUTHOR_DATE="2026-04-10T09:00:00" GIT_COMMITTER_DATE="2026-04-10T09:00:00" git commit -m "init: setup DashboardPage"
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return <div>Dashboard</div>
}
