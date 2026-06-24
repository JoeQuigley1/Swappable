import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'


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
  const [showPassword, setShowPassword] = useState(false)
  // error message shown to user if something goes wrong
  const [error, setError] = useState('')
  // tracks if browser is currently getting location
  const [locating, setLocating] = useState(false)
  // message shown after location is detected
  const [locationMessage, setLocationMessage] = useState('')

  const [locationSearch, setLocationSearch] = useState('')
  const [searching, setSearching] = useState(false)

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

 // handles nominatim location search
 const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return
    setSearching(true)
    setError('')
    try {
        const response = await fetch(
         `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)},Ireland&format=json&limit=1`,
         { headers: { 'Accept-Language': 'en' } }
       )
       const results = await response.json()
       if (results.length === 0) {
         setError('Location not found. Try a different town or county.')
         setSearching(false)
         return
       }
       const place = results[0]
       setFormData({
         ...formData,
         location: place.display_name.split(',')[0],
         lat: parseFloat(place.lat),
         lng: parseFloat(place.lon)
       })
       setLocationMessage(`Location found: ${place.display_name.split(',')[0]}`)
     } catch (err) {
       setError('Could not search for location. Please try again.')
     }
     setSearching(false)
   }

 // asks browser for user's exact GPS coordinates
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
         setFormData({
           ...formData,
           location: 'My Location',
           lat: userLat,
           lng: userLng
         })
         setLocationMessage(`Location detected using GPS`)
         setLocating(false)
       },
       () => {
         setError('Could not get your location. Please type it instead.')
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
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    name="password"
                    placeholder="Choose a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
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
                    {locating ? 'Detecting location...' : '📍 Use my location'}
                  </button>
                </div>

                {/* town/city search */}
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Or type your town or city..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleLocationSearch}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* confirmation message */}
                {locationMessage && (
                  <div className="text-success small">{locationMessage}</div>
                )}
                {formData.location && (
                  <div className="text-muted small">📍 {formData.location}</div>
                )}
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