import { Link } from 'react-router-dom'

// closing call-to-action band. uses the shared .brand-gradient so it
// echoes the hero and footer without repeating the gradient definition.
export default function HowItWorksCTA() {
  return (
    <section className="py-5">
      <div className="container">
        <div className="brand-gradient text-white text-center rounded-4 p-5 shadow-sm">
          <h2 className="fw-bold mb-2">Ready to start swapping?</h2>
          <p className="opacity-75 mb-4">
            Join Ireland&apos;s growing community of swappers. It only takes a minute.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/register" className="btn btn-warning btn-lg px-4 fw-semibold">
              <i className="bi bi-person-plus me-2"></i>
              Create an Account
            </Link>
            <Link to="/items/create" className="btn btn-outline-light btn-lg px-4">
              <i className="bi bi-plus-circle me-2"></i>
              Post an Item
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
