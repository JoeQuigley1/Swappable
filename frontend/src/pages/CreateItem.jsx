import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// available categories match the database design
const CATEGORIES = [
  'Books',
  'Clothing',
  'Electronics',
  'Furniture',
  'Garden',
  'Household',
  'Music',
  'Plants',
  'Sports',
  'Toys',
  'Other'
]

// condition options describe the physical state of the item
const CONDITIONS = [
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor'
]

// page for creating a new item listing
function CreateItem() {

  const navigate = useNavigate()

  // form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: ''
  })

  // image file selected by the user
  const [imageFile, setImageFile] = useState(null)
  // temporary preview URL of the selected image
  const [imagePreview, setImagePreview] = useState(null)
  // error message if something goes wrong
  const [error, setError] = useState('')
  // shows loading state while form is submitting
  const [loading, setLoading] = useState(false)

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // handles image selection and creates a preview
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // runs when user clicks List item
  // TODO: upload image to POST /api/images and get back Cloudinary URL
  // TODO: send form data + image URL to POST /api/items
  // on success: navigate('/my-items')
  // on failure: setError('Failed to create item.')
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    console.log('Creating item:', formData)
    console.log('Image file:', imageFile)
    setLoading(false)
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">List an item</h2>
            <p className="text-muted mb-4">
              Describe what you'd like to swap
            </p>

            {/* show error if something goes wrong */}
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <form onSubmit={handleSubmit}>

              {/* title field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  placeholder="e.g. Blue mountain bike, barely used"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* description field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  placeholder="Describe your item - size, colour, age, any defects..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              {/* category and condition dropdowns side by side */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Category</label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Condition</label>
                  <select
                    className="form-select"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(con => (
                      <option key={con} value={con}>{con}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* image upload field */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Photo</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <div className="form-text">
                  Upload a clear photo of your item. JPG or PNG.
                </div>

                {/* show preview of selected image */}
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-fluid rounded"
                      style={{ maxHeight: '220px', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>

              {/* submit and cancel buttons */}
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn flex-fill"
                  style={{ backgroundColor: '#1a6eb5', color: 'white' }}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'List item'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() => navigate('/my-items')}
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateItem