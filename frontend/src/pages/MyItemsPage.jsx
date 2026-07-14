import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND_COLOR } from '../lib/constants'

// page showing all items listed by the logged in user
function MyItemsPage() {

  const navigate = useNavigate()

    // list of user's items
   const [items, setItems] = useState([])
   // shows spinner while data is loading
   const [loading, setLoading] = useState(true)
   // error message if something goes wrong
   const [error, setError] = useState('')
   // holds the id of item waiting for delete confirmation
   const [deleteConfirm, setDeleteConfirm] = useState(null)
   // current page (0-indexed) and total pages from the backend
   const [page, setPage] = useState(0)
   const [totalPages, setTotalPages] = useState(0)
   const PAGE_SIZE = 18

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
          setLoading(true)
        const token = localStorage.getItem('token')

        const response = await fetch(`http://localhost:8080/api/items/my-items?page=${page}&size=${PAGE_SIZE}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.status === 401 || response.status === 403) {
          throw new Error('Please login to view your items')
        }

        if (!response.ok) {
          throw new Error('Failed to load your items')
        }

        const data = await response.json()


        setItems(data.content ?? [])
        setTotalPages(data.totalPages ?? 0)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMyItems()
   }, [page])

    const handleDelete = async (id) => {
        setError('')

        try {
            const token = localStorage.getItem('token')

            const response = await fetch(`http://localhost:8080/api/items/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.status === 401 || response.status === 403) {
                throw new Error('You can only delete your own items.')
            }

            if (!response.ok) {
                throw new Error('Failed to delete item.')
            }

             setItems(currentItems => {
                 const remaining = currentItems.filter(item => item.id !== id)
                 if (remaining.length === 0 && page > 0) {
                     setPage(p => p - 1) // page just emptied out — step back
                 }
                return remaining
             })
            setDeleteConfirm(null)
        } catch (err) {
            setError(err.message)
        }
    }

  // Show a spinner while loading
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: BRAND_COLOR }}></div>
        <p className="mt-2 text-muted">Loading your items...</p>
      </div>
    )
  }

  return (
    <div className="mt-4">

      {/* page header with title and button to add new item */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">My Items</h2>
          <p className="text-muted mb-0">Items you have listed for swapping</p>
        </div>
        <button
          className="btn"
          style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
          onClick={() => navigate('/items/create')}
        >
          + List new item
        </button>
      </div>

      {/* show error if something goes wrong */}
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* show message if user has no items yet */}
      {items.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted fs-5">You haven't listed any items yet.</p>
          <button
            className="btn mt-2"
            style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
            onClick={() => navigate('/items/create')}
          >
            List your first item
          </button>
        </div>
      )}

      {/* item cards in a grid */}
      <div className="row g-3">
        {items.map(item => (
          <div key={item.id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">

              {/* show image or placeholder if no image */}
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="card-img-top"
                  style={{ height: '180px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-light"
                  style={{ height: '180px' }}
                >
                  <span className="text-muted">No photo</span>
                </div>
              )}

              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text text-muted small flex-grow-1">
                  {item.description}
                </p>

                <div className="mb-3">
                  <span className="badge bg-secondary me-2">{item.categoryName}</span>
                  <span className="badge bg-light text-dark border">{item.condition}</span>
                </div>

                {/* show delete confirmation or edit/delete buttons */}
                {deleteConfirm === item.id ? (
                  <div>
                    <p className="text-danger small mb-2">
                      Are you sure you want to delete this item?
                    </p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger btn-sm flex-fill"
                        onClick={() => handleDelete(item.id)}
                      >
                        Yes, delete
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm flex-fill"
                      onClick={() => navigate(`/items/edit/${item.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm flex-fill"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4 mb-4">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="text-muted small">Page {page + 1} of {totalPages}</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default MyItemsPage