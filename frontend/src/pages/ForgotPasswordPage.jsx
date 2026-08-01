import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import {API_BASE_URL} from "../api/config.js";

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const validateEmail = (value) => {
    const trimmedEmail = value.trim()

    if (!trimmedEmail) {
      return 'Email is required.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Please enter a valid email address.'
    }

    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const emailError = validateEmail(email)

    if (emailError) {
      setValidationError(emailError)
      return
    }

    try {
      await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim()
        })
      })
      // always show confirmation regardless of whether email exists
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">
            <h2 className="card-title mb-1">Forgot your password?</h2>
            <p className="text-muted mb-4">
              Enter your email and we'll send you a reset link.
            </p>

            {submitted ? (
              <div className="alert alert-success">
                If that email is registered, you will receive a reset link shortly.
                Please check your spam folder too.
              </div>
            ) : (
              <>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className={`form-control ${
                          validationError ? 'is-invalid' : ''
                      }`}
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(validationError)}
                      aria-describedby={
                        validationError ? 'forgot-email-error' : undefined
                      }
                    />
                    {validationError && (
                        <div
                            id="forgot-email-error"
                            className="invalid-feedback"
                        >
                          {validationError}
                        </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn w-100"
                    style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
                  >
                    Send reset link
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-muted mt-3 mb-0">
              Remember your password? <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage