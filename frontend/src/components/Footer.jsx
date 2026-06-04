import { Link } from 'react-router-dom'
import logo from '../assets/swappable-logo.png'
import { BRAND_COLOR } from '../lib/constants'

export default function Footer() {
  return (
    <footer className="site-footer text-light py-5 mt-auto">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-4">
            <img src={logo} alt="Swappable" height="64" className="mb-3 d-block" />
            <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Trade what you have for what you want. Community-powered swapping made simple.
            </p>
          </div>
          <div className="col-md-4">
            <h6 className="fw-semibold mb-3" style={{ color: BRAND_COLOR }}>Links</h6>
            <ul className="list-unstyled small mb-0">
              <li className="mb-1">
                <Link to="/" className="text-decoration-none footer-link">Home</Link>
              </li>
              <li className="mb-1">
                <Link to="/items" className="text-decoration-none footer-link">Browse Items</Link>
              </li>
              <li className="mb-1">
                <Link to="/how-it-works" className="text-decoration-none footer-link">How It Works</Link>
              </li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="fw-semibold mb-3" style={{ color: BRAND_COLOR }}>Contact</h6>
            <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <i className="bi bi-envelope me-2"></i>hello@swappable.ie
            </p>
          </div>
        </div>
        <hr style={{ borderColor: 'rgba(52,187,204,0.2)' }} />
        <p className="small text-center mb-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
          &copy; {new Date().getFullYear()} Swappable. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
