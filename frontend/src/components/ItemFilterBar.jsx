// search + filter controls for the Browse Items page.
// fully controlled: the page owns the state and passes values + change handlers.
export default function ItemFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  condition,
  onConditionChange,
  conditions,
  sort,
  onSortChange,
  radius,
  onRadiusChange,
}) {
  return (
    <div className="card border-0 shadow-sm mb-4 brand-gradient text-white">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-lg-5">
            <label className="form-label fw-semibold small mb-1">Search</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search items..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          <div className="col-sm-4 col-lg-3">
            <label className="form-label fw-semibold small mb-1">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4 col-lg-2">
            <label className="form-label fw-semibold small mb-1">Condition</label>
            <select
              className="form-select"
              value={condition}
              onChange={(e) => onConditionChange(e.target.value)}
            >
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4 col-lg-2">
            <label className="form-label fw-semibold small mb-1">Sort by</label>
            <select
              className="form-select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
          {/* distance radius filter */}
           <div className="col-sm-4 col-lg-2">
               <label className="form-label fw-semibold small mb-1">Distance</label>
               <select
                  className="form-select"
                  value={radius}
                  onChange={(e) => onRadiusChange(e.target.value)}
               >
                  <option value="all">All Ireland</option>
                  <option value="10">Within 10km</option>
                  <option value="25">Within 25km</option>
                  <option value="50">Within 50km</option>
                  <option value="100">Within 100km</option>
               </select>
           </div>
        </div>
      </div>
    </div>
  )
}
