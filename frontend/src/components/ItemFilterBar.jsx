// search + filter controls for the Browse Items page.
// fully controlled: the page owns the state and passes values + change handlers.
// nothing here queries on its own. The user sets up the search box and the
// dropdowns, then submits the lot with one button, so a visit costs one query
// rather than one per keystroke and one per dropdown.
// `categories` is a list of { id, name }; the selected value is the category id
// because that is what the backend filters on.
export default function ItemFilterBar({
  filters,
  onChange,
  onSubmit,
  onReset,
  categories,
  conditions,
  showRadius,
  pending,
}) {
  return (
    <div className="card border-0 shadow-sm mb-4 brand-gradient text-white">
      <div className="card-body">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {/* the search box is fixed width and the buttons size to their content, so
              the selects share whatever is left over. That keeps the bar on one line
              on desktop whether or not the Distance filter is showing, and it falls
              back to two per row on small screens */}
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-3">
              <label htmlFor="itemSearch" className="form-label fw-semibold small mb-1">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  id="itemSearch"
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search items..."
                  value={filters.search}
                  onChange={(e) => onChange('search', e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-lg">
              <label htmlFor="itemCategory" className="form-label fw-semibold small mb-1">Category</label>
              <select
                id="itemCategory"
                className="form-select"
                value={filters.categoryId}
                onChange={(e) => onChange('categoryId', e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg">
              <label htmlFor="itemCondition" className="form-label fw-semibold small mb-1">Condition</label>
              <select
                id="itemCondition"
                className="form-select"
                value={filters.condition}
                onChange={(e) => onChange('condition', e.target.value)}
              >
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg">
              <label htmlFor="itemSort" className="form-label fw-semibold small mb-1">Sort by</label>
              <select
                id="itemSort"
                className="form-select"
                value={filters.sort}
                onChange={(e) => onChange('sort', e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {/* distance radius filter - only when logged in (needs user coordinates) */}
            {showRadius && (
              <div className="col-6 col-lg">
                <label htmlFor="itemDistance" className="form-label fw-semibold small mb-1">Distance</label>
                <select
                  id="itemDistance"
                  className="form-select"
                  value={filters.radius}
                  onChange={(e) => onChange('radius', e.target.value)}
                >
                  <option value="all">All Ireland</option>
                  <option value="10">Within 10km</option>
                  <option value="25">Within 25km</option>
                  <option value="50">Within 50km</option>
                  <option value="100">Within 100km</option>
                </select>
              </div>
            )}

            <div className="col-12 col-lg-auto">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={onReset}
                  title="Reset all filters"
                  aria-label="Reset all filters"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
                {/* highlighted while there are unapplied changes, so the cue costs
                    no extra space in the bar */}
                <button
                  type="submit"
                  className={`btn fw-semibold px-4 ${pending ? 'btn-warning' : 'btn-light'}`}
                  title={pending ? 'Press Enter or click Search to apply' : 'Search'}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
