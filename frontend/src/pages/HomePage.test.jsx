import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

const CATEGORIES = [
    { id: 1, name: 'Books', itemCount: 2 },
    { id: 2, name: 'Home & Garden', itemCount: 5 }
]

function renderPage() {
    return render(
        <MemoryRouter>
            <HomePage />
        </MemoryRouter>
    )
}

beforeEach(() => {
    mockNavigate.mockReset()

    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        const body = String(url).includes('/categories')
            ? CATEGORIES
            : { content: [], totalElements: 0 }

        return Promise.resolve({ ok: true, status: 200, json: async () => body })
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('HomePage', () => {
    test('clicking a category card opens the browse page filtered by it', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.click(await screen.findByRole('button', { name: /browse books items/i }))

        expect(mockNavigate).toHaveBeenCalledWith('/items?category=Books')
    })

    test('encodes category names that are not url safe', async () => {
        const user = userEvent.setup()

        renderPage()

        await user.click(await screen.findByRole('button', { name: /browse home & garden items/i }))

        expect(mockNavigate).toHaveBeenCalledWith('/items?category=Home%20%26%20Garden')
    })
})
