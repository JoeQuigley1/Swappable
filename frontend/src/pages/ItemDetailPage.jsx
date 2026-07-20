import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'
import { createSwapRequest, getMyAvailableItems } from '../api/swapRequests'
import {API_BASE_URL} from "../api/config.js";

// page showing full details of one item
function ItemDetailPage() {

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
  const [myItems, setMyItems] = useState([])      // your available items to offer
  const [offeredItemId, setOfferedItemId] = useState('')
  const [message, setMessage] = useState('')
  const [swapError, setSwapError] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  // load item data when page opens

  useEffect(() => {
    const loadItem = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/items/${id}`)


        if (response.status === 404) {
          setError('Item not found.')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to load item')
        }

        const data = await response.json()
        setItem(data)
      } catch (err) {
        setError('Could not load item details.')
      } finally {
        setLoading(false)
      }
    }
    loadItem()
  }, [id])


  // load your own items so you can choose what to offer
  useEffect(() => {
      if (!localStorage.getItem('token')) return // only if logged in
      getMyAvailableItems().then(setMyItems).catch(() => setMyItems([]))
  }, [])


  // runs when user clicks Request a swap
  // TODO: replace with real API call to POST /api/swaps

  const handleRequestSwap = async () => {
      setSwapError('')
       if (!localStorage.getItem('token')) {
           navigate('/login')
           return
       }

      if (!offeredItemId) {
        setSwapError('Please choose one of your items to offer.')
        return
      }
      try {
        await createSwapRequest(Number(id), Number(offeredItemId), message)
        setSwapRequested(true)
      } catch (err) {
        // backend returns 400 for: item not available / duplicate / own item
        setSwapError(err.message === 'unauthenticated'
          ? 'Please log in to send a swap request.'
          : err.message)
      }
    }


  // show spinner while loading
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: BRAND_COLOR }}></div>
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

  const images = item.imageUrls?.length
    ? item.imageUrls
    : item.imageUrl
      ? [item.imageUrl]
      : []
  const currentImage = images[activeImage] ?? images[0]

  return (
    <div className="mt-4">

      <div className="row g-4">

        {/* left column - item images */}
        <div className="col-md-6">
          {images.length === 0 ? (
            <div
              className="d-flex align-items-center justify-content-center bg-light rounded"
              style={{ height: '360px' }}
            >
              <span className="text-muted fs-5">No photo available</span>
            </div>
          ) : (
            <>
              <div className="position-relative">
                <img
                  src={currentImage}
                  alt={item.title}
                  className="img-fluid rounded shadow-sm"
                  style={{ width: '100%', height: '400px', objectFit: 'cover' }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="btn btn-light rounded-circle shadow-sm position-absolute top-50 start-0 translate-middle-y ms-2"
                      onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                      aria-label="Previous image"
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-light rounded-circle shadow-sm position-absolute top-50 end-0 translate-middle-y me-2"
                      onClick={() => setActiveImage((activeImage + 1) % images.length)}
                      aria-label="Next image"
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="d-flex gap-2 mt-2 flex-wrap">
                  {images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${item.title} ${i + 1}`}
                      className={`rounded clickable border ${i === activeImage ? 'border-primary border-2' : ''}`}
                      style={{ height: '64px', width: '64px', objectFit: 'cover' }}
                      role="button"
                      onClick={() => setActiveImage(i)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* right column - item details */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body p-4">

              <h2 className="card-title mb-2">{item.title}</h2>

              {/* category and condition badges */}
              <div className="mb-3">
                <span className="badge bg-secondary me-2">Category: {item.categoryName}</span>
                <span className="badge bg-light text-dark border"> Condition: {item.condition}</span>
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
                  Listed on {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IE') : ''}
                </p>
              </div>

              {/* show success message or swap request button */}
               {swapRequested ? (
                   <div className="alert alert-success mb-0">
                       Swap request sent! The owner will be in touch.
                   </div>
               ) : (
                   <div>
                       {swapError && <div className="alert alert-danger py-2">{swapError}</div>}

                        <label className="form-label small mb-1">Offer one of your items</label>
                        <select
                            className="form-select mb-2"
                            value={offeredItemId}
                            onChange={(e) => setOfferedItemId(e.target.value)}
                        >
                           <option value="">Select an item…</option>
                           {myItems.map((mi) => (
                               <option key={mi.id} value={mi.id}>{mi.title}</option>
                           ))}
                       </select>

                       <textarea
                            className="form-control mb-2"
                            rows="2"
                            placeholder="Add a message (optional)"
                            maxLength={500}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                       />

                       <button
                            className="btn w-100"
                            style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
                            onClick={handleRequestSwap}
                       >
                         Request a swap
                       </button>

                       {myItems.length === 0 && (
                           <p className="text-muted small mt-2 mb-0">
                               You need an available item of your own to offer a swap.
                           </p>
                       )}
                      </div>
                   )}

              <div className="border-top pt-3 mb-4">
                <button
                    className="btn btn-outline-secondary btn-sm mb-4 "
                    onClick={() => navigate(-1)}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ItemDetailPage