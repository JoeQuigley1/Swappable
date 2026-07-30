import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BrowseItemsPage from './BrowseItemsPage'

vi.mock('../api/config.js', () => ({
    API_BASE_URL: '/api',
    resolveImageUrl: (url) => url,
}))

vi.mock('../api/items.js', () => ({
    toCardItem: (item) => item,
}))

vi.mock('../components/ItemGrid.jsx', () => ({
    default: ({ items }) => (
        <div data-testid="item-grid">
            {items.map((item) => (
                <div key={item.id}>{item.title}</div>
            ))}
        </div>
    ),
}))

vi.mock('../components/ItemFilterBar.jsx', () => ({
    default: ({
                  search,
                  onSearchChange,
                  category,
                  onCategoryChange,
                  categories,
                  condition,
                  onConditionChange,
                  sort,
                  onSortChange,
                  radius,
                  onRadiusChange,
                  showRadius,
              }) => (
        <div>
            <input
                aria-label="Search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
            />

            <select
                aria-label="Category"
                value={category}
                onChange={(event) => onCategoryChange(event.target.value)}
            >
                {categories.map((value) => (
                    <option key={value}>{value}</option>
                ))}
            </select>

            <select
                aria-label="Condition"
                value={condition}
                onChange={(event) => onConditionChange(event.target.value)}
            >
                <option>All</option>
                <option>New</option>
                <option>Good</option>
            </select>

            <select
                aria-label="Sort"
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
            </select>

            {showRadius && (
                <select
                    aria-label="Radius"
                    value={radius}
                    onChange={(event) => onRadiusChange(event.target.value)}
                >
                    <option value="all">All</option>
                    <option value="10">10 km</option>
                    <option value="50">50 km</option>
                </select>
            )}
        </div>
    ),
}))

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
    TileLayer: () => null,
    Marker: ({ position }) => (
        <div data-testid="marker">
            {position.join(',')}
        </div>
    ),
    Popup: ({ children }) => <div>{children}</div>,
}))

vi.mock('leaflet', () => ({
    default: {
        Icon: {
            Default: {
                prototype: {},
                mergeOptions: vi.fn(),
            },
        },
    },
}))

const categories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Books' },
]

const items = [
    {
        id: 1,
        title: 'Gaming Laptop',
        description: 'A working laptop',
        condition: 'Good',
        category: 'Electronics',
        owner: 'Joe',
        lat: 53.34,
        lng: -6.26,
    },
    {
        id: 2,
        title: 'Java Book',
        description: 'Programming guide',
        condition: 'New',
        category: 'Books',
        owner: 'Anna',
        lat: 51.90,
        lng: -8.47,
    },
]

function mockSuccessfulRequests({
                                    content = items,
                                    totalPages = 2,
                                    totalElements = 2,
                                } = {}) {
    globalThis.fetch = vi.fn((url) => {
        if (url.includes('/categories')) {
            return Promise.resolve({
                ok: true,
                json: async () => categories,
            })
        }

        return Promise.resolve({
            ok: true,
            json: async () => ({
                content,
                totalPages,
                totalElements,
            }),
        })
    })
}

describe('BrowseItemsPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()

        Element.prototype.scrollIntoView = vi.fn()
    })

    test('fetches categories and the first page of newest items', async () => {
        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        expect(await screen.findByText('Gaming Laptop')).toBeInTheDocument()

        expect(globalThis.fetch).toHaveBeenCalledWith('/api/categories')

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/items?page=0&size=20&sort=createdAt%2Cdesc')
        )
    })

    test('displays the total number of items reported by the server', async () => {
        mockSuccessfulRequests({
            content: items,
            totalPages: 5,
            totalElements: 87,
        })

        render(<BrowseItemsPage />)

        expect(await screen.findByText('87 items found')).toBeInTheDocument()
    })

    test('includes the category id when a category is selected', async () => {
        const user = userEvent.setup()
        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        await screen.findByText('Gaming Laptop')

        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Category' }),
            'Books'
        )

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('categoryId=2')
            )
        })
    })

    test('sends the selected sort order to the backend', async () => {
        const user = userEvent.setup()
        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        await screen.findByText('Gaming Laptop')

        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Sort' }),
            'oldest'
        )

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('sort=createdAt%2Casc')
            )
        })
    })

    test('requests the next page when Next is clicked', async () => {
        const user = userEvent.setup()
        mockSuccessfulRequests({ totalPages: 3 })

        render(<BrowseItemsPage />)

        await screen.findByText('Page 1 of 3')

        await user.click(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('page=1')
            )
        })

        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })

    test('disables Previous on the first page', async () => {
        mockSuccessfulRequests({ totalPages: 3 })

        render(<BrowseItemsPage />)

        expect(
            await screen.findByRole('button', { name: 'Previous' })
        ).toBeDisabled()
    })

    test('filters the current page using the search term', async () => {
        const user = userEvent.setup()
        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        await screen.findByText('Gaming Laptop')

        await user.type(
            screen.getByRole('textbox', { name: 'Search' }),
            'java'
        )

        expect(screen.getByText('Java Book')).toBeInTheDocument()
        expect(screen.queryByText('Gaming Laptop')).not.toBeInTheDocument()
        expect(screen.getByText('1 item found')).toBeInTheDocument()
    })

    test('filters the current page by condition', async () => {
        const user = userEvent.setup()
        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        await screen.findByText('Gaming Laptop')

        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Condition' }),
            'New'
        )

        expect(screen.getByText('Java Book')).toBeInTheDocument()
        expect(screen.queryByText('Gaming Laptop')).not.toBeInTheDocument()
    })

    test('only shows the radius filter for a logged-in user with coordinates', async () => {
        localStorage.setItem('token', 'test-token')
        localStorage.setItem('lat', '53.34')
        localStorage.setItem('lng', '-6.26')

        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        expect(
            await screen.findByRole('combobox', { name: 'Radius' })
        ).toBeInTheDocument()
    })

    test('does not show the radius filter when coordinates are missing', async () => {
        localStorage.setItem('token', 'test-token')
        mockSuccessfulRequests()

        render(<BrowseItemsPage />)

        await screen.findByText('Gaming Laptop')

        expect(
            screen.queryByRole('combobox', { name: 'Radius' })
        ).not.toBeInTheDocument()
    })

    test('clears the items when the items request fails', async () => {
        globalThis.fetch = vi.fn((url) => {
            if (url.includes('/categories')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => categories,
                })
            }

            return Promise.reject(new Error('Network error'))
        })

        render(<BrowseItemsPage />)

        expect(await screen.findByText('0 items found')).toBeInTheDocument()
        expect(screen.queryByText('Gaming Laptop')).not.toBeInTheDocument()
    })
})