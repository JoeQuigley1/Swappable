import { useState, useEffect } from 'react'
import { getMyProfile, updateMyProfile } from '../api/users'

// profile page where user can view and edit their account details
function ProfilePage() {

  // profile data
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    location: '',
    lat: '',
    lng: ''
  })

  // controls whether the form fields are editable or just displayed as text
  const [editMode, setEditMode] = useState(false)
  // success message shown after saving
  const [successMessage, setSuccessMessage] = useState('')
  // tracks if browser is currently getting location
  const [locating, setLocating] = useState(false)
  // stores original profile data so we can restore it if user cancels
  const [originalProfile, setOriginalProfile] = useState({})
  // message shown after location is detected
  const [locationMessage, setLocationMessage] = useState('')
  // search term typed by user for location lookup
  const [locationSearch, setLocationSearch] = useState('')
  // tracks if nominatim search is in progress
  const [searching, setSearching] = useState(false)

 // load profile data from the backend when page opens
   useEffect(() => {
     getMyProfile()
       .then(data => {
         setProfile({
           username: data.username || '',
           email: data.email || '',
           location: data.location || '',
           phoneNumber: data.phoneNumber || ''
         })
       })
       .catch(() => {
         setSuccessMessage('') // could not load profile
       })
   }, [])

  // updates profile data when user types in any field
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
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

              setProfile({ ...profile, location: placeName, lat: userLat, lng: userLng })
              localStorage.setItem('lat', userLat)
              localStorage.setItem('lng', userLng)
              setLocationMessage(`Location detected: ${placeName}`)
            } catch (err) {
              // if the name lookup fails, still keep the coordinates
              setProfile({ ...profile, location: 'My Location', lat: userLat, lng: userLng })
              localStorage.setItem('lat', userLat)
              localStorage.setItem('lng', userLng)
              setLocationMessage('Location detected (could not get place name)')
            }
            setLocating(false)
          },
        () => {
          alert('Could not get your location. Please type it instead.')
          setLocating(false)
        }
      )
    }

    // searches nominatim for coordinates of typed location
      const handleLocationSearch = async () => {
        if (!locationSearch.trim()) return
        setSearching(true)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)},Ireland&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const results = await response.json()
          if (results.length === 0) {
            alert('Location not found. Try a different town or county.')
            setSearching(false)
            return
          }
          const place = results[0]
          const locationName = place.display_name.split(',')[0]
          setProfile({
            ...profile,
            location: locationName,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          })
          localStorage.setItem('lat', parseFloat(place.lat))
          localStorage.setItem('lng', parseFloat(place.lon))
          setLocationMessage(`Location found: ${locationName}`)
        } catch (err) {
          alert('Could not search for location. Please try again.')
        }
        setSearching(false)
      }

    // runs when user clicks Save changes
      const handleSave = async () => {
        try {
          const updated = await updateMyProfile({
            username: profile.username,
            location: profile.location,
            phoneNumber: profile.phoneNumber
          })
          setProfile({
            username: updated.username || '',
            email: updated.email || '',
            location: updated.location || '',
            phoneNumber: updated.phoneNumber || ''
          })
          setEditMode(false)
          setSuccessMessage('Profile updated successfully!')
          setTimeout(() => setSuccessMessage(''), 3000)
          setLocationMessage('')
        } catch (err) {
          setSuccessMessage('')
          alert('Could not save profile. Please try again.')
        }
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

            {/* phone number field - shows input in edit mode, plain text otherwise */}
            <div className="mb-3">
                <label className="form-label fw-semibold">Phone number</label>
                {editMode ? (
                    <input
                        type="tel"
                        className="form-control"
                        name="phoneNumber"
                        placeholder="e.g. 087 123 4567"
                        value={profile.phoneNumber}
                        onChange={handleChange}
                    />
                ) : (
                    <p className="form-control-plaintext">
                          {profile.phoneNumber || <span className="text-muted">Not set</span>}
                    </p>
                )}
            </div>

            {/* location field - shows dropdown in edit mode, plain text otherwise */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Location</label>
              {editMode ? (
               <div>
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
                          {locationMessage && (
                              <div className="text-success small">{locationMessage}</div>
                          )}
                            {profile.location && (
                                <div className="text-muted small">📍 {profile.location}</div>
                            )}
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
                  onClick={() => {
                     setProfile(originalProfile)
                     setLocationMessage('')
                     setEditMode(false)
                     }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary w-100"
                onClick={() => {
                    setOriginalProfile(profile)
                    setEditMode(true)
                }}
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