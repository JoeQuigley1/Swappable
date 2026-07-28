import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import ItemGrid from '../components/ItemGrid.jsx'
import ItemList from '../components/ItemList.jsx'
import { getPublicProfile } from '../api/users.js'
import { toCardItem } from '../api/items.js'
import { BRAND_COLOR } from '../lib/constants.js'

// public read-only profile: a member and the items they have listed
export default function UserProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('cards')
  const [page, setPage] = useState(0)

  // public profiles are keyed by numeric id; "me" is not a public profile
  const isNumericId = /^\d+$/.test(id)

  // start from the first page when viewing a different member
  useEffect(() => {
    setPage(0)
  }, [id])

  useEffect(() => {
    if (!isNumericId) return
    const loadProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicProfile(id, page)
        setProfile(data)
      } catch {
        setError('Could not load this member.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [id, isNumericId, page])

  // /users/me should go to your own profile, or login when logged out
  if (id === 'me') {
    const loggedIn = !!localStorage.getItem('token')
    return <Navigate to={loggedIn ? '/profile' : '/login'} replace />
  }

  // any other non-numeric id can never be a valid public profile
  if (!isNumericId) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="container pt-2 pb-5 text-center py-5">
        <div className="spinner-border" style={{ color: BRAND_COLOR }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container pt-2 pb-5">
        <div className="alert alert-warning">{error}</div>
      </div>
    )
  }

  const paged = profile.items ?? {}
  const items = (paged.content ?? []).map(toCardItem)
  const totalPages = paged.totalPages ?? 0
  const totalElements = paged.totalElements ?? items.length

  return (
    <div className="container pt-2 pb-5">
      {/* member header */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4 d-flex align-items-center">
          <div
            className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3 flex-shrink-0"
            style={{ width: 64, height: 64 }}
          >
            <i className="bi bi-person" style={{ fontSize: '2rem', color: BRAND_COLOR }}></i>
          </div>
          <div>
            <h3 className="fw-semibold mb-1">{profile.username}</h3>
            {profile.location && (
              <p className="text-muted mb-0">
                <i className="bi bi-geo-alt me-1"></i>
                {profile.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* member's listed items */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">
          Listings <span className="text-muted fw-normal">({totalElements})</span>
        </h4>
        <div className="btn-group" role="group" aria-label="View mode">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('cards')}
            aria-pressed={viewMode === 'cards'}
          >
            <i className="bi bi-grid"></i>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            <i className="bi bi-list-ul"></i>
          </button>
        </div>
      </div>
      {viewMode === 'cards' ? <ItemGrid items={items} /> : <ItemList items={items} />}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4 mb-4">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="text-muted small">Page {page + 1} of {totalPages}</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
