import { useEffect, useMemo, useState } from 'react'
import ItemFilterBar from '../components/ItemFilterBar.jsx'
import ItemGrid from '../components/ItemGrid.jsx'

// map a backend item (ItemResponse) onto the shape ItemCard expects
function toCardItem(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.categoryName,
    condition: item.condition,
    owner: item.ownerUsername,
    location: item.ownerLocation,
  }
}

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

// Browse Items page (/items): search, filter and sort the full catalogue.
export default function BrowseItemsPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState('All')
  const [sort, setSort] = useState('newest')
// radius in km, 'all' means no distance filter
  const [radius, setRadius] = useState('all')

// get logged in user's coordinates from localStorage
  const userLat = parseFloat(localStorage.getItem('lat'))
  const userLng = parseFloat(localStorage.getItem('lng'))

  useEffect(() => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data.map(toCardItem)))
      .catch(() => setItems([]))
  }, [])

// filter options are derived from the data so every choice yields results.
  const categories = useMemo(
    () => ['All', ...new Set(items.map((i) => i.category))].sort(byAllFirst),
    [items]
  )
  const conditions = useMemo(
    () => ['All', ...new Set(items.map((i) => i.condition))].sort(byAllFirst),
    [items]
  )

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    const result = items.filter((item) => {
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      const matchesCategory = category === 'All' || item.category === category
      const matchesCondition = condition === 'All' || item.condition === condition
// distance filter - only applies if user has location and radius is set
// TODO: use real item owner coordinates from backend once available
  let matchesRadius = true
  if (radius !== 'all' && item.lat && item.lng) {
      const distance = haversineDistance(userLat, userLng, item.lat, item.lng)
      matchesRadius = distance <= parseInt(radius)
      }
      return matchesSearch && matchesCategory && matchesCondition && matchesRadius
    })

    return [...result].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'oldest') return a.id - b.id
      return b.id - a.id // TODO: sort by createdAt once available in API response
    })
  }, [items, search, category, condition, sort, radius, userLat, userLng])

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
        onCategoryChange={setCategory}
        categories={categories}
        condition={condition}
        onConditionChange={setCondition}
        conditions={conditions}
        sort={sort}
        onSortChange={setSort}
        radius={radius}
        onRadiusChange={setRadius}
      />

      <p className="text-muted small mb-3">
        {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'} found
      </p>

      <ItemGrid items={visibleItems} />
    </div>
  )
}

// keeps the "All" option at the top of a sorted dropdown list.
function byAllFirst(a, b) {
  if (a === 'All') return -1
  if (b === 'All') return 1
  return a.localeCompare(b)
}
