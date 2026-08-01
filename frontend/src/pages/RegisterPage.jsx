import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import {API_BASE_URL} from "../api/config.js";


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

    const [validationErrors, setValidationErrors] = useState({
        username: '',
        email: '',
        password: '',
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
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    const validateRegistration = () => {
        const errors = {}

        const username = formData.username.trim()
        const email = formData.email.trim()
        const password = formData.password

        if (!username) {
            errors.username = 'Username is required.'
        } else if (username.length < 3) {
            errors.username = 'Username must be at least 3 characters.'
        }

        if (!email) {
            errors.email = 'Email is required.'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Please enter a valid email address.'
        }

        if (!password) {
            errors.password = 'Password is required.'
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters.'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

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

 // debounced nominatim lookup - turn on automatically as the user types
 useEffect(() => {
   if (!locationSearch.trim()) {
     setSuggestions([])
     return
   }
   setSearching(true)
   const timer = setTimeout(async () => {
     try {
       const response = await fetch(
         `https://photon.komoot.io/api/?q=${encodeURIComponent(locationSearch)}&limit=5&lang=en&countrycode=ie&lat=53.4&lon=-8.2`
       )
       const data = await response.json()
       const results = (data.features ?? [])
         .filter((f) => f.properties.osm_key === 'place')
         .map((f) => ({
           display_name: [f.properties.name, f.properties.state, f.properties.country]
             .filter(Boolean).join(', '),
           lat: f.geometry.coordinates[1],
           lon: f.geometry.coordinates[0],
          }))
       setSuggestions(results)
       setShowSuggestions(true)
     } catch (err) {
       setSuggestions([])
     }
     setSearching(false)
   }, 400)
   return () => clearTimeout(timer)
 }, [locationSearch])

 // runs when user picks a suggestion from the dropdown
 const handleSelectLocation = (place) => {
   const name = place.display_name.split(',')[0]
   setFormData({
     ...formData,
     location: name,
     lat: parseFloat(place.lat),
     lng: parseFloat(place.lon)
   })
   setLocationSearch(name)
   setLocationMessage(`Location selected: ${name}`)
   setSuggestions([])
   setShowSuggestions(false)
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
       async (position) => {
         const userLat = position.coords.latitude
         const userLng = position.coords.longitude
         try {
             const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`,

                 { headers: { 'Accept-Language': 'en' } }
             )
            const data = await response.json()
            // pick the town/city/village from the address, fall back sensibly
            const addr = data.address || {}
            const placeName =
               addr.city || addr.town || addr.village || addr.county ||
               (data.display_name ? data.display_name.split(',')[0] : 'My Location')

            setFormData({
                ...formData,
                location: placeName,
                lat: userLat,
                lng: userLng
                })
                setLocationSearch(placeName)
                setLocationMessage(`Location detected: ${placeName}`)
            } catch {
                // if the name lookup fails, still keep the coordinates
                setFormData({
                    ...formData,
                    location: 'My Location',
                    lat: userLat,
                    lng: userLng
                })
                setLocationSearch('My Location')
                setLocationMessage('Location detected (could not get place name)')
                }
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
      if (!validateRegistration()) {
          return
      }
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
              const data = await response.json().catch(() => null)
              setError(data?.message || 'Registration failed.')
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
      navigate('/profile')
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

            <form onSubmit={handleSubmit} noValidate>

              {/* username field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Username</label>
                <input
                  type="text"
                  className={`form-control ${
                      validationErrors.username ? 'is-invalid' : ''
                  }`}
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  aria-invalid={Boolean(validationErrors.username)}
                  aria-describedby={
                      validationErrors.username
                          ? 'register-username-error'
                          : undefined
                  }
                />
                  {validationErrors.username && (
                      <div
                          id="register-username-error"
                          className="invalid-feedback"
                      >
                          {validationErrors.username}
                      </div>
                  )}
              </div>

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
                      validationErrors.email
                          ? 'register-email-error'
                          : undefined
                  }
                />
                  {validationErrors.email && (
                      <div
                          id="register-email-error"
                          className="invalid-feedback"
                      >
                          {validationErrors.email}
                      </div>
                  )}
              </div>

              {/* password field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                  <div className="input-group has-validation">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${
                        validationErrors.password ? 'is-invalid' : ''
                    }`}
                    name="password"
                    placeholder="Choose a password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(validationErrors.password)}
                    aria-describedby={
                        validationErrors.password
                            ? 'register-password-error'
                            : undefined
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                  {validationErrors.password && (
                      <div
                          id="register-password-error"
                          className="text-danger small mt-1"
                      >
                          {validationErrors.password}
                      </div>
                  )}
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

                {/* town/city search - type to see matching locations, click one to select */}
                   <div className="mb-2 position-relative">
                       <input
                          type="text"
                          className="form-control"
                          placeholder="Type your town or city..."
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                          onBlur={() => setShowSuggestions(false)}
                          autoComplete="off"
                       />
                       {searching && (
                           <div className="text-muted small mt-1">Searching...</div>
                       )}
                        {showSuggestions && suggestions.length > 0 && (
                            <ul
                              className="list-group position-absolute w-100 shadow-sm"
                              style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                            >
                               {suggestions.map((place, idx) => (
                                   <li
                                     key={idx}
                                     className="list-group-item list-group-item-action"
                                     style={{ cursor: 'pointer' }}
                                     onMouseDown={(e) => { e.preventDefault(); handleSelectLocation(place) }}
                                   >
                                     {place.display_name}
                                   </li>
                                 ))}
                                </ul>
                              )}
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