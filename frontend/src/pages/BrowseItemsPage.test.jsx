import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BrowseItemsPage, { spreadMarkerPositions } from './BrowseItemsPage'
import { getItems } from '../api/items'

// the map is not what these tests are about, and leaflet needs a real DOM to draw
vi.mock('leaflet', () => ({
    default: {
        Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } }
    }
}))

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
    TileLayer: () => null,
    Marker: () => null,
    Popup: () => null
}))

// keep toCardItem real, it is the contract between the API and ItemCard
vi.mock('../api/items', async () => {
    const actual = await vi.importActual('../api/items')

    return {
        ...actual,
        getItems: vi.fn()
    }
})

const CATEGORIES = [
    { id: 1, name: 'Books' },
    { id: 2, name: 'Electronics' }
]

const ITEM = {
    id: 5,
    title: 'Mountain Bike',
    description: 'A red mountain bike',
    condition: 'Good',
    imageUrl: null,
    status: 'available',
    categoryId: 1,
    categoryName: 'Books',
    ownerId: 3,
    ownerUsername: 'dub',
    ownerLocation: 'Dublin',
    ownerLatitude: 53.3498,
    ownerLongitude: -6.2603,
    imageUrls: [],
    createdAt: null
}

function page(content = [ITEM]) {
    return { content, totalPages: 1, totalElements: content.length, last: true }
}

beforeEach(() => {
    getItems.mockReset()
    getItems.mockResolvedValue(page())

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => CATEGORIES
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

function renderPage(entry = '/items') {
    render(
        <MemoryRouter initialEntries={[entry]}>
            <BrowseItemsPage />
        </MemoryRouter>
    )
}

describe('BrowseItemsPage', () => {
    test('renders the page the server returns', async () => {
        renderPage()

        expect(await screen.findByText('Mountain Bike')).toBeInTheDocument()
        expect(screen.getByText(/1 item found/i)).toBeInTheDocument()
    })

    test('does not query the backend while the user is typing', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByText('Mountain Bike')
        const callsBeforeTyping = getItems.mock.calls.length

        await user.type(screen.getByLabelText(/search item name/i), 'acoustic')

        // eight keystrokes, zero requests
        expect(getItems.mock.calls.length).toBe(callsBeforeTyping)
        expect(screen.getByText(/press enter or click search/i)).toBeInTheDocument()
    })

    test('searches when the Search button is clicked', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByText('Mountain Bike')
        const callsBeforeTyping = getItems.mock.calls.length

        await user.type(screen.getByLabelText(/search item name/i), 'bike')
        await user.click(screen.getByRole('button', { name: /^search$/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'bike', page: 0 }),
                expect.anything()
            )
        })

        // the whole word cost exactly one request
        expect(getItems.mock.calls.length - callsBeforeTyping).toBe(1)
    })

    test('searches when Enter is pressed in the search box', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByText('Mountain Bike')
        await user.type(screen.getByLabelText(/search item name/i), 'bike{Enter}')

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'bike' }),
                expect.anything()
            )
        })
    })

    test('trims the submitted term and clears it again', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByText('Mountain Bike')
        await user.type(screen.getByLabelText(/search item name/i), '  bike  {Enter}')

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'bike' }),
                expect.anything()
            )
        })

        await user.click(await screen.findByRole('button', { name: /remove search: bike/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: undefined }),
                expect.anything()
            )
        })
        expect(screen.getByLabelText(/search item name/i)).toHaveValue('')
    })

    test('does not query when a dropdown changes, only when submitted', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('option', { name: 'Electronics' })
        const callsBefore = getItems.mock.calls.length

        const [categorySelect, conditionSelect, sortSelect] = screen.getAllByRole('combobox')
        await user.selectOptions(categorySelect, '2')
        await user.selectOptions(conditionSelect, 'Like New')
        await user.selectOptions(sortSelect, 'title')

        expect(getItems.mock.calls.length).toBe(callsBefore)

        await user.click(screen.getByRole('button', { name: /^search$/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({
                    categoryId: '2',
                    condition: 'Like New',
                    sort: 'title,asc',
                    page: 0
                }),
                expect.anything()
            )
        })

        // three dropdowns plus the submit cost exactly one request
        expect(getItems.mock.calls.length - callsBefore).toBe(1)
    })

    test.skip('combines the search box and the dropdowns in one request', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('option', { name: 'Electronics' })
        const callsBefore = getItems.mock.calls.length

        const [categorySelect, conditionSelect] = screen.getAllByRole('combobox')
        await user.type(screen.getByLabelText(/search item name/i), 'bike')
        await user.selectOptions(categorySelect, '1')
        await user.selectOptions(conditionSelect, 'Good')
        await user.click(screen.getByRole('button', { name: /^search$/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'bike', categoryId: '1', condition: 'Good' }),
                expect.anything()
            )
        })

        expect(getItems.mock.calls.length - callsBefore).toBe(1)
    })

    test('shows a chip for every active filter, not just the search term', async () => {
        getItems.mockResolvedValue(page([]))

        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('option', { name: 'Electronics' })
        const [categorySelect, conditionSelect] = screen.getAllByRole('combobox')
        await user.type(screen.getByLabelText(/search item name/i), 'guitar')
        await user.selectOptions(categorySelect, '2')
        await user.selectOptions(conditionSelect, 'Good')
        await user.click(screen.getByRole('button', { name: /^search$/i }))

        // an empty result has to be explainable: all three narrowing filters are listed
        expect(await screen.findByText('Search: guitar')).toBeInTheDocument()
        expect(screen.getByText('Category: Electronics')).toBeInTheDocument()
        expect(screen.getByText('Condition: Good')).toBeInTheDocument()
        expect(screen.getByText(/0 items found/i)).toBeInTheDocument()
    })

    test('removing one chip drops only that filter', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('option', { name: 'Electronics' })
        const [categorySelect] = screen.getAllByRole('combobox')
        await user.type(screen.getByLabelText(/search item name/i), 'guitar')
        await user.selectOptions(categorySelect, '2')
        await user.click(screen.getByRole('button', { name: /^search$/i }))

        await screen.findByText('Category: Electronics')
        await user.click(screen.getByRole('button', { name: /remove category: electronics/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'guitar', categoryId: undefined }),
                expect.anything()
            )
        })
        expect(screen.getByText('Search: guitar')).toBeInTheDocument()
    })

    test('sends the distance filter with the stored coordinates', async () => {
        localStorage.setItem('token', 'test-token')
        localStorage.setItem('lat', '53.3498')
        localStorage.setItem('lng', '-6.2603')

        const user = userEvent.setup()
        renderPage()

        await screen.findByText('Mountain Bike')
        const selects = screen.getAllByRole('combobox')
        // category, condition, sort, distance, then the per page control
        await user.selectOptions(selects[3], '25')
        await user.click(screen.getByRole('button', { name: /^search$/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ radiusKm: 25, lat: 53.3498, lng: -6.2603 }),
                expect.anything()
            )
        })
    })

    test('Reset puts every filter back to its default in one request', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('option', { name: 'Electronics' })
        const [categorySelect] = screen.getAllByRole('combobox')
        await user.type(screen.getByLabelText(/search item name/i), 'bike')
        await user.selectOptions(categorySelect, '2')
        await user.click(screen.getByRole('button', { name: /^search$/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'bike', categoryId: '2' }),
                expect.anything()
            )
        })

        await user.click(screen.getByRole('button', { name: /reset all filters/i }))

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ search: undefined, categoryId: undefined, condition: undefined }),
                expect.anything()
            )
        })
        expect(screen.getByLabelText(/search item name/i)).toHaveValue('')
    })

    test('hides the distance filter when the account has no coordinates', async () => {
        renderPage()

        await screen.findByText('Mountain Bike')

        expect(screen.queryByText(/all ireland/i)).not.toBeInTheDocument()
    })

    test('shows an error when the request fails', async () => {
        getItems.mockRejectedValue(new Error('Request failed'))
        renderPage()

        expect(await screen.findByText(/could not load items/i)).toBeInTheDocument()
    })

    test('a category in the url filters the very first request', async () => {
        renderPage('/items?category=Books')

        await waitFor(() => {
            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({ categoryId: '1' }),
                expect.anything()
            )
        })

        // nothing went out unfiltered while the category list was still loading
        const unfiltered = getItems.mock.calls.filter(([params]) => !params.categoryId)
        expect(unfiltered).toHaveLength(0)

        expect(await screen.findByText('Category: Books')).toBeInTheDocument()
    })

    test('a category in the url preselects the dropdown', async () => {
        renderPage('/items?category=Electronics')

        await screen.findByRole('option', { name: 'Electronics' })

        const [categorySelect] = screen.getAllByRole('combobox')
        await waitFor(() => expect(categorySelect).toHaveValue('2'))
    })

    test('a category that does not exist behaves like no filter', async () => {
        renderPage('/items?category=Nonsense')

        await waitFor(() => expect(getItems).toHaveBeenCalled())

        const filtered = getItems.mock.calls.filter(([params]) => params.categoryId)
        expect(filtered).toHaveLength(0)

        expect(screen.queryByText(/^Category:/)).not.toBeInTheDocument()
    })

    test('ignores a request that was aborted by a newer one', async () => {
        const abortError = new Error('aborted')
        abortError.name = 'AbortError'
        getItems.mockRejectedValue(abortError)

        renderPage()

        await waitFor(() => {
            expect(getItems).toHaveBeenCalled()
        })

        expect(screen.queryByText(/could not load items/i)).not.toBeInTheDocument()
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
