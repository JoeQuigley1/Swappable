import { useEffect, useMemo, useRef, useState } from 'react'
import ItemFilterBar from '../components/ItemFilterBar.jsx'
import ItemGrid from '../components/ItemGrid.jsx'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { API_BASE_URL, resolveImageUrl } from '../api/config.js'
import { toCardItem } from '../api/items.js'
import { CONDITIONS } from '../lib/constants.js'

// fix leaflet's default marker icon not loading in vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// calculates distance in km between two coordinates
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// maps a UI sort option to the backend Pageable sort param
const SORT_PARAMS = {
  newest: 'createdAt,desc',
  oldest: 'createdAt,asc',
  title: 'title,asc',
}

// how many items to request per page (200 is the max we expose)
const PAGE_SIZE_OPTIONS = [20, 50, 100, 200]

// Browse Items page (/items). Pagination, category and sort are server-side.
// Search, condition and radius refine the returned page client-side.
export default function BrowseItemsPage() {
  const [items, setItems] = useState([]) // the current page returned by the server
  const [categoryOptions, setCategoryOptions] = useState([]) // [{ id, name, ... }]
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState('All')
  const [sort, setSort] = useState('newest')
// radius in km, 'all' means no distance filter
  const [radius, setRadius] = useState('all')

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

// get logged in user's coordinates from localStorage
  const userLat = parseFloat(localStorage.getItem('lat'))
  const userLng = parseFloat(localStorage.getItem('lng'))
  const isLoggedIn = !!localStorage.getItem('token')
// an account with no coordinates yet gives NaN, which would fail every
// distance comparison and hide the whole list, so the filter stays hidden
  const hasUserCoords = Number.isFinite(userLat) && Number.isFinite(userLng)
// tracks which item pin is being hovered on the map
  const [hoveredItem, setHoveredItem] = useState(null)
  const gridRef = useRef(null)

// load the category list once, for the dropdown and to map a category name to its id
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategoryOptions(Array.isArray(data) ? data : []))
      .catch(() => setCategoryOptions([]))
  }, [])

// changing a server-side filter resets back to the first page
  const handleCategoryChange = (value) => {
    setCategory(value)
    setPage(0)
  }
  const handleSortChange = (value) => {
    setSort(value)
    setPage(0)
  }
  const handlePageSizeChange = (value) => {
    setPageSize(value)
    setPage(0)
  }

// fetch the current page from the backend (pagination, category and sort are server-side)
  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      sort: SORT_PARAMS[sort] ?? SORT_PARAMS.newest,
    })
    const selected = categoryOptions.find((c) => c.name === category)
    if (selected) params.set('categoryId', String(selected.id))

    fetch(`${API_BASE_URL}/items?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems((data.content ?? []).map(toCardItem))
        setTotalPages(data.totalPages ?? 0)
        setTotalElements(data.totalElements ?? 0)
      })
      .catch(() => {
        setItems([])
        setTotalPages(0)
        setTotalElements(0)
      })
  }, [page, pageSize, category, sort, categoryOptions])

// category options come from the backend; condition options are the fixed enum
  const categories = useMemo(
    () => ['All', ...categoryOptions.map((c) => c.name)],
    [categoryOptions]
  )
  const conditions = ['All', ...CONDITIONS]

// TODO: search, condition and radius are filtered client-side, so they only
// refine the current page, not the whole catalogue. Create issues to add
// server-side support (search + condition query params on GET /api/items, plus
// a distance/radius filter) and move this filtering into the backend request.
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items.filter((item) => {
// TODO (server-side): text search on title/description
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
// TODO (server-side): condition filter
      const matchesCondition = condition === 'All' || item.condition === condition
// TODO (server-side): distance/radius filter, only applies if user has location
      let matchesRadius = true
      if (radius !== 'all' && hasUserCoords && item.lat && item.lng) {
        const distance = haversineDistance(userLat, userLng, item.lat, item.lng)
        matchesRadius = distance <= parseInt(radius)
      }
      return matchesSearch && matchesCondition && matchesRadius
    })
  }, [items, search, condition, radius, userLat, userLng, hasUserCoords])

// when a client-side filter is active the count reflects the current page,
// otherwise it reflects the full server-side total for the selected category
  const clientFiltered = search.trim() !== '' || condition !== 'All' || radius !== 'all'
  const foundCount = clientFiltered ? visibleItems.length : totalElements

  return (
    <div className="container pt-2 pb-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Browse Items</h2>
        <p className="text-muted mb-0">Find something to swap from the community</p>
      </div>

      <ItemFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        condition={condition}
        onConditionChange={setCondition}
        conditions={conditions}
        sort={sort}
        onSortChange={handleSortChange}
        radius={radius}
        onRadiusChange={setRadius}
        showRadius={isLoggedIn && hasUserCoords}
      />


  {/* leaflet map showing item locations */}
  <div className="mb-4 position-relative" style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
         center={[53.4, -8.2]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
      >
           <TileLayer
             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
           />
           {visibleItems
              .filter(item => item.lat && item.lng)
              .map(item => (
                <Marker
                  key={item.id}
                  position={[item.lat, item.lng]}
                  eventHandlers={{
                    mouseover: () => setHoveredItem(item),
                    mouseout: () => setHoveredItem(null),
                    click: () => window.location.href = `/items/${item.id}`
                  }}
                >
                </Marker>
              ))}
          </MapContainer>

  {/* hover preview card shown in top right corner of map */}
  {hoveredItem && (
      <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          width: '200px',
          overflow: 'hidden',
          pointerEvents: 'none'
      }}>
        {hoveredItem.imageUrl && (
            <img
               src={resolveImageUrl(hoveredItem.imageUrl)}
               alt={hoveredItem.title}
               style={{ width: '100%', height: '120px', objectFit: 'cover' }}
            />
        )}
        <div style={{ padding: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                {hoveredItem.title}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
                {hoveredItem.condition} · {hoveredItem.category}
             </div>
             <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  by {hoveredItem.owner}
             </div>
             <div style={{ fontSize: '11px', color: '#00aaff', marginTop: '4px' }}>
                 Click to view →
                </div>
              </div>
            </div>
          )}
        </div>


      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <p className="text-muted small mb-0">
          {foundCount} {foundCount === 1 ? 'item' : 'items'} found
        </p>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="pageSize" className="text-muted small mb-0">Per page</label>
          <select
            id="pageSize"
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

        <div ref={gridRef}>
            <ItemGrid items={visibleItems} />
        </div>

        {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center gap-3 mt-4 mb-4">
               <button
                 className="btn btn-outline-secondary btn-sm"
                 onClick={() => {
                     setPage((p) => Math.max(p - 1, 0))
                     gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                   }}
                   disabled={page === 0}
                 >
                    Previous
                  </button>
                  <span className="text-muted small">Page {page + 1} of {totalPages}</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                   onClick={() => {
                        setPage((p) => Math.min(p + 1, totalPages - 1))
                     gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                disabled={page + 1 >= totalPages}
               >
                 Next
               </button>
            </div>
          )}
    </div>
  )
}
