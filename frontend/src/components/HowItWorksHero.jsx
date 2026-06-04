import { Link } from 'react-router-dom'

// page hero for the How It Works page.
// reuses the same .hero-section gradient as the home hero so it sits
// behind the absolute navbar and matches the overall brand feeling.
export default function HowItWorksHero() {
  return (
    <section className="hero-section text-white">
      <div className="container py-4">
        <div className="row justify-content-center text-center">
          <div className="col-lg-8">
            <span className="badge rounded-pill bg-warning text-dark mb-3 px-3 py-2">
              <i className="bi bi-arrow-left-right me-1"></i> No money. Just swaps.
            </span>
            <h1 className="display-4 fw-bold mb-3">How Swappable Works</h1>
            <p className="lead opacity-75 mb-4">
              Turning your unused stuff into things you actually want takes just
              three simple steps. Here&apos;s everything you need to know to get
              started.
            </p>
            <div className="d-flex flex-wrap gap-3 justify-content-center">
              <Link to="/register" className="btn btn-warning btn-lg px-4 fw-semibold">
                <i className="bi bi-person-plus me-2"></i>
                Get Started
              </Link>
              <Link to="/items" className="btn btn-outline-light btn-lg px-4">
                <i className="bi bi-search me-2"></i>
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
