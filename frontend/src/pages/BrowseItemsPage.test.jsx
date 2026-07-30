import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import BrowseItemsPage, { spreadMarkerPositions } from './BrowseItemsPage'

// the leaflet map needs a real browser, and it is not what these tests are about
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
    TileLayer: () => null,
    Marker: () => null,
    Popup: () => null
}))

const CATEGORIES = [
    { id: 1, name: 'Books', itemCount: 2 },
    { id: 2, name: 'Music', itemCount: 5 }
]

const ITEM = {
    id: 7,
    title: 'Old guitar',
    description: 'Barely used acoustic guitar',
    categoryName: 'Music',
    condition: 'Good',
    ownerId: 2,
    ownerUsername: 'anna',
    ownerLocation: 'Galway',
    imageUrl: null
}

// records every /items request so the tests can assert on the query string
let itemRequests = []

function stubFetch() {
    return vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        if (String(url).includes('/categories')) {
            return Promise.resolve({ ok: true, status: 200, json: async () => CATEGORIES })
        }

        itemRequests.push(String(url))

        return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ content: [ITEM], totalPages: 1, totalElements: 1 })
        })
    })
}

function renderPage(entry = '/items') {
    return render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route path="/items" element={<BrowseItemsPage />} />
            </Routes>
        </MemoryRouter>
    )
}

beforeEach(() => {
    itemRequests = []
    localStorage.clear()
    stubFetch()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('BrowseItemsPage', () => {
    test('requests every category when no filter is in the url', async () => {
        renderPage()

        await waitFor(() => expect(itemRequests.length).toBeGreaterThan(0))

        expect(itemRequests.every((url) => !url.includes('categoryId'))).toBe(true)
    })

    test('a category in the url filters the request and preselects the dropdown', async () => {
        renderPage('/items?category=Music')

        await waitFor(() => {
            expect(itemRequests.some((url) => url.includes('categoryId=2'))).toBe(true)
        })

        // no request went out unfiltered while the category list was loading
        expect(itemRequests.every((url) => url.includes('categoryId=2'))).toBe(true)

        const [categorySelect] = screen.getAllByRole('combobox')
        expect(categorySelect).toHaveValue('Music')
    })

    test('choosing a category from the dropdown filters and updates the url', async () => {
        const user = userEvent.setup()

        renderPage()

        await waitFor(() => expect(screen.getByText('Books')).toBeInTheDocument())

        const [categorySelect] = screen.getAllByRole('combobox')
        await user.selectOptions(categorySelect, 'Books')

        await waitFor(() => {
            expect(itemRequests.some((url) => url.includes('categoryId=1'))).toBe(true)
        })
    })

    test('an unknown category in the url falls back to all items', async () => {
        renderPage('/items?category=Nonsense')

        await waitFor(() => expect(itemRequests.length).toBeGreaterThan(0))

        expect(itemRequests.every((url) => !url.includes('categoryId'))).toBe(true)

        const [categorySelect] = screen.getAllByRole('combobox')
        await waitFor(() => expect(categorySelect).toHaveValue('All'))
    })
})

describe('spreadMarkerPositions', () => {
    test('leaves a single item at its own coordinates unchanged', () => {
        const result = spreadMarkerPositions([
            { id: 1, lat: 53.27, lng: -9.05 }
        ])

        expect(result).toEqual([
            { item: { id: 1, lat: 53.27, lng: -9.05 }, position: [53.27, -9.05] }
        ])
    })

    test('leaves items at different coordinates unchanged', () => {
        const items = [
            { id: 1, lat: 53.27, lng: -9.05 },
            { id: 2, lat: 53.35, lng: -6.26 }
        ]

        const result = spreadMarkerPositions(items)

        expect(result[0].position).toEqual([53.27, -9.05])
        expect(result[1].position).toEqual([53.35, -6.26])
    })

    test('spreads apart items that share the same owner coordinates', () => {
        // simulates one owner with three listed items - all three come
        // through with identical ownerLatitude/ownerLongitude
        const items = [
            { id: 1, lat: 53.27, lng: -9.05 },
            { id: 2, lat: 53.27, lng: -9.05 },
            { id: 3, lat: 53.27, lng: -9.05 }
        ]

        const result = spreadMarkerPositions(items)

        // the first one keeps the exact original coordinates
        expect(result[0].position).toEqual([53.27, -9.05])

        // every position is unique - no two items land on the same pixel
        const positions = result.map((r) => r.position.join(','))
        expect(new Set(positions).size).toBe(3)

        // the offset stays small (within roughly 100m) so pins remain
        // grouped near the real location rather than drifting away from it
        for (const { position } of result) {
            expect(Math.abs(position[0] - 53.27)).toBeLessThan(0.002)
            expect(Math.abs(position[1] - (-9.05))).toBeLessThan(0.002)
        }
    })

    test('preserves the original item reference alongside its position', () => {
        const item = { id: 5, lat: 53.27, lng: -9.05, title: 'Bike' }

        const [result] = spreadMarkerPositions([item])

        expect(result.item).toBe(item)
    })
})