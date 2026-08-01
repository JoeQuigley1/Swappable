import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ItemDetailPage from './ItemDetailPage'
import { createSwapRequest, getMyAvailableItems } from '../api/swapRequests'

const mockNavigate = vi.fn()

vi.mock('../lib/auth.js', async () => {
     const actual = await vi.importActual('../lib/auth.js')
     return { ...actual, isTokenValid: (token) => token === 'valid-token' }
 })

vi.mock('../api/swapRequests', () => ({
    createSwapRequest: vi.fn(),
    getMyAvailableItems: vi.fn()
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

const ITEM = {
    id: 5,
    title: 'Old guitar',
    description: 'Barely used acoustic guitar',
    categoryName: 'Music',
    condition: 'Good',
    status: 'available',
    createdAt: '2026-07-31T10:00:00Z',
    ownerId: 2,
    ownerUsername: 'anna',
    ownerLocation: 'Galway',
    imageUrl: null
}

const MY_ITEMS = [{ id: 30, title: 'My spare bike' }]

function renderPage(id = '5') {
    return render(
        <MemoryRouter initialEntries={[`/items/${id}`]}>
            <Routes>
                <Route path="/items/:id" element={<ItemDetailPage />} />
            </Routes>
        </MemoryRouter>
    )
}

beforeEach(() => {
    mockNavigate.mockReset()
    createSwapRequest.mockReset()
    getMyAvailableItems.mockReset()
    getMyAvailableItems.mockResolvedValue(MY_ITEMS)
    localStorage.clear()
    sessionStorage.clear()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ITEM
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ItemDetailPage', () => {
    test('shows a loading spinner then the item details', async () => {
        renderPage()

        expect(screen.getByText(/loading item/i)).toBeInTheDocument()

        expect(await screen.findByText('Old guitar')).toBeInTheDocument()
        expect(screen.getByText('Barely used acoustic guitar')).toBeInTheDocument()
        expect(screen.getByText('anna', { exact: false })).toBeInTheDocument()
    })

    test('shows a not found message for a missing item', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({})
        })

        renderPage()

        expect(await screen.findByText('Item not found.')).toBeInTheDocument()
    })

    test('logged-in user can send a swap request', async () => {
        const user = userEvent.setup()
        localStorage.setItem('token', 'valid-token')
        createSwapRequest.mockResolvedValue({ id: 1 })

        renderPage()

        await screen.findByText('Old guitar')

        await waitFor(() => {
            expect(getMyAvailableItems).toHaveBeenCalled()
        })

        await user.selectOptions(
            await screen.findByRole('combobox'),
            '30'
        )

        await user.click(
            screen.getByRole('button', { name: /request a swap/i })
        )

        await waitFor(() => {
            expect(createSwapRequest).toHaveBeenCalledWith(5, 30, '')
        })

        expect(
            await screen.findByText(/swap request sent/i)
        ).toBeInTheDocument()
    })

    test('shows a validation message if no item is offered', async () => {
        const user = userEvent.setup()
        localStorage.setItem('token', 'valid-token')

        renderPage()

        await screen.findByText('Old guitar')
        await waitFor(() => expect(getMyAvailableItems).toHaveBeenCalled())

        await user.click(
            screen.getByRole('button', { name: /request a swap/i })
        )

        expect(
            await screen.findByText(/choose one of your items to offer/i)
        ).toBeInTheDocument()

        expect(createSwapRequest).not.toHaveBeenCalled()
    })

    test('logged-out visitor sees a login prompt instead of the offer form', async () => {
       renderPage()
       await screen.findByText('Old guitar')
       expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
       expect(screen.queryByRole('button', { name: /request a swap/i })).not.toBeInTheDocument()
       expect(createSwapRequest).not.toHaveBeenCalled()
    })

    test('owner sees listing details instead of the swap form', async () => {
        localStorage.setItem('token', 'valid-token')
        localStorage.setItem('userId', String(ITEM.ownerId))

        renderPage()

        await screen.findByText('Old guitar')

        expect(
            screen.getByRole('heading', { name: /your listing/i })
        ).toBeInTheDocument()

        expect(
            screen.getByText(/status:/i)
        ).toBeInTheDocument()

        const statusBadge = screen.getByText(/^available$/i)

        expect(statusBadge).toBeInTheDocument()
        expect(statusBadge).toHaveClass('badge')

        expect(
            screen.getByText(/photos:/i)
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: /edit item/i })
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', { name: /request a swap/i })
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('combobox')
        ).not.toBeInTheDocument()
    })

    test('owner can navigate to the edit page from item details', async () => {
        const user = userEvent.setup()

        localStorage.setItem('token', 'valid-token')
        localStorage.setItem('userId', String(ITEM.ownerId))

        renderPage()

        await screen.findByText('Old guitar')

        await user.click(
            screen.getByRole('button', { name: /edit item/i })
        )

        expect(mockNavigate).toHaveBeenCalledWith('/items/edit/5')
    })

    test('shows an error returned by the swap request API', async () => {
        const user = userEvent.setup()
        localStorage.setItem('token', 'valid-token')
        createSwapRequest.mockRejectedValue(new Error('item not available'))

        renderPage()

        await screen.findByText('Old guitar')
        await waitFor(() => expect(getMyAvailableItems).toHaveBeenCalled())

        await user.selectOptions(
            await screen.findByRole('combobox'),
            '30'
        )
        await user.click(
            screen.getByRole('button', { name: /request a swap/i })
        )

        expect(
            await screen.findByText('item not available')
        ).toBeInTheDocument()
    })
})
