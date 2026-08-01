import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import {API_BASE_URL} from "../api/config.js";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [validationErrors, setValidationErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    const errors = {}

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required.'
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.'
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))

    setValidationErrors((previous) => ({
      ...previous,
      [name]: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.newPassword })
      })

      if (!response.ok) {
        setError('This reset link is invalid or has expired. Please request a new one.')
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
  }

  if (!token) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="alert alert-danger">
                Invalid reset link. Please request a new one.
              </div>
              <Link to="/forgot-password">Request new reset link</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">
            <h2 className="card-title mb-1">Reset your password</h2>
            <p className="text-muted mb-4">Enter your new password below.</p>

            {success ? (
              <div className="alert alert-success">
                Password reset successfully! Redirecting you to login...
              </div>
            ) : (
              <>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label fw-semibold">New password</label>
                    <input
                      id="newPassword"
                      type="password"
                      className={`form-control ${
                          validationErrors.newPassword ? 'is-invalid' : ''
                      }`}
                      name="newPassword"
                      placeholder="At least 8 characters"
                      value={formData.newPassword}
                      onChange={handleChange}
                      aria-invalid={Boolean(validationErrors.newPassword)}
                      aria-describedby={
                        validationErrors.newPassword
                            ? 'new-password-error'
                            : undefined
                      }
                    />
                    {validationErrors.newPassword && (
                        <div
                            id="new-password-error"
                            className="invalid-feedback"
                        >
                          {validationErrors.newPassword}
                        </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">Confirm new password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`form-control ${
                          validationErrors.confirmPassword ? 'is-invalid' : ''
                      }`}
                      name="confirmPassword"
                      placeholder="Repeat your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      aria-invalid={Boolean(validationErrors.confirmPassword)}
                      aria-describedby={
                        validationErrors.confirmPassword
                            ? 'confirm-password-error'
                            : undefined
                      }
                    />
                    {validationErrors.confirmPassword && (
                        <div
                            id="confirm-password-error"
                            className="invalid-feedback"
                        >
                          {validationErrors.confirmPassword}
                        </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn w-100"
                    style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
                  >
                    Reset password
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-muted mt-3 mb-0">
              <Link to="/login">Back to login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage