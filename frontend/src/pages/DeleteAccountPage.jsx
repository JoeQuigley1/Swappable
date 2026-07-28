import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { deleteMyAccount } from '../api/users'
import { clearSession } from '../lib/auth'

// phrase the user must type to enable the delete button
const CONFIRM_PHRASE = 'DELETE'

// permanent account deletion screen, reached from the profile danger zone
function DeleteAccountPage() {
  const navigate = useNavigate()

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // guard the page: only a logged-in user can delete their account
  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/login')
  }, [navigate])

  const canDelete = confirmText.trim() === CONFIRM_PHRASE && !deleting

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteMyAccount()
      clearSession()
      navigate('/', { state: { accountDeleted: true } })
    } catch (err) {
      if (err.message === 'unauthenticated') {
        clearSession()
        navigate('/login')
        return
      }
      setError('Could not delete your account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <div className="card shadow-sm mt-4 border-danger">
          <div className="card-body p-4">

            <h2 className="card-title text-danger mb-1">Delete Account</h2>
            <p className="text-muted mb-4">
              This permanently deletes your account and cannot be undone.
            </p>

            <div className="alert alert-danger">
              Your profile, items and swap requests will be removed for good.
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="mb-4">
              <label className="form-label fw-semibold">
                Type {CONFIRM_PHRASE} to confirm
              </label>
              <input
                type="text"
                className="form-control"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
              />
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-danger flex-fill"
                onClick={handleDelete}
                disabled={!canDelete}
              >
                {deleting ? 'Deleting...' : 'Delete my account'}
              </button>
              <button
                className="btn btn-outline-secondary flex-fill"
                onClick={() => navigate('/profile')}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountPage
