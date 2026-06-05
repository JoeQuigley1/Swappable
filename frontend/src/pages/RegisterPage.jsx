import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import { IRISH_COUNTIES } from '../lib/counties'

// registration page for new users
function RegisterPage() {

  const navigate = useNavigate()

  // form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    location: '',
    lat: '',
    lng: ''
  })

  // error message shown to user if something goes wrong
  const [error, setError] = useState('')
  // tracks if browser is currently getting location
  const [locating, setLocating] = useState(false)
  // message shown after location is detected
  const [locationMessage, setLocationMessage] = useState('')

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // handles county selection - saves county name and coordinates
  const handleCountyChange = (e) => {
    const selectedCounty = IRISH_COUNTIES.find(c => c.name === e.target.value)
    if (selectedCounty) {
      setFormData({
        ...formData,
        location: selectedCounty.name,
        lat: selectedCounty.lat,
        lng: selectedCounty.lng
      })
      setLocationMessage('')
    } else {
      setFormData({ ...formData, location: '', lat: '', lng: '' })
      setLocationMessage('')
    }
  }

  // asks browser for user's exact GPS coordinates
  // finds the closest county to those coordinates
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setLocationMessage('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        // find the closest county to the user's coordinates
        let closestCounty = null
        let shortestDistance = Infinity

        IRISH_COUNTIES.forEach(county => {
          const distance = Math.sqrt(
            Math.pow(county.lat - userLat, 2) +
            Math.pow(county.lng - userLng, 2)
          )
          if (distance < shortestDistance) {
            shortestDistance = distance
            closestCounty = county
          }
        })

        if (closestCounty) {
          setFormData({
            ...formData,
            location: closestCounty.name,
            lat: userLat,
            lng: userLng
          })
          setLocationMessage(`Location detected: ${closestCounty.name}`)
        }
        setLocating(false)
      },
      (err) => {
        setError('Could not get your location. Please select your county manually.')
        setLocating(false)
      }
    )
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
      localStorage.setItem('lat', formData.lat)
      localStorage.setItem('lng', formData.lng)
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

              {/* location section - county dropdown and use my location button */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Location</label>

                {/* use my location button */}
                <div className="mb-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                  >
                    {locating ? 'Detecting location...' : '📍 Use my exact location'}
                  </button>
                </div>

                {/* show success message if location was detected */}
                {locationMessage && (
                  <div className="alert alert-success py-2 mb-2 small">
                    {locationMessage}
                  </div>
                )}

                {/* county dropdown as fallback */}
                <select
                  className="form-select"
                  name="location"
                  value={formData.location}
                  onChange={handleCountyChange}
                  required
                >
                  <option value="">Select your county manually</option>
                  {IRISH_COUNTIES.map(county => (
                    <option key={county.name} value={county.name}>
                      {county.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* submit button */}
              <button
                type="submit"
                className="btn btn-primary w-100"
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

export default RegisterPage