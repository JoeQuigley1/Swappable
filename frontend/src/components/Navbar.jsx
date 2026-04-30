import { Link, useNavigate } from 'react-router-dom'

// navigation bar shown at the top of every page
function Navbar() {

  const navigate = useNavigate()

  // check if user is logged in by looking for a token in localStorage
  const isLoggedIn = !!localStorage.getItem('token')

  // removes token and sends user to login page
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg" style={{ backgroundColor: '#1a6eb5' }}>
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