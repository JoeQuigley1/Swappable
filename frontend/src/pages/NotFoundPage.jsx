import { useNavigate } from 'react-router-dom'

// shown when user visits a URL that does not exist
function NotFoundPage() {

  const navigate = useNavigate()

  return (
    <div className="text-center py-5">
      <h1 className="display-1 fw-bold text-muted">404</h1>
      <h2 className="mb-3">Page not found</h2>
      <p className="text-muted mb-4">
        The page you are looking for does not exist.
      </p>
      <button
        className="btn btn-outline-secondary"
        onClick={() => navigate('/')}
      >
        Go back home
      </button>
    </div>
  )
}

export default NotFoundPage