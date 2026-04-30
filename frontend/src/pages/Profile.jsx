import { useState, useEffect } from 'react'

// profile page where user can view and edit their account details
function Profile() {

  // profile data
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    userLocation: ''
  })

  // controls whether the form fields are editable or just displayed as text
  const [editMode, setEditMode] = useState(false)

  // success message shown after saving
  const [successMessage, setSuccessMessage] = useState('')

  // load profile data when page opens
  // TODO: replace with real API call to GET /api/users/me
  useEffect(() => {
    setProfile({
      username: 'user123',
      email: 'user@email.com',
      userLocation: 'Cork'
    })
  }, [])

  // updates profile data when user types in any field
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  // runs when user clicks Save changes
  // TODO: replace with real API call to PUT /api/users/me
  const handleSave = () => {
    console.log('Saving profile:', profile)
    setEditMode(false)
    setSuccessMessage('Profile updated successfully!')
    // Hide the success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000)
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

            {/* location field - shows input in edit mode, plain text otherwise */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Location</label>
              {editMode ? (
                <input
                  type="text"
                  className="form-control"
                  name="userLocation"
                  value={profile.userLocation}
                  onChange={handleChange}
                />
              ) : (
                <p className="form-control-plaintext">{profile.userLocation}</p>
              )}
            </div>

            {/* show save and cancel buttons in edit mode, edit button otherwise */}
            {editMode ? (
              <div className="d-flex gap-2">
                <button
                  className="btn flex-fill"
                  style={{ backgroundColor: '#1a6eb5', color: 'white' }}
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
                className="btn w-100"
                style={{ backgroundColor: '#1a6eb5', color: 'white' }}
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

export default Profile