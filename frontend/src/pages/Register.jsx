import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// registration page for new users
function Register() {

  const navigate = useNavigate()

  // form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    location: ''
  })

  // error message shown to user if something goes wrong
  const [error, setError] = useState('')

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // runs when user clicks Register
  // sends data to backend and saves token on success
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (!response.ok) {
        setError('Registration failed.')
        return
      }
      const data = await response.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('username', data.username)
      localStorage.setItem('email', data.email)
      localStorage.setItem('location', formData.location)
      console.log('Saved location:', formData.location)
      navigate('/login')
    } catch (err) {
      setError('Registration failed. Please try again.')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">Create an account</h2>
            <p className="text-muted mb-4">Join Swappable and start swapping</p>

            {/* show error if something goes wrong */}
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={handleSubmit}>

              {/* username field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

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
              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Choose a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* location field */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  placeholder="e.g. Galway"
                  value={formData.location}
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
                Register
              </button>

            </form>

            {/* link to login page for users who already have an account */}
            <p className="text-center text-muted mt-3 mb-0">
              Already have an account? <Link to="/login">Log in</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Register