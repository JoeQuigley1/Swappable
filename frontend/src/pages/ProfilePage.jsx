import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { QRCodeSVG } from 'qrcode.react'

import { getMyProfile, updateMyProfile } from '../api/users'
import {API_BASE_URL} from "../api/config.js";


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
  // matching locations returned by nominatim as the user types
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const [totpError, setTotpError] = useState('')
  const [totpSuccess, setTotpSuccess] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisable, setShowDisable] = useState(false)

 // load profile data from the backend when page opens
   useEffect(() => {
     getMyProfile()
       .then(data => {
         setProfile({
           username: data.username || '',
           email: data.email || '',
           location: data.location || '',
           phoneNumber: data.phoneNumber || '',
           lat: data.lat ?? '',
           lng: data.lng ?? ''
         })
       })
       .catch(() => {
         setSuccessMessage('') // could not load profile
       })
   }, [])

  // load 2FA status when page opens
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_BASE_URL}/users/me/2fa/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTotpEnabled(data.totpEnabled))
      .catch(err => console.error('Could not load 2FA status', err))
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
              setLocationSearch(placeName)
              setLocationMessage(`Location detected: ${placeName}`)
            } catch {
              // if the name lookup fails, still keep the coordinates
              setProfile({ ...profile, location: 'My Location', lat: userLat, lng: userLng })
              setLocationSearch('My Location')
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
    // debounced nominatim lookup - fires automatically as the user types,
        // no click/Enter needed
          useEffect(() => {
            if (!locationSearch.trim()) {
              setSuggestions([])
              return
            }
            setSearching(true)
            const timer = setTimeout(async () => {
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)},Ireland&format=json&limit=5`,
                  { headers: { 'Accept-Language': 'en' } }
                )
                const results = await response.json()
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
            const locationName = place.display_name.split(',')[0]
            // only the save handler writes the cached coordinates, otherwise
            // cancelling an edit would leave them on a location never saved
            setProfile({
              ...profile,
              location: locationName,
              lat: parseFloat(place.lat),
              lng: parseFloat(place.lon)
            })
            setLocationSearch(locationName)
            setLocationMessage(`Location selected: ${locationName}`)
            setSuggestions([])
            setShowSuggestions(false)
          }



    // runs when user clicks Save changes
      const handleSave = async () => {
        try {
          // the coordinates go up with the name. without them the backend keeps
          // the old ones and item map pins stay on the previous location.
          const isCoord = (value) => value !== '' && Number.isFinite(Number(value))
          const hasCoords = isCoord(profile.lat) && isCoord(profile.lng)
          const updated = await updateMyProfile({
            username: profile.username,
            location: profile.location,
            phoneNumber: profile.phoneNumber,
            ...(hasCoords ? { lat: Number(profile.lat), lng: Number(profile.lng) } : {})
          })
          setProfile({
            username: updated.username || '',
            email: updated.email || '',
            location: updated.location || '',
            phoneNumber: updated.phoneNumber || '',
            lat: updated.lat ?? '',
            lng: updated.lng ?? ''
          })
          localStorage.setItem('username', updated.username || '')
          localStorage.setItem('location', updated.location || '')
          if (updated.lat != null && updated.lng != null) {
            localStorage.setItem('lat', updated.lat)
            localStorage.setItem('lng', updated.lng)
          }
          setEditMode(false)
          setSuccessMessage('Profile updated successfully!')
          setTimeout(() => setSuccessMessage(''), 3000)
          setLocationMessage('')
        } catch (err) {
          setSuccessMessage('')
          alert('Could not save profile. Please try again.')
        }
      }


    // starts 2FA setup - fetches secret and QR code from backend
    const handleSetup2FA = async () => {
      const token = localStorage.getItem('token')
      try {
        const response = await fetch(`${API_BASE_URL}/users/me/2fa/setup`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) {
          setTotpError('Could not start 2FA setup. Please try again.')
          return
        }
        const data = await response.json()
        setQrCodeUrl(data.qrCodeUrl)
        setTotpSecret(data.secret)
        setShowSetup(true)
        setTotpError('')
      } catch (err) {
        setTotpError('Something went wrong. Please try again.')
      }
    }

    // verifies the code entered by user to confirm 2FA setup
    const handleVerifySetup = async () => {
      const token = localStorage.getItem('token')
      try {
        const response = await fetch(`${API_BASE_URL}/users/me/2fa/verify-setup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: totpCode })
        })
        if (!response.ok) {
          setTotpError('Invalid code. Please try again.')
          return
        }
        setTotpEnabled(true)
        setShowSetup(false)
        setTotpSuccess('2FA enabled successfully!')
        setTotpCode('')
        setTimeout(() => setTotpSuccess(''), 3000)
      } catch (err) {
        setTotpError('Something went wrong. Please try again.')
      }
    }

    // disables 2FA after password confirmation
    const handleDisable2FA = async () => {
      const token = localStorage.getItem('token')
      try {
        const response = await fetch(`${API_BASE_URL}/users/me/2fa`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: disablePassword })
        })
        if (!response.ok) {
          setTotpError('Incorrect password. Please try again.')
          return
        }
        setTotpEnabled(false)
        setShowDisable(false)
        setDisablePassword('')
        setTotpSuccess('2FA disabled successfully!')
        setTimeout(() => setTotpSuccess(''), 3000)
      } catch (err) {
        setTotpError('Something went wrong. Please try again.')
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
                     setLocationSearch('')
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
                    setLocationSearch(profile.location)
                    setEditMode(true)
                }}
              >
                Edit profile
              </button>
            )}

          </div>
        </div>
        {/* 2FA security card */}
        <div className="card shadow-sm mt-4">
            <div className="card-body p-4">
                <h5 className="card-title mb-1">Two-Factor Authentication</h5>
                <p className="text-muted mb-3">
                    Add an extra layer of security to your account.
                </p>

                {totpSuccess && <div className="alert alert-success">{totpSuccess}</div>}
                {totpError && <div className="alert alert-danger">{totpError}</div>}

                {/* 2FA is enabled - show disable option */}
                {totpEnabled && !showDisable && (
                    <div>
                        <div className="alert alert-success mb-3">
                          ✓ Two-factor authentication is enabled
                        </div>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => setShowDisable(true)}
                        >
                          Disable 2FA
                        </button>
                      </div>
                    )}

                    {/* disable 2FA confirmation */}
                    {totpEnabled && showDisable && (
                      <div>
                        <p className="text-muted small mb-2">Enter your password to confirm:</p>
                        <input
                          type="password"
                          className="form-control mb-2"
                          placeholder="Your password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                        />
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-danger flex-fill"
                            onClick={handleDisable2FA}
                          >
                            Confirm disable
                          </button>
                          <button
                            className="btn btn-outline-secondary flex-fill"
                            onClick={() => { setShowDisable(false); setDisablePassword(''); setTotpError('') }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2FA is not enabled - show setup option */}
                    {!totpEnabled && !showSetup && (
                      <button
                        className="btn btn-primary"
                        onClick={handleSetup2FA}
                      >
                        Enable 2FA
                      </button>
                    )}

                    {/* 2FA setup - show QR code and verification */}
                    {!totpEnabled && showSetup && (
                      <div>
                        <p className="fw-semibold mb-2">Scan this QR code with Google Authenticator:</p>
                        <div className="mb-3">
                          <QRCodeSVG value={qrCodeUrl} size={180} />
                        </div>
                        <p className="text-muted small mb-1">
                          Can't scan? Enter this key manually:
                        </p>
                        <code className="d-block mb-3 p-2 bg-light rounded">{totpSecret}</code>
                        <p className="fw-semibold mb-2">Enter the 6-digit code from the app:</p>
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="123456"
                          maxLength={6}
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value)}
                    />
                   <div className="d-flex gap-2">
                       <button
                       className="btn btn-primary flex-fill"
                       onClick={handleVerifySetup}
                     >
                       Verify and enable
                     </button>
                     <button
                     className="btn btn-outline-secondary flex-fill"
                     onClick={() => { setShowSetup(false); setTotpError('') }}
                    >
                     Cancel
                   </button>
                 </div>
               </div>
             )}

          </div>
        </div>
        {/* danger zone - permanent account deletion */}
        <div className="card shadow-sm mt-4 border-danger mb-4">
            <div className="card-body p-4">
                <h5 className="card-title text-danger mb-1">Delete Account</h5>
                <p className="text-muted mb-3">
                    Permanently delete your account and all of your data.
                </p>
                <Link to="/profile/delete" className="btn btn-outline-danger">
                    Delete my account
                </Link>
            </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage