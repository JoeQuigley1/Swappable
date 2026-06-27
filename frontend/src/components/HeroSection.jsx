import { Link } from 'react-router-dom'
import heroImage from '../assets/swappable-hero.jpg'

export default function HeroSection({ itemCount = 0 }) {
  return (
    <section className="hero-section text-white">
      <div className="container py-4">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <h1 className="display-4 fw-bold mb-3">
              Swap What You Have
              <br />
              <span className="text-warning">For What You Want</span>
            </h1>
            <p className="lead mb-4 opacity-75">
              Join Ireland&apos;s growing community of swappers. List your unused items and trade
              them for something you actually need, no money required.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/items" className="btn btn-warning btn-lg px-4 fw-semibold">
                <i className="bi bi-search me-2"></i>
                Browse Items
              </Link>
              <Link to="/items/create" className="btn btn-outline-light btn-lg px-4">
                <i className="bi bi-plus-circle me-2"></i>
                Post an Item
              </Link>
            </div>
            <div className="mt-4 d-flex flex-wrap gap-4 text-white-50 small">
              <span>
                <i className="bi bi-people-fill me-1 text-warning"></i> 1,200+ members
              </span>
              <span>
                <i className="bi bi-box-seam me-1 text-warning"></i> {itemCount} item{itemCount === 1 ? '' : 's'} listed
              </span>
              <span>
                <i className="bi bi-arrow-left-right me-1 text-warning"></i> 800+ swaps completed
              </span>
            </div>
          </div>
          <div className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center">
            <img src={heroImage} alt="Swappable items" className="hero-image" />
          </div>
        </div>
      </div>
    </section>
  )
}
