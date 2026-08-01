import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../api/items';
import {API_BASE_URL} from "../api/config.js";
import { validateItemForm } from '../utils/itemValidation.js';

// condition options describe the physical state of the item
//TODO remove conditions and store them in the DB
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

// page for creating a new item listing
function CreateItem() {
  const navigate = useNavigate();

  // form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    title: '',
    description: '',
    categoryId: '',
    condition: '',
    images: '',
  });

  const [imageFiles, setImageFiles] = useState([]);
  // temporary preview URL of the selected image
  const [imagePreviews, setImagePreviews] = useState([]);
  // error message if something goes wrong
  const [error, setError] = useState('');
  // shows loading state while form is submitting
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);

  const [imageWarning, setImageWarning] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error(error));
  }, []);

  // updates form data when user types in any field
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setValidationErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  const validateForm = () => {
    const errors = validateItemForm(formData);

    setValidationErrors((current) => ({
      ...current,
      ...errors,
      title: errors.title || '',
      description: errors.description || '',
      categoryId: errors.categoryId || '',
      condition: errors.condition || '',
    }));

    return Object.keys(errors).length === 0;
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);

    const invalidFile = newFiles.find(
        (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
    );

    if (invalidFile) {
      setValidationErrors((current) => ({
        ...current,
        images: `"${invalidFile.name}" is not supported. Please select a JPEG, PNG or WebP image.`,
      }));

      setImageWarning('');
      e.target.value = '';
      return;
    }

    // Start with the images that the user previously selected
    const combinedFiles = [...imageFiles];

    // Add each new file unless the same file has already been selected
    newFiles.forEach((newFile) => {
      const alreadySelected = combinedFiles.some(
          (file) =>
              file.name === newFile.name &&
              file.size === newFile.size &&
              file.lastModified === newFile.lastModified
      );

      if (!alreadySelected) {
        combinedFiles.push(newFile);
      }
    });

    const selectedFiles = combinedFiles.slice(0, 3);

    setImageWarning(
        combinedFiles.length > 3
            ? 'You can select up to 3 photos. Any additional photos were not added.'
            : ''
    );

    setValidationErrors((current) => ({
      ...current,
      images: '',
    }));

    // Release the old temporary preview URLs before creating replacements
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    // Store the files that will be sent to the backend
    setImageFiles(selectedFiles);
    // Create temporary browser URLs so the selected images can be previewed
    setImagePreviews(
        selectedFiles.map((file) => URL.createObjectURL(file))
    );

    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles((currentFiles) =>
        currentFiles.filter((_, index) => index !== indexToRemove)
    );

    setImagePreviews((currentPreviews) => {
      URL.revokeObjectURL(currentPreviews[indexToRemove]);

      return currentPreviews.filter(
          (_, index) => index !== indexToRemove
      );
    });

    setValidationErrors((current) => ({
      ...current,
      images: '',}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createItem({
        categoryId: Number(formData.categoryId),
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        images: imageFiles,
      });

      navigate('/my-items');
    } catch (err) {
      console.error(err);

      if (err.status === 413) {
        setError(
            'This photo is too large or high-resolution. Please choose a smaller or resized image.'
        );
      } else if (err.status === 400) {
        setError(
            err.message ||
            'The selected image could not be processed. Please choose another image.'
        );
      } else {
        setError('Failed to create item. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm mt-4">
          <div className="card-body p-4">
            <h2 className="card-title mb-1">List an item</h2>
            <p className="text-muted mb-4">Describe what you'd like to swap</p>

            {/* show error if something goes wrong */}
            {error && <div className="alert alert-danger">{error}</div>}

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
                    placeholder="Describe your item - size, colour, age, any defects..."
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

              {/* category and condition dropdowns side by side */}
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
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
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

                    {CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
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

              {/* image upload field */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Photo
                {imageFiles.length > 0 && (
                    <span className="text-muted fw-normal ms-2">
                    ({imageFiles.length} of 3 selected)
                  </span>
                )}
                </label>
                <input
                    type="file"
                    className={`form-control ${
                        validationErrors.images ? 'is-invalid' : ''
                    }`}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                />
                {validationErrors.images && (
                    <div className="invalid-feedback">
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
                <div className="form-text">
                  Upload up to 3 images. Accepted formats: JPEG, PNG, WebP.
                </div>
                {/* show previews of selected images */}
                {imagePreviews.length > 0 && (
                    <div className="d-flex gap-2 mt-3 flex-wrap">
                      {imagePreviews.map((src, i) => (
                          <div key={src} className="position-relative">
                            <img
                                src={src}
                                alt={`Preview ${i + 1}`}
                                className="rounded"
                                style={{
                                  height: '120px',
                                  width: '120px',
                                  objectFit: 'cover',
                                }}
                            />
                            <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                onClick={() => handleRemoveImage(i)}
                                aria-label={`Remove photo ${i + 1}`}
                                title="Remove photo"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  padding: 0,
                                  lineHeight: 1,
                                }}
                            >
                              ×
                            </button>
                          </div>
                      ))}
                    </div>
                )}
              </div>

              {/* submit and cancel buttons */}
              <div className="d-flex gap-2">
                <button
                    type="submit"
                    className="btn flex-fill"
                    style={{backgroundColor: '#1a6eb5', color: 'white'}}
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
  );
}

export default CreateItem;
