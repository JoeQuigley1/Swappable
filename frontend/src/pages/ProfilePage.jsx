import { useState, useEffect } from 'react'
import { IRISH_COUNTIES } from '../lib/counties'

// profile page where user can view and edit their account details
function ProfilePage() {

  // profile data
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    location: ''
  })

  // controls whether the form fields are editable or just displayed as text
  const [editMode, setEditMode] = useState(false)
  // success message shown after saving
  const [successMessage, setSuccessMessage] = useState('')
  // tracks if browser is currently getting location
  const [locating, setLocating] = useState(false)
  // message shown after location is detected
  const [locationMessage, setLocationMessage] = useState('')

  // load profile data from localStorage when page opens
  // TODO: replace with real API call to GET /api/users/me
  useEffect(() => {
    setProfile({
      username: localStorage.getItem('username') || '',
      email: localStorage.getItem('email') || '',
      location: localStorage.getItem('location') || ''
    })
  }, [])

  // updates profile data when user types in any field
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  // handles county selection - saves county name and coordinates
  const handleCountyChange = (e) => {
    const selectedCounty = IRISH_COUNTIES.find(c => c.name === e.target.value)
    if (selectedCounty) {
      setProfile({ ...profile, location: selectedCounty.name })
      localStorage.setItem('lat', selectedCounty.lat)
      localStorage.setItem('lng', selectedCounty.lng)
      setLocationMessage('')
    } else {
      setProfile({ ...profile, location: '' })
      setLocationMessage('')
    }
  }

  // asks browser for user's exact GPS coordinates
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
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
          setProfile({ ...profile, location: closestCounty.name })
          localStorage.setItem('lat', userLat)
          localStorage.setItem('lng', userLng)
          setLocationMessage(`Location detected: ${closestCounty.name}`)
        }
        setLocating(false)
      },
      () => {
        alert('Could not get your location. Please select your county manually.')
        setLocating(false)
      }
    )
  }

  // runs when user clicks Save changes
  // TODO: replace with real API call to PUT /api/users/me
  const handleSave = () => {
    console.log('Saving profile:', profile)
    localStorage.setItem('location', profile.location)
    setEditMode(false)
    setSuccessMessage('Profile updated successfully!')
    setTimeout(() => setSuccessMessage(''), 3000)
    setLocationMessage('')
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-6">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">My Profile</h2>
            <p className="text-muted mb-4">View and edit your account details</p>

            {/* show success message after saving */}
            {successMessage && (
              <div className="alert alert-success">{successMessage}</div>
            )}

            {/* username field - shows input in edit mode, plain text otherwise */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Username</label>
              {editMode ? (
                <input
                  type="text"
                  className="form-control"
                  name="username"
                  value={profile.username}
                  onChange={handleChange}
                />
              ) : (
                <p className="form-control-plaintext">{profile.username}</p>
              )}
            </div>

            {/* email field - shows input in edit mode, plain text otherwise */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              {editMode ? (
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                />
              ) : (
                <p className="form-control-plaintext">{profile.email}</p>
              )}
            </div>

            {/* location field - shows dropdown in edit mode, plain text otherwise */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Location</label>
              {editMode ? (
                <div>
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
                    value={profile.location}
                    onChange={handleCountyChange}
                  >
                    <option value="">Select your county manually</option>
                    {IRISH_COUNTIES.map(county => (
                      <option key={county.name} value={county.name}>
                        {county.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="form-control-plaintext">{profile.location}</p>
              )}
            </div>

            {/* show save and cancel buttons in edit mode, edit button otherwise */}
            {editMode ? (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-fill"
                  onClick={handleSave}
                >
                  Save changes
                </button>
                <button
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary w-100"
                onClick={() => setEditMode(true)}
              >
                Edit profile
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage