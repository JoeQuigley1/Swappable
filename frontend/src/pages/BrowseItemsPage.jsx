import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ItemFilterBar from '../components/ItemFilterBar.jsx'
import ItemGrid from '../components/ItemGrid.jsx'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { API_BASE_URL, resolveImageUrl } from '../api/config.js'
import { getItems, toCardItem } from '../api/items.js'
import { BRAND_COLOR, CONDITIONS } from '../lib/constants.js'

// fix leaflet's default marker icon not loading in vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// items share the owner's coordinates rather than having their own location - every item still gets its own visible, clickable pin
export function spreadMarkerPositions(items) {
  const seenCounts = new Map()

  return items.map((item) => {
    const key = `${item.lat.toFixed(5)},${item.lng.toFixed(5)}`
    const occurrence = seenCounts.get(key) ?? 0
    seenCounts.set(key, occurrence + 1)

    if (occurrence === 0) {
      return { item, position: [item.lat, item.lng] }
    }

    // spread repeats around the original point using the golden angle, so
    // they fan out evenly instead of lining up in one direction
    const angle = occurrence * 137.5 * (Math.PI / 180)
    const radiusDegrees = 0.0006 * occurrence // roughly 60-70m per step
    return {
      item,
      position: [
        item.lat + radiusDegrees * Math.cos(angle),
        item.lng + radiusDegrees * Math.sin(angle),
      ],
    }
  })
}

// maps a UI sort option to the backend Pageable sort param
const SORT_PARAMS = {
  newest: 'createdAt,desc',
  oldest: 'createdAt,asc',
  title: 'title,asc',
}

// how many items to request per page (200 is the max we expose)
const PAGE_SIZE_OPTIONS = [20, 50, 100, 200]

// 'All' and 'all' are the "no filter" values the dropdowns start on.
// the submitted category is held by name because that is what the url carries,
// and the name is known at mount while the id only arrives with the category list
const DEFAULT_SUBMITTED = {
  search: '',
  categoryName: '',
  condition: 'All',
  sort: 'newest',
  radius: 'all',
}

// the draft holds the category by id, which is what the dropdown works in.
// null means the user has not touched it, so it follows what was submitted
const DEFAULT_DRAFT = {
  search: '',
  categoryId: null,
  condition: 'All',
  sort: 'newest',
  radius: 'all',
}

// Browse Items page (/items). Every filter (search, category, condition, sort,
// distance) and the pagination are applied by the backend, so results cover the
// whole catalogue rather than whatever happened to be on the current page.
// The search box only queries when submitted, so typing a word costs one query
// rather than one per letter.
export default function BrowseItemsPage() {
// ?category=<name> lets the home page category cards land here pre-filtered
  const [searchParams, setSearchParams] = useSearchParams()

// the last page the server returned, tagged with the filters that produced it.
// keeping them together is what lets us tell a stale view from a current one
  const [result, setResult] = useState({ key: null, items: [], totalPages: 0, totalElements: 0 })
  const [categoryOptions, setCategoryOptions] = useState([]) // [{ id, name, ... }]
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
// draft is what the filter bar shows, submitted is what has actually been applied.
// keeping them apart is what lets the user set up several controls and pay for one
// query, instead of one query per control they touch
  const [draft, setDraft] = useState(DEFAULT_DRAFT)
// ?category=<name> from the home page cards is already a submitted filter on arrival
  const [submitted, setSubmitted] = useState(() => ({
    ...DEFAULT_SUBMITTED,
    categoryName: searchParams.get('category') ?? '',
  }))

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])
  const [error, setError] = useState('')

// get logged in user's coordinates from localStorage
  const isLoggedIn = !!localStorage.getItem('token')
  const storedLat = parseFloat(localStorage.getItem('lat'))
  const storedLng = parseFloat(localStorage.getItem('lng'))
// an account with no coordinates yet gives NaN, which the distance filter cannot
// use, so the filter stays hidden. Normalising to null also keeps the value stable
// across renders, because NaN never equals itself in a dependency array
  const hasUserCoords = Number.isFinite(storedLat) && Number.isFinite(storedLng)
  const userLat = hasUserCoords ? storedLat : null
  const userLng = hasUserCoords ? storedLng : null
// tracks which item pin is being hovered on the map
  const [hoveredItem, setHoveredItem] = useState(null)
  const gridRef = useRef(null)

// load the category list once, for the dropdown
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategoryOptions(Array.isArray(data) ? data : []))
      .catch(() => setCategoryOptions([]))
      .finally(() => setCategoriesLoaded(true))
  }, [])

// the submitted category name only becomes an id once the category list is in.
// a name that is not in the list (stale link, hand-edited url) resolves to nothing
// and so behaves like no filter
  const submittedCategoryId = String(
    categoryOptions.find((c) => c.name === submitted.categoryName)?.id ?? ''
  )

// what has actually been applied, with the category as the id the request needs
  const filters = useMemo(
    () => ({ ...submitted, categoryId: submittedCategoryId }),
    [submitted, submittedCategoryId]
  )
// the dropdown shows the submitted category until the user picks another one
  const draftView = useMemo(
    () => ({ ...draft, categoryId: draft.categoryId ?? submittedCategoryId }),
    [draft, submittedCategoryId]
  )

// mirrors the submitted category into the url so the view stays shareable. this is
// only ever an output: the request is driven by state, so writing it cannot cost a
// second query
  const syncCategoryParam = (name) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (name) next.set('category', name)
      else next.delete('category')
      return next
    }, { replace: true })
  }

// editing a control only updates the draft, it does not query
  const handleFilterChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

// submitting is the only thing that queries, from the button or the Enter key
  const handleSubmit = () => {
    const categoryName =
      categoryOptions.find((c) => String(c.id) === String(draftView.categoryId))?.name ?? ''

    setSubmitted({
      search: draftView.search.trim(),
      categoryName,
      condition: draftView.condition,
      sort: draftView.sort,
      radius: draftView.radius,
    })
    // hand the dropdown back to the submitted value now that it has been applied
    setDraft((current) => ({ ...current, categoryId: null }))
    syncCategoryParam(categoryName)
    setPage(0)
  }
  const handleReset = () => {
    setDraft(DEFAULT_DRAFT)
    setSubmitted(DEFAULT_SUBMITTED)
    syncCategoryParam('')
    setPage(0)
  }
// drops a single filter straight away, from the chips under the bar
  const handleRemoveFilter = (key) => {
    if (key === 'categoryId') {
      setDraft((current) => ({ ...current, categoryId: null }))
      setSubmitted((current) => ({ ...current, categoryName: '' }))
      syncCategoryParam('')
      setPage(0)
      return
    }

    setDraft((current) => ({ ...current, [key]: DEFAULT_DRAFT[key] }))
    setSubmitted((current) => ({ ...current, [key]: DEFAULT_SUBMITTED[key] }))
    setPage(0)
  }

// paging is navigation rather than filtering, so it applies straight away
  const handlePageSizeChange = (value) => {
    setPageSize(value)
    setPage(0)
  }

// identifies the page the submitted filters ask for. Comparing it to the key stored
// alongside the last result tells us whether what is on screen is up to date
  const requestKey = JSON.stringify([page, pageSize, filters, userLat, userLng])

// fetch the current page from the backend with every submitted filter applied
  useEffect(() => {
    // the url gives the category by name, and it only becomes an id once the
    // category list is in, so hold the request back rather than flashing the
    // unfiltered catalogue first
    if (filters.categoryName && !categoriesLoaded) return

    const controller = new AbortController()

    getItems(
      {
        page,
        size: pageSize,
        sort: SORT_PARAMS[filters.sort] ?? SORT_PARAMS.newest,
        categoryId: filters.categoryId || undefined,
        search: filters.search || undefined,
        condition: filters.condition === 'All' ? undefined : filters.condition,
        lat: userLat,
        lng: userLng,
        radiusKm: filters.radius === 'all' ? undefined : Number(filters.radius),
      },
      controller.signal
    )
      .then((data) => {
        setResult({
          key: requestKey,
          items: (data.content ?? []).map(toCardItem),
          totalPages: data.totalPages ?? 0,
          totalElements: data.totalElements ?? 0,
        })
        setError('')
      })
      .catch((err) => {
// a newer request replaced this one, so its result is no longer wanted
        if (err.name === 'AbortError') return

        setResult({ key: requestKey, items: [], totalPages: 0, totalElements: 0 })
        setError('Could not load items. Please try again.')
      })

    return () => controller.abort()
  }, [requestKey, page, pageSize, filters, userLat, userLng, categoriesLoaded])

// category options come from the backend; condition options are the fixed enum
  const categories = useMemo(
    () => [{ id: '', name: 'All' }, ...categoryOptions],
    [categoryOptions]
  )
  const conditions = ['All', ...CONDITIONS]

// true while the filter bar shows changes the user has not submitted yet
  const pending =
    draftView.search.trim() !== filters.search ||
    String(draftView.categoryId) !== String(filters.categoryId) ||
    draftView.condition !== filters.condition ||
    draftView.sort !== filters.sort ||
    draftView.radius !== filters.radius

// every filter currently narrowing the results, so a small count is always
// explainable. Sort is left out because it reorders rather than narrows
  const activeFilters = useMemo(() => {
    const chips = []

    if (filters.search) {
      chips.push({ key: 'search', label: `Search: ${filters.search}` })
    }
    if (filters.categoryId) {
      const name = categoryOptions.find((c) => String(c.id) === filters.categoryId)?.name
      if (name) chips.push({ key: 'categoryId', label: `Category: ${name}` })
    }
    if (filters.condition !== DEFAULT_SUBMITTED.condition) {
      chips.push({ key: 'condition', label: `Condition: ${filters.condition}` })
    }
    if (filters.radius !== DEFAULT_SUBMITTED.radius) {
      chips.push({ key: 'radius', label: `Within ${filters.radius}km` })
    }

    return chips
  }, [filters, categoryOptions])

  const { items, totalPages } = result
// the backend now filters everything, so the total it reports is the real count
  const foundCount = result.totalElements
// a result tagged with older filters means a newer request is still in flight
  const loading = result.key !== requestKey
// keep the previous results on screen while the next page loads so the page does
// not flash empty; only the very first load gets a spinner
  const showSpinner = loading && items.length === 0

  return (
    <div className="container pt-2 pb-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Browse Items</h2>
        <p className="text-muted mb-0">Find something to swap from the community</p>
      </div>

      <ItemFilterBar
        filters={draftView}
        onChange={handleFilterChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        categories={categories}
        conditions={conditions}
        showRadius={isLoggedIn && hasUserCoords}
        pending={pending}
      />

      {error && <div className="alert alert-danger">{error}</div>}


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
           {spreadMarkerPositions(items.filter(item => item.lat && item.lng))
              .map(({ item, position }) => (
                <Marker
                  key={item.id}
                  position={position}
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
        <p className="text-muted small mb-0 d-flex align-items-center gap-2">
          {foundCount} {foundCount === 1 ? 'item' : 'items'} found
          {/* explains why the count does not match the controls yet */}
          {pending && (
            <span className="text-warning-emphasis">Press Enter or click Search to apply</span>
          )}
          {activeFilters.map((chip) => (
            <span key={chip.key} className="badge bg-light text-secondary border fw-normal">
              {chip.label}
              <button
                type="button"
                className="btn btn-sm btn-link p-0 ms-2 align-baseline text-secondary"
                onClick={() => handleRemoveFilter(chip.key)}
                aria-label={`Remove ${chip.label}`}
              >
                <i className="bi bi-x"></i>
              </button>
            </span>
          ))}
          {loading && items.length > 0 && (
            <span
              className="spinner-border spinner-border-sm"
              style={{ color: BRAND_COLOR }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </span>
          )}
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

        <div ref={gridRef} style={{ opacity: loading && items.length > 0 ? 0.6 : 1 }}>
            {showSpinner ? (
                <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: BRAND_COLOR }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <ItemGrid items={items} columnsLg={4} />
            )}
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
