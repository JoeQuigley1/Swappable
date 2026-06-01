import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/swappable-logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  // useLocation makes the navbar re-render when the URL changes
  // so the login/logout state refreshes after auth actions
  useLocation();

  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('location');
    navigate('/login');
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark site-navbar py-0"
      style={{ height: '104px', overflow: 'visible' }}
    >
      <div className="container" style={{ overflow: 'visible' }}>
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Swappable" height="128" className="me-2" />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/items">
                Browse Items
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/how-it-works">
                How It Works
              </NavLink>
            </li>
            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-items">
                    My Items
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/swap-requests">
                    Swap Requests
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {isLoggedIn ? (
              <>
                <NavLink className="nav-link text-white" to="/profile">
                  My Profile
                </NavLink>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
