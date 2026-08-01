import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BRAND_COLOR, CONDITIONS } from '../lib/constants'
import { addItemImages, deleteItemImage } from '../api/items'
import {API_BASE_URL, resolveImageUrl} from "../api/config.js";
import { validateItemForm } from '../utils/itemValidation.js'

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
  const [validationErrors, setValidationErrors] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: '',
    images: ''
  })

  // existing images as { id, url }
  const [images, setImages] = useState([])
  // Keeps image deletions pending locally so Cancel leaves the saved images unchanged
  const [imageIdsToDelete, setImageIdsToDelete] = useState([])
  // Keeps newly selected images local until Save changes is clicked
  const [pendingImages, setPendingImages] = useState([])
  // shows spinner while item data is loading
  const [loading, setLoading] = useState(true)
  // shows saving state while form is submitting
  const [saving, setSaving] = useState(false)
  // error message if something goes wrong
  const [error, setError] = useState('')
 // display excess-image warnings beside the image field
  const [imageWarning, setImageWarning] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`)

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

        const response = await fetch(`${API_BASE_URL}/items/${id}`, {
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
  // Calls the shared helper and stores its results in the page.s
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((current) => ({
      ...current,
      [name]: value
    }))

    setValidationErrors((current) => ({
      ...current,
      [name]: ''
    }))
  }

  const validateForm = () => {
    const errors = validateItemForm(formData)

    setValidationErrors((current) => ({
      title: errors.title || '',
      description: errors.description || '',
      categoryId: errors.categoryId || '',
      condition: errors.condition || '',
      images: current.images
    }))

    return Object.keys(errors).length === 0
  }

  const handleAddImages = (e) => {
    const selectedFiles = Array.from(e.target.files)
    e.target.value = ''

    if (selectedFiles.length === 0) {
      return
    }

    setError('')
    setImageWarning('')

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    const validFiles = selectedFiles.filter((file) =>
        allowedTypes.includes(file.type)
    )

    const invalidFiles = selectedFiles.filter(
        (file) => !allowedTypes.includes(file.type)
    )

    setValidationErrors((current) => ({
      ...current,
      images:
          invalidFiles.length > 0
              ? `"${invalidFiles[0].name}" is not supported. Please select a JPEG, PNG or WebP image.`
              : ''
    }))

    const availableSpaces =
        3 - images.length - pendingImages.length

    const filesToAdd = validFiles.slice(0, availableSpaces)
    const discardedCount = validFiles.length - filesToAdd.length

    if (discardedCount > 0) {
      setImageWarning(
          `${discardedCount} additional ${
              discardedCount === 1 ? 'image was' : 'images were'
          } not added because an item can have at most 3 photos.`
      )
    }

    if (filesToAdd.length === 0) {
      return
    }

    const newPendingImages = filesToAdd.map((file, index) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }))

    setPendingImages((current) => [
      ...current,
      ...newPendingImages
    ])
  }

  const handleDeleteImage = (imageId) => {
    setImageIdsToDelete((current) =>
        current.includes(imageId)
            ? current
            : [...current, imageId]
    )

    setImages((current) =>
        current.filter((image) => image.id !== imageId)
    )
  }

  // Removes a newly selected image before it is saved
  const handleDeletePendingImage = (imageKey) => {
    setPendingImages((current) => {
      const imageToRemove = current.find(
          (image) => image.key === imageKey
      )

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      return current.filter((image) => image.key !== imageKey)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setError('')
    setSaving(true)

    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          // trim() prevents leading and trailing spaces being stored.
          title: formData.title.trim(),
          description: formData.description.trim(),
          categoryId: Number(formData.categoryId),
          condition: formData.condition
        })
      })

      if (!response.ok) {
        setError('Failed to update item.')
        return
      }
      // Marked images are deleted first
      // replacement images are then added
      await Promise.all(
          imageIdsToDelete.map((imageId) =>
              deleteItemImage(id, imageId)
          )
      )

      if (pendingImages.length > 0) {
        await addItemImages(
            id,
            pendingImages.map((image) => image.file)
        )
      }

      navigate('/my-items')
    } catch (err) {
      setError(err.message || 'Failed to update item.')
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

            {/*noValidate ensure custom validation messages are shown*/}
            <form onSubmit={handleSubmit} noValidate>
              {/* title field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                    type="text"
                    className={`form-control ${
                        validationErrors.title ? 'is-invalid' : ''
                    }`}
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                />
                {validationErrors.title && (
                    <div className="invalid-feedback">
                      {validationErrors.title}
                    </div>
                )}
              </div>

              {/* description field */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                    className={`form-control ${
                        validationErrors.description ? 'is-invalid' : ''
                    }`}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                />
                {validationErrors.description && (
                    <div className="invalid-feedback">
                      {validationErrors.description}
                    </div>
                )}
              </div>

              {/* category and condition dropdowns */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Category</label>
                  <select
                      className={`form-select ${
                          validationErrors.categoryId ? 'is-invalid' : ''
                      }`}
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                    ))}
                  </select>
                  {validationErrors.categoryId && (
                      <div className="invalid-feedback">
                        {validationErrors.categoryId}
                      </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">Condition</label>
                  <select
                      className={`form-select ${
                          validationErrors.condition ? 'is-invalid' : ''
                      }`}
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map((con) => (
                        <option key={con} value={con}>
                          {con}
                        </option>
                    ))}
                  </select>
                  {validationErrors.condition && (
                      <div className="invalid-feedback">
                        {validationErrors.condition}
                      </div>
                  )}
                </div>
              </div>

              {/* Photo additions and deletions remain pending until Save changes is clicked */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Photos</label>

                <div className="form-text mb-2">
                  {images.length + pendingImages.length} / 3 photos
                </div>

                {(images.length > 0 || pendingImages.length > 0) && (
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {images.map((img) => (
                          <div key={img.id} className="position-relative">
                            <img
                                src={resolveImageUrl(img.url)}
                                alt="Item"
                                className="rounded border"
                                style={{
                                  height: '100px',
                                  width: '100px',
                                  objectFit: 'cover'
                                }}
                            />

                            <button
                                type="button"
                                className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 d-flex align-items-center justify-content-center"
                                style={{ width: '24px', height: '24px', padding: 0 }}
                                onClick={() => handleDeleteImage(img.id)}
                                disabled={saving}
                                aria-label="Remove photo"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                      ))}

                      {pendingImages.map((img) => (
                          <div key={img.key} className="position-relative">
                            <img
                                src={img.previewUrl}
                                alt="Selected item"
                                className="rounded border"
                                style={{
                                  height: '100px',
                                  width: '100px',
                                  objectFit: 'cover'
                                }}
                            />

                            <button
                                type="button"
                                className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 d-flex align-items-center justify-content-center"
                                style={{ width: '24px', height: '24px', padding: 0 }}
                                onClick={() => handleDeletePendingImage(img.key)}
                                disabled={saving}
                                aria-label="Remove selected photo"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                      ))}
                    </div>
                )}

                {images.length + pendingImages.length < 3 && (
                    <>
                      <input
                          type="file"
                          className={`form-control ${
                              validationErrors.images ? 'is-invalid' : ''
                          }`}
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleAddImages}
                          disabled={saving}
                      />
                      <div className="form-text">
                        Add up to {
                          3 - images.length - pendingImages.length
                      } more. JPEG, PNG or WebP.
                      </div>
                    </>
                )}
                {/*Adding the validation here so the upload allows 3 images to be uploaded*/}
                {/* Display image validation and warnings even when all three spaces are filled */}
                {validationErrors.images && (
                    <div className="text-danger small mt-2">
                      {validationErrors.images}
                    </div>
                )}

                {imageWarning && (
                    <div
                        className="alert alert-warning py-2 px-3 mt-2 mb-2"
                        role="status"
                    >
                      {imageWarning}
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
                  disabled={saving}
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