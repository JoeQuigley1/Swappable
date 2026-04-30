import Navbar from './Navbar'

// Layout wraps every page with the navbar at the top and footer at the bottom
function Layout({ children }) {
  return (
    // min-vh-100 makes the page always full screen height
    // d-flex and flex-column make the footer stick to the bottom
    <div className="d-flex flex-column min-vh-100">

      <Navbar />

      {/* flex-grow-1 makes the content area fill all available space */}
      <main className="container py-4 flex-grow-1">
        {/* children means whatever page is inside this Layout */}
        {children}
      </main>

      <footer style={{ backgroundColor: '#1a6eb5' }} className="text-white mt-auto py-4">
        <div className="container">
          <div className="row align-items-center">

            {/* left side - brand name and tagline */}
            <div className="col-md-6 mb-2 mb-md-0">
              <span className="fw-bold fs-5">🔄 Swappable</span>
              <p className="mb-0 small mt-1" style={{ opacity: 0.85 }}>
                Swap more, buy less. Building a more sustainable Ireland.
              </p>
            </div>

            {/* right side - university credit */}
            <div className="col-md-6 text-md-end">
              <span className="small" style={{ opacity: 0.85 }}>
                University of Galway &mdash; Capstone Project 2026
              </span>
            </div>

          </div>
        </div>
      </footer>

    </div>
  )
}

export default Layout