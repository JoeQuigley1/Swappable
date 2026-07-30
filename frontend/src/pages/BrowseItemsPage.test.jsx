import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BrowseItemsPage from './BrowseItemsPage'
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

function renderPage() {
    render(
        <MemoryRouter>
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

        await user.type(screen.getByPlaceholderText(/search items/i), 'acoustic')

        // eight keystrokes, zero requests
        expect(getItems.mock.calls.length).toBe(callsBeforeTyping)
        expect(screen.getByText(/press enter or click search/i)).toBeInTheDocument()
    })

    test('searches when the Search button is clicked', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByText('Mountain Bike')
        const callsBeforeTyping = getItems.mock.calls.length

        await user.type(screen.getByPlaceholderText(/search items/i), 'bike')
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
        await user.type(screen.getByPlaceholderText(/search items/i), 'bike{Enter}')

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
        await user.type(screen.getByPlaceholderText(/search items/i), '  bike  {Enter}')

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
        expect(screen.getByPlaceholderText(/search items/i)).toHaveValue('')
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

    test('combines the search box and the dropdowns in one request', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByRole('option', { name: 'Electronics' })
        const callsBefore = getItems.mock.calls.length

        const [categorySelect, conditionSelect] = screen.getAllByRole('combobox')
        await user.type(screen.getByPlaceholderText(/search items/i), 'bike')
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
        await user.type(screen.getByPlaceholderText(/search items/i), 'guitar')
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
        await user.type(screen.getByPlaceholderText(/search items/i), 'guitar')
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
        await user.type(screen.getByPlaceholderText(/search items/i), 'bike')
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
        expect(screen.getByPlaceholderText(/search items/i)).toHaveValue('')
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
