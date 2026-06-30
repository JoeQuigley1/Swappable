import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../api/items';

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

  const [imageFiles, setImageFiles] = useState([]);
  // temporary preview URL of the selected image
  const [imagePreviews, setImagePreviews] = useState([]);
  // error message if something goes wrong
  const [error, setError] = useState('');
  // shows loading state while form is submitting
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/categories')
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch((error) => console.error(error));
  }, []);

  // updates form data when user types in any field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handles image selection and creates a preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError('Failed to create item.');
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
                    name="categoryId"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
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
                    {CONDITIONS.map((con) => (
                      <option key={con} value={con}>
                        {con}
                      </option>
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
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                />
                <div className="form-text">
                  Upload up to 3 images. Accepted formats: JPEG, PNG, WebP.
                </div>

                {/* show previews of selected images */}
                {imagePreviews.length > 0 && (
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    {imagePreviews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="rounded"
                        style={{
                          height: '120px',
                          width: '120px',
                          objectFit: 'cover',
                        }}
                      />
                    ))}
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
  );
}

export default CreateItem;
