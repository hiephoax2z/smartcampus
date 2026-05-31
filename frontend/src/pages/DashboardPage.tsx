import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  return <div>Dashboard</div>
}
