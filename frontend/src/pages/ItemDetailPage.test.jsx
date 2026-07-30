import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ItemDetailPage from './ItemDetailPage'
import { createSwapRequest, getMyAvailableItems } from '../api/swapRequests'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

vi.mock('../api/swapRequests', () => ({
    createSwapRequest: vi.fn(),
    getMyAvailableItems: vi.fn()
}))

const ITEM = {
    id: 5,
    title: 'Old guitar',
    description: 'Barely used acoustic guitar',
    categoryName: 'Music',
    condition: 'Good',
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
        localStorage.setItem('token', 'test-token')
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
        localStorage.setItem('token', 'test-token')

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

    test('logged-out user is redirected to login and swap intent is saved', async () => {
        const user = userEvent.setup()

        renderPage()

        await screen.findByText('Old guitar')

        await user.click(
            screen.getByRole('button', { name: /request a swap/i })
        )

        expect(mockNavigate).toHaveBeenCalledWith('/login')
        expect(createSwapRequest).not.toHaveBeenCalled()

        const saved = JSON.parse(sessionStorage.getItem('swapIntent'))
        expect(saved.itemId).toBe('5')
        expect(saved.itemTitle).toBe('Old guitar')
    })

    test('owner cannot request a swap for their own item', async () => {
        localStorage.setItem('token', 'test-token')
        localStorage.setItem('userId', String(ITEM.ownerId))

        renderPage()

        await screen.findByText('Old guitar')

        expect(
            screen.getByRole('button', { name: /request a swap/i })
        ).toBeDisabled()

        expect(
            screen.getByText(/this is your own item/i)
        ).toBeInTheDocument()
    })

    test('shows an error returned by the swap request API', async () => {
        const user = userEvent.setup()
        localStorage.setItem('token', 'test-token')
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
