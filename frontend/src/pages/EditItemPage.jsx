import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BRAND_COLOR, CONDITIONS } from '../lib/constants'

// page for editing an existing item listing
function EditItemPage() {

  // id comes from the URL, for example /items/edit/5 gives id = 5
  const { id } = useParams()
  const navigate = useNavigate()

  // form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: ''
  })

  const [categories, setCategories] = useState([])

  // new image file selected by user
  const [imageFile, setImageFile] = useState(null)
  // temporary preview of the new image
  const [imagePreview, setImagePreview] = useState(null)
  // shows spinner while item data is loading
  const [loading, setLoading] = useState(true)
  // shows saving state while form is submitting
  const [saving, setSaving] = useState(false)
  // error message if something goes wrong
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/categories')

        if (!response.ok) {
          setError('Failed to load categories.')
          return
        }

        const data = await response.json()
        setCategories(data)
      } catch (err) {
        setError('Failed to load categories.')
      }
    }
    fetchCategories()
  }, [])


  useEffect(() => {
    const fetchItem = async () => {
      try {
        const token = localStorage.getItem('token')

        const response = await fetch(`http://localhost:8080/api/items/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          setError('Failed to load item.')
          return
        }

        const item = await response.json()

        setFormData({
          title: item.title || '',
          description: item.description || '',
          categoryId: item.categoryId || '',
          condition: item.condition || ''
        })
      } catch (err) {
        setError('Failed to load item.')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id])

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // handles new image selection and creates a preview
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`http://localhost:8080/api/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          categoryId: parseInt(formData.categoryId),
          condition: formData.condition,
          imageUrl: null
        })
      })

      if (!response.ok) {
        setError('Failed to update item.')
        return
      }

      navigate('/my-items')
    } catch (err) {
      setError('Failed to update item.')
    } finally {
      setSaving(false)
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

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">

            <h2 className="card-title mb-1">Edit item</h2>
            <p className="text-muted mb-4">Update your listing details</p>

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
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              {/* category and condition dropdowns */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Category</label>
                  <select
                      className="form-select"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
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

              {/* image upload - leave empty to keep existing photo */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Update photo</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <div className="form-text">
                  Leave empty to keep the existing photo.
                </div>

                {/* show preview of newly selected image */}
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

              {/* save and cancel buttons */}
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn flex-fill"
                  style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
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

export default EditItemPage