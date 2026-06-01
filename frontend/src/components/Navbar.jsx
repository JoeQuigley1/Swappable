import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BRAND_COLOR } from '../constants'

// navigation bar shown at the top of every page
function Navbar() {

  const navigate = useNavigate()
  // useLocation makes the navbar re-render when the URL changes
  // this ensures the login/logout button updates after logging in or out
  const location = useLocation()

  // check if user is logged in by looking for a token in localStorage
  const isLoggedIn = !!localStorage.getItem('token')

  // removes token and user data then sends user to login page
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('location')
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: BRAND_COLOR }}>
      <div className="container">

        {/* logo and app name on the left */}
        <Link className="navbar-brand fw-bold text-white" to="/">
          🔄 Swappable
        </Link>

        {/* hamburger button visible on mobile screens */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          style={{ borderColor: 'white' }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* navigation links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/browse">Browse</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/swap-requests">Swap Requests</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/my-items">My Items</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/profile">My Profile</Link>
            </li>
          </ul>

          {/* show logout button if logged in, otherwise show login and register links */}
          <ul className="navbar-nav ms-auto">
            {isLoggedIn ? (
              <li className="nav-item">
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item me-2">
                  <Link className="nav-link text-white" to="/login">Log in</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-light btn-sm mt-1" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>

      </div>
    </nav>
  )
}

export default Navbar