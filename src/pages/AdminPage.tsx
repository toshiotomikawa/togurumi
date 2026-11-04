import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

function AdminPage() {
  const { messages } = useLocale()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const name = user?.displayName || user?.username || ''

  async function onLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page admin-page">
      <section className="hero hero--admin">
        <span className="hero__eyebrow">{messages.auth.adminNav}</span>
        <h1>{messages.auth.adminWelcome}</h1>
        <p>
          {messages.auth.loggedInAs} <strong>{name}</strong>
        </p>
      </section>

      <div className="card-grid admin-grid">
        <Link to="/admin/journal" className="card admin-card-link">
          <h2>{messages.auth.adminJournalCardTitle}</h2>
          <p>{messages.auth.adminJournalCardBody}</p>
        </Link>
        <Link to="/admin/products" className="card admin-card-link">
          <h2>{messages.auth.adminImagesCardTitle}</h2>
          <p>{messages.auth.adminImagesCardBody}</p>
        </Link>
        <Link to="/admin/refunds" className="card admin-card-link">
          <h2>{messages.auth.adminRefundsCardTitle}</h2>
          <p>{messages.auth.adminRefundsCardBody}</p>
        </Link>
      </div>

      <div className="admin-actions">
        <button type="button" className="button" onClick={onLogout}>
          {messages.auth.logout}
        </button>
      </div>
    </div>
  )
}

export default AdminPage
