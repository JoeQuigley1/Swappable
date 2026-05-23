import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// login page for existing users
function Login() {

  const navigate = useNavigate()

  // form fields
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // error message shown to user if login fails
  const [error, setError] = useState('')

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // runs when user clicks Log in
  // TODO: POST /api/auth/login
  // on success: save token to localStorage, navigate('/profile')
  // on failure: setError('Invalid email or password.')
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    console.log('Logging in:', formData)
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

            <form onSubmit={handleSubmit}>

              {/* email field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* password field */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* submit button */}
              <button
                type="submit"
                className="btn w-100"
                style={{ backgroundColor: '#1a6eb5', color: 'white' }}
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

export default Login