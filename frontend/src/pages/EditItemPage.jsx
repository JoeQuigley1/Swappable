import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BRAND_COLOR, CONDITIONS } from '../lib/constants'
import { addItemImages, deleteItemImage } from '../api/items'

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

  // existing images as { id, url }
  const [images, setImages] = useState([])
  // true while an image add/delete request is in flight
  const [imageBusy, setImageBusy] = useState(false)
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
          categoryId: item.categoryId ? String(item.categoryId) : '',
          condition: item.condition || ''
        })

        setImages(
          (item.imageUrls || []).map((url) => ({
            url,
            id: Number(url.split('/').pop())
          }))
        )
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

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    if (files.length === 0) return

    if (images.length + files.length > 3) {
      setError('An item can have at most 3 photos.')
      return
    }

    setError('')
    setImageBusy(true)
    try {
      const created = await addItemImages(id, files)
      setImages((prev) => [...prev, ...created])
    } catch (err) {
      setError(err.message || 'Failed to add photos.')
    } finally {
      setImageBusy(false)
    }
  }

  const handleDeleteImage = async (imageId) => {
    setError('')
    setImageBusy(true)
    try {
      await deleteItemImage(id, imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
    } catch (err) {
      setError(err.message || 'Failed to delete photo.')
    } finally {
      setImageBusy(false)
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
                    <option value="" disabled>Select a category</option>
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
                    <option value="" disabled>Select condition</option>
                    {CONDITIONS.map(con => (
                      <option key={con} value={con}>{con}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* photos are saved immediately, separate from the text fields */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Photos</label>
                <div className="form-text mb-2">{images.length} / 3 photos</div>

                {images.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mb-2">
                    {images.map((img) => (
                      <div key={img.id} className="position-relative">
                        <img
                          src={img.url}
                          alt="Item"
                          className="rounded border"
                          style={{ height: '100px', width: '100px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 d-flex align-items-center justify-content-center"
                          style={{ width: '24px', height: '24px', padding: 0 }}
                          onClick={() => handleDeleteImage(img.id)}
                          disabled={imageBusy}
                          aria-label="Delete photo"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 3 && (
                  <>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleAddImages}
                      disabled={imageBusy}
                    />
                    <div className="form-text">
                      Add up to {3 - images.length} more. JPEG, PNG or WebP.
                    </div>
                  </>
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