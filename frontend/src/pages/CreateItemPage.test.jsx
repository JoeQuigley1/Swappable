import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CreateItemPage from './CreateItemPage'
import { createItem } from '../api/items'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

vi.mock('../api/items', () => ({
    createItem: vi.fn()
}))

const CATEGORIES = [
    { id: 1, name: 'Books' },
    { id: 2, name: 'Electronics' }
]

beforeEach(() => {
    mockNavigate.mockReset()
    createItem.mockReset()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => CATEGORIES
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('CreateItemPage', () => {
    test('displays the create item form with categories loaded', async () => {
        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        expect(
            screen.getByRole('heading', { name: /list an item/i })
        ).toBeInTheDocument()

        expect(
            await screen.findByRole('option', { name: 'Books' })
        ).toBeInTheDocument()

        expect(
            screen.getByRole('option', { name: 'Electronics' })
        ).toBeInTheDocument()

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/categories')
        )
    })

    test('allows the user to fill in the item details', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        await screen.findByRole('option', { name: 'Books' })

        const titleInput = screen.getByPlaceholderText(/title/i)
        const descriptionInput = screen.getByPlaceholderText(/describe your item/i)

        // category/condition <label> elements aren't wired to their <select>
        // with htmlFor, so they can't be queried by accessible name - fall
        // back to DOM order (category select comes first, condition second)
        const [categorySelect, conditionSelect] = screen.getAllByRole('combobox')

        await user.type(titleInput, 'Old guitar')
        await user.type(descriptionInput, 'Barely used acoustic guitar')
        await user.selectOptions(categorySelect, '1')
        await user.selectOptions(conditionSelect, 'Good')

        expect(titleInput).toHaveValue('Old guitar')
        expect(descriptionInput).toHaveValue('Barely used acoustic guitar')
        expect(conditionSelect).toHaveValue('Good')
    })

    test('submits the form and navigates to my items on success', async () => {
        const user = userEvent.setup()
        createItem.mockResolvedValue({ id: 99 })

        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        await screen.findByRole('option', { name: 'Books' })

        await user.type(
            screen.getByPlaceholderText(/title/i),
            'Old guitar'
        )
        await user.type(
            screen.getByPlaceholderText(/describe your item/i),
            'Barely used acoustic guitar'
        )
        const [categorySelect, conditionSelect] = screen.getAllByRole('combobox')
        await user.selectOptions(categorySelect, '1')
        await user.selectOptions(conditionSelect, 'Good')

        await user.click(
            screen.getByRole('button', { name: /list item/i })
        )

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/my-items')
        })

        expect(createItem).toHaveBeenCalledWith({
            categoryId: 1,
            title: 'Old guitar',
            description: 'Barely used acoustic guitar',
            condition: 'Good',
            images: []
        })
    })

    test('shows an error message when creating the item fails', async () => {
        const user = userEvent.setup()
        createItem.mockRejectedValue({})

        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        await screen.findByRole('option', { name: 'Books' })

        await user.type(
            screen.getByPlaceholderText(/title/i),
            'Old guitar'
        )
        await user.type(
            screen.getByPlaceholderText(/describe your item/i),
            'Barely used acoustic guitar'
        )
        const [categorySelect, conditionSelect] = screen.getAllByRole('combobox')
        await user.selectOptions(categorySelect, '1')
        await user.selectOptions(conditionSelect, 'Good')

        await user.click(
            screen.getByRole('button', { name: /list item/i })
        )

        expect(
            await screen.findByText(
                'Failed to create item. Please try again.'
            )
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('shows an image validation message when the uploaded image is too large', async () => {
        const user = userEvent.setup()

        const error = new Error('Payload Too Large')
        error.status = 413
        createItem.mockRejectedValue(error)

        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        await screen.findByRole('option', { name: 'Books' })

        await user.type(
            screen.getByPlaceholderText(/title/i),
            'Old guitar'
        )

        await user.type(
            screen.getByPlaceholderText(/describe your item/i),
            'Barely used acoustic guitar'
        )

        const [categorySelect, conditionSelect] =
            screen.getAllByRole('combobox')

        await user.selectOptions(categorySelect, '1')
        await user.selectOptions(conditionSelect, 'Good')

        await user.click(
            screen.getByRole('button', { name: /list item/i })
        )

        expect(
            await screen.findByText(
                'This photo is too large or high-resolution. Please choose a smaller or resized image.'
            )
        ).toBeInTheDocument()

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('cancel button navigates back to my items without submitting', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        await screen.findByRole('option', { name: 'Books' })

        await user.click(
            screen.getByRole('button', { name: /cancel/i })
        )

        expect(mockNavigate).toHaveBeenCalledWith('/my-items')
        expect(createItem).not.toHaveBeenCalled()
    })

    test('caps image selection at 3 files and shows a warning', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <CreateItemPage />
            </MemoryRouter>
        )

        await screen.findByRole('option', { name: 'Books' })

        const files = ['a.png', 'b.png', 'c.png', 'd.png'].map(
            (name) => new File(['content'], name, { type: 'image/png' })
        )

        const fileInput = document.querySelector('input[type="file"]')
        await user.upload(fileInput, files)

        expect(
            await screen.findByText(/you can select up to 3 photos/i)
        ).toBeInTheDocument()

        expect(screen.getAllByAltText(/^Preview/)).toHaveLength(3)
    })
})
