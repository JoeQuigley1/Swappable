import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EditItemPage from './EditItemPage'
import { addItemImages, deleteItemImage } from '../api/items'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

vi.mock('../api/items', () => ({
    addItemImages: vi.fn(),
    deleteItemImage: vi.fn()
}))

const CATEGORIES = [
    { id: 1, name: 'Books' },
    { id: 2, name: 'Electronics' }
]

const ITEM = {
    title: 'Old guitar',
    description: 'Barely used acoustic guitar',
    categoryId: 1,
    condition: 'Good',
    imageUrls: ['/images/10', '/images/11']
}

function renderPage(id = '5') {
    return render(
        <MemoryRouter initialEntries={[`/items/edit/${id}`]}>
            <Routes>
                <Route path="/items/edit/:id" element={<EditItemPage />} />
            </Routes>
        </MemoryRouter>
    )
}

beforeEach(() => {
    mockNavigate.mockReset()
    addItemImages.mockReset()
    deleteItemImage.mockReset()
    localStorage.setItem('token', 'test-token')

    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        if (url.includes('/categories')) {
            return Promise.resolve({ ok: true, json: async () => CATEGORIES })
        }
        if (url.includes('/items/5')) {
            return Promise.resolve({ ok: true, json: async () => ITEM })
        }
        return Promise.resolve({ ok: false, json: async () => ({}) })
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('EditItemPage', () => {
    test('shows a loading spinner then pre-fills the form with the item', async () => {
        renderPage()

        expect(screen.getByText(/loading item/i)).toBeInTheDocument()

        expect(
            await screen.findByDisplayValue('Old guitar')
        ).toBeInTheDocument()

        expect(
            screen.getByDisplayValue('Barely used acoustic guitar')
        ).toBeInTheDocument()

        expect(screen.getByText('2 / 3 photos')).toBeInTheDocument()
    })

    test('shows an error if the item fails to load', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
            if (url.includes('/categories')) {
                return Promise.resolve({ ok: true, json: async () => CATEGORIES })
            }
            return Promise.resolve({ ok: false, json: async () => ({}) })
        })

        renderPage()

        expect(
            await screen.findByText('Failed to load item.')
        ).toBeInTheDocument()
    })

    test('saves changes and navigates to my items on success', async () => {
        const user = userEvent.setup()

        renderPage()

        const titleInput = await screen.findByDisplayValue('Old guitar')

        await user.clear(titleInput)
        await user.type(titleInput, 'Nice guitar')

        await user.click(
            screen.getByRole('button', { name: /save changes/i })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/my-items')
        })

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/items/5'),
            expect.objectContaining({
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token'
                },
                body: JSON.stringify({
                    title: 'Nice guitar',
                    description: 'Barely used acoustic guitar',
                    categoryId: 1,
                    condition: 'Good'
                })
            })
        )
    })

    test('shows an error if saving fails', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
            if (url.includes('/categories')) {
                return Promise.resolve({ ok: true, json: async () => CATEGORIES })
            }
            if (options?.method === 'PUT') {
                return Promise.resolve({ ok: false, json: async () => ({}) })
            }
            return Promise.resolve({ ok: true, json: async () => ITEM })
        })

        renderPage()

        await screen.findByDisplayValue('Old guitar')

        await user.click(
            screen.getByRole('button', { name: /save changes/i })
        )

        expect(
            await screen.findByText('Failed to update item.')
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('shows an image validation message when an uploaded image is too large', async () => {
        const user = userEvent.setup()

        addItemImages.mockRejectedValue(
            Object.assign(new Error('Payload Too Large'), {
                status: 413
            })
        )

        renderPage()

        await screen.findByDisplayValue('Old guitar')

        const file = new File(['image'], 'photo.jpg', {
            type: 'image/jpeg'
        })

        const input = document.querySelector('input[type="file"]')

        expect(input).not.toBeNull()

        await user.upload(input, file)

        await user.click(
            screen.getByRole('button', { name: /save changes/i })
        )

        expect(
            await screen.findByText(
                'This photo is too large or high-resolution. Please choose a smaller or resized image.'
            )
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('marks an existing photo for deletion and deletes it on save', async () => {
        const user = userEvent.setup()
        deleteItemImage.mockResolvedValue(null)

        renderPage()

        await screen.findByText('2 / 3 photos')

        await user.click(
            screen.getAllByRole('button', { name: /remove photo/i })[0]
        )

        // The image disappears locally, but is not deleted before Save.
        expect(screen.getByText('1 / 3 photos')).toBeInTheDocument()
        expect(deleteItemImage).not.toHaveBeenCalled()

        await user.click(
            screen.getByRole('button', { name: /save changes/i })
        )

        await waitFor(() => {
            expect(deleteItemImage).toHaveBeenCalledWith('5', 10)
        })

        expect(mockNavigate).toHaveBeenCalledWith('/my-items')
    })

    test('cancel button navigates back to my items without saving', async () => {
        const user = userEvent.setup()

        renderPage()

        await screen.findByDisplayValue('Old guitar')

        await user.click(
            screen.getByRole('button', { name: /^cancel$/i })
        )

        expect(mockNavigate).toHaveBeenCalledWith('/my-items')
    })
})
