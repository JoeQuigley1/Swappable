import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import {API_BASE_URL} from "../api/config.js";
import { cacheMyLocation } from '../api/users'

// login page for existing users
function LoginPage() {

  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  // form fields
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  })

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateForm = () => {
    const errors = {}

    const email = formData.email.trim()

    if (!email) {
      errors.email = 'Email is required.'
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address.'
    }

    if (!formData.password) {
      errors.password = 'Password is required.'
    }

    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }

  // error message shown to user if login fails
  const [error, setError] = useState('')

  // updates form data when user types in any field
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

  // runs when user clicks Log in
  // TODO: POST /api/auth/login
  // on success: save token to localStorage, navigate('/profile')
  // on failure: setError('Invalid email or password.')
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) {
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        setError('Invalid email or password.')
        return
      }

      const data = await response.json()

      // if 2FA is required, store temp token and redirect to 2FA page
      if (data.requires2FA) {
          localStorage.setItem('tempToken', data.tempToken)
           navigate('/login/2fa')
           return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('username', data.username)
      localStorage.setItem('email', data.email)
      await cacheMyLocation()
       navigate('/profile')
    } catch (err) {
      setError('Could not login. Please try again.')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">Welcome back</h2>
            <p className="text-muted mb-4">Log in to your Swappable account</p>

            {/* show error if login fails */}
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* email field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className={`form-control ${
                  validationErrors.email ? 'is-invalid' : ''
                  }`}
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(validationErrors.email)}
                  aria-describedby={
                    validationErrors.email ? 'email-error' : undefined
                  }
                />
                {validationErrors.email && (
                    <div
                        id="email-error"
                        className="invalid-feedback"
                    >
                      {validationErrors.email}
                    </div>
                )}
              </div>

              {/* password field */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Password</label>
                <div className="input-group has-validation">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${
                      validationErrors.password ? 'is-invalid' : ''
                    }`}
                    name="password"
                    placeholder="Your password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(validationErrors.password)}
                    aria-describedby={
                      validationErrors.password ? 'password-error' : undefined
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  {validationErrors.password && (
                      <div
                          id="password-error"
                          className="invalid-feedback"
                      >
                        {validationErrors.password}
                      </div>
                  )}
                </div>
                <div className="text-end mt-1">
                  <Link to="/forgot-password" className="text-muted small">Forgot password?</Link>
                </div>

              </div>

              {/* submit button */}
              <button
                type="submit"
                className="btn w-100"
                style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
              >
                Log in
              </button>

            </form>

            {/* link to registration page for new users */}
            <p className="text-center text-muted mt-3 mb-0">
              Don't have an account? <Link to="/register">Register</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage