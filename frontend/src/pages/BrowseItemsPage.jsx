import { useMemo, useState } from 'react'
import ItemFilterBar from '../components/ItemFilterBar.jsx'
import ItemGrid from '../components/ItemGrid.jsx'
import { browseItems } from '../lib/mockData.js'

// Browse Items page (/items): search, filter and sort the full catalogue.
// TODO: replace browseItems with a real API call to GET /api/items
export default function BrowseItemsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [condition, setCondition] = useState('All')
  const [sort, setSort] = useState('newest')

  // filter options are derived from the data so every choice yields results.
  const categories = useMemo(
    () => ['All', ...new Set(browseItems.map((i) => i.category))].sort(byAllFirst),
    []
  )
  const conditions = useMemo(
    () => ['All', ...new Set(browseItems.map((i) => i.condition))].sort(byAllFirst),
    []
  )

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    const result = browseItems.filter((item) => {
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      const matchesCategory = category === 'All' || item.category === category
      const matchesCondition = condition === 'All' || item.condition === condition
      return matchesSearch && matchesCategory && matchesCondition
    })

    return [...result].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'oldest') return a.id - b.id
      return b.id - a.id // newest
    })
  }, [search, category, condition, sort])

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
