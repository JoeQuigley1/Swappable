import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// page showing full details of one item
function ItemDetail() {

  // id comes from the URL, for example /items/5 gives id = 5
  const { id } = useParams()
  const navigate = useNavigate()

  // full item data
  const [item, setItem] = useState(null)
  // shows spinner while data is loading
  const [loading, setLoading] = useState(true)
  // error message if something goes wrong
  const [error, setError] = useState('')
  // tracks if user already clicked Request a swap
  const [swapRequested, setSwapRequested] = useState(false)

  // load item data when page opens
  // TODO: replace with real API call to GET /api/items/:id
  useEffect(() => {
    setItem({
      id: id,
      title: 'Blue mountain bike',
      description: 'Barely used, great condition. 26 inch wheels. Bought two years ago but hardly used. Comes with a lock and pump.',
      category: 'Sports',
      condition: 'Like New',
      imageUrl: null,
      ownerUsername: 'joe123',
      ownerLocation: 'Galway',
      createdAt: '2026-04-01'
    })
    setLoading(false)
  }, [id])

  // runs when user clicks Request a swap
  // TODO: replace with real API call to POST /api/swaps
  const handleRequestSwap = () => {
    console.log('Requesting swap for item:', id)
    setSwapRequested(true)
  }

  // show spinner while loading
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#1a6eb5' }}></div>
        <p className="mt-2 text-muted">Loading item...</p>
      </div>
    )
  }

  // show error message if request failed
  if (error) {
    return (
      <div className="alert alert-danger mt-4">{error}</div>
    )
  }

  // show message if item was not found
  if (!item) {
    return (
      <div className="alert alert-warning mt-4">Item not found.</div>
    )
  }

  return (
    <div className="mt-4">

      {/* back button goes to previous page */}
      <button
        className="btn btn-outline-secondary btn-sm mb-4"
        onClick={() => navigate(-1)}
      >
        Back
      </button>

      <div className="row g-4">

        {/* left column - item image */}
        <div className="col-md-6">
          {/* show image or placeholder if no image */}
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="img-fluid rounded shadow-sm"
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-light rounded"
              style={{ height: '360px' }}
            >
              <span className="text-muted fs-5">No photo available</span>
            </div>
          )}
        </div>

        {/* right column - item details */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body p-4">

              <h2 className="card-title mb-2">{item.title}</h2>

              {/* category and condition badges */}
              <div className="mb-3">
                <span className="badge bg-secondary me-2">{item.category}</span>
                <span className="badge bg-light text-dark border">{item.condition}</span>
              </div>

              <p className="text-muted mb-4">{item.description}</p>

              {/* owner information */}
              <div className="border-top pt-3 mb-4">
                <p className="mb-1">
                  <span className="fw-semibold">Listed by: </span>
                  {item.ownerUsername}
                </p>
                <p className="mb-1">
                  <span className="fw-semibold">Location: </span>
                  {item.ownerLocation}
                </p>
                <p className="mb-0 text-muted small">
                  Listed on {item.createdAt}
                </p>
              </div>

              {/* show success message or swap request button */}
              {swapRequested ? (
                <div className="alert alert-success mb-0">
                  Swap request sent! The owner will be in touch.
                </div>
              ) : (
                <button
                  className="btn w-100"
                  style={{ backgroundColor: '#1a6eb5', color: 'white' }}
                  onClick={handleRequestSwap}
                >
                  Request a swap
                </button>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ItemDetail