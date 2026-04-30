import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// page showing all items listed by the logged in user
function MyItems() {

  const navigate = useNavigate()

    // list of user's items
   const [items, setItems] = useState([])
   // shows spinner while data is loading
   const [loading, setLoading] = useState(true)
   // error message if something goes wrong
   const [error, setError] = useState('')
   // holds the id of item waiting for delete confirmation
   const [deleteConfirm, setDeleteConfirm] = useState(null)

   // load items when page opens
   // TODO: replace with real API call to GET /api/items/my-items
  useEffect(() => {
    setItems([
      {
        id: 1,
        title: 'Blue mountain bike',
        description: 'Barely used, great condition. 26 inch wheels.',
        category: 'Sports',
        condition: 'Like New',
        imageUrl: null
      },
      {
        id: 2,
        title: 'Monstera plant',
        description: 'Large healthy monstera in a terracotta pot.',
        category: 'Plants',
        condition: 'Good',
        imageUrl: null
      },
      {
        id: 3,
        title: 'Acoustic guitar',
        description: 'Yamaha F310, comes with a case and extra strings.',
        category: 'Music',
        condition: 'Good',
        imageUrl: null
      }
    ])
    setLoading(false)
  }, [])

  // removes item from the list
  // TODO: replace with real API call to DELETE /api/items/:id
  const handleDelete = (id) => {
    console.log('Deleting item:', id)
    setItems(items.filter(item => item.id !== id))
    setDeleteConfirm(null)
  }

  // Show a spinner while loading
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#1a6eb5' }}></div>
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
          style={{ backgroundColor: '#1a6eb5', color: 'white' }}
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
            style={{ backgroundColor: '#1a6eb5', color: 'white' }}
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

                {/* category and condition badges */}
                <div className="mb-3">
                  <span className="badge bg-secondary me-2">{item.category}</span>
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

    </div>
  )
}

export default MyItems