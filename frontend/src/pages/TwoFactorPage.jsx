import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import {API_BASE_URL} from "../api/config.js";

function TwoFactorPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const tempToken = localStorage.getItem('tempToken')
    if (!tempToken) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code })
      })

      if (!response.ok) {
        setError('Invalid code. Please try again.')
        return
      }

      const data = await response.json()

      // clear temp token and save real session
      localStorage.removeItem('tempToken')
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('username', data.username)
      localStorage.setItem('email', data.email)

      navigate('/profile')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">Two-Factor Authentication</h2>
            <p className="text-muted mb-4">
              Enter the 6-digit code from your authenticator app.
            </p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-semibold">Authentication code</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn w-100"
                style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
              >
                Verify
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}

export default TwoFactorPage