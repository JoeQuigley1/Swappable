import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ItemCard from './ItemCard'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})


vi.mock('../lib/auth.js', async () => {
   const actual = await vi.importActual('../lib/auth.js')
   return { ...actual, isTokenValid: (token) => token === 'valid-token' }
})

const ITEM = {
    id: 5,
    title: 'Old guitar',
    description: 'Barely used acoustic guitar',
    category: 'Music',
    condition: 'Good',
    owner: 'anna',
    ownerId: 2,
    location: 'Galway',
    imageUrl: null
}

function renderCard(item = ITEM) {
    return render(
        <MemoryRouter>
            <ItemCard item={item} />
        </MemoryRouter>
    )
}

beforeEach(() => {
    mockNavigate.mockReset()
    localStorage.clear()
})

describe('ItemCard', () => {
    test('disables the swap button on the logged-in user own item', async () => {
        localStorage.setItem('token', 'valid-token')
        localStorage.setItem('userId', String(ITEM.ownerId))

        renderCard()

        expect(screen.getByRole('button', { name: /request swap/i })).toBeDisabled()
    })

    test('keeps the swap button enabled on someone else item', async () => {
        const user = userEvent.setup()
        localStorage.setItem('token', 'valid-token')
        localStorage.setItem('userId', '99')

        renderCard()

        const swapButton = screen.getByRole('button', { name: /request swap/i })
        expect(swapButton).toBeEnabled()

        await user.click(swapButton)

        expect(mockNavigate).toHaveBeenCalledWith('/items/5')
    })

    test('shows a login prompt and sends a logged-out visitor to login', async () => {
        const user = userEvent.setup()

        renderCard()

        await user.click(screen.getByRole('button', { name: /log in to swap/i }))

        expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
})
