import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyItemsPage from './MyItemsPage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('../api/config.js', () => ({
    API_BASE_URL: '/api',
    resolveImageUrl: (url) => `resolved:${url}`,
}))

const testItems = [
    {
        id: 1,
        title: 'Gaming Laptop',
        description: 'An older gaming laptop',
        categoryName: 'Electronics',
        condition: 'GOOD',
        imageUrl: '/images/1',
    },
    {
        id: 2,
        title: 'Java Book',
        description: 'A Java programming book',
        categoryName: 'Books',
        condition: 'LIKE_NEW',
        imageUrl: null,
    },
]

function successfulPageResponse({
                                    content = testItems,
                                    totalPages = 1,
                                } = {}) {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            content,
            totalPages,
        }),
    }
}

function renderPage() {
    return render(
        <MemoryRouter>
            <MyItemsPage />
        </MemoryRouter>
    )
}

describe('MyItemsPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset()
        localStorage.clear()
        localStorage.setItem('token', 'test-token')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('displays a loading message while items are being fetched', () => {
        vi.spyOn(globalThis, 'fetch').mockReturnValue(
            new Promise(() => {})
        )

        renderPage()

        expect(
            screen.getByText('Loading your items...')
        ).toBeInTheDocument()
    })

    test('fetches and displays the logged-in user items', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        expect(
            await screen.findByText('Gaming Laptop')
        ).toBeInTheDocument()

        expect(screen.getByText('Java Book')).toBeInTheDocument()
        expect(screen.getByText('Electronics')).toBeInTheDocument()
        expect(screen.getByText('Books')).toBeInTheDocument()

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/items/my-items?page=0&size=18',
            {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer test-token',
                },
            }
        )
    })

    test('displays the item image using the resolved image URL', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        const image = await screen.findByRole('img', {
            name: 'Gaming Laptop',
        })

        expect(image).toHaveAttribute(
            'src',
            'resolved:/images/1'
        )
    })

    test('displays a placeholder when an item has no image', async () => {
        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        expect(
            await screen.findByText('No photo')
        ).toBeInTheDocument()
    })

    test('displays an empty state when the user has no items', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            successfulPageResponse({
                content: [],
                totalPages: 0,
            })
        )

        renderPage()

        expect(
            await screen.findByText(
                "You haven't listed any items yet."
            )
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'List your first item',
            })
        ).toBeInTheDocument()
    })

    test('displays a login error for an unauthorised request', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 401,
        })

        renderPage()

        expect(
            await screen.findByText(
                'Please login to view your items'
            )
        ).toBeInTheDocument()
    })

    test('displays a general error when loading items fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 500,
        })

        renderPage()

        expect(
            await screen.findByText('Failed to load your items')
        ).toBeInTheDocument()
    })

    test('displays the thrown error when the request cannot be completed', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(
            new Error('Network unavailable')
        )

        renderPage()

        expect(
            await screen.findByText('Network unavailable')
        ).toBeInTheDocument()
    })

    test('navigates to the create-item page', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        await screen.findByText('Gaming Laptop')

        await user.click(
            screen.getByRole('button', {
                name: '+ List new item',
            })
        )

        expect(mockNavigate).toHaveBeenCalledWith(
            '/items/create'
        )
    })

    test('navigates to the edit page for the selected item', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        const editButtons = await screen.findAllByRole('button', {
            name: 'Edit',
        })

        await user.click(editButtons[0])

        expect(mockNavigate).toHaveBeenCalledWith(
            '/items/edit/1'
        )
    })

    test('asks for confirmation before deleting an item', async () => {
        const user = userEvent.setup()
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        const deleteButtons = await screen.findAllByRole(
            'button',
            { name: 'Delete' }
        )

        await user.click(deleteButtons[0])

        expect(
            screen.getByText(
                'Are you sure you want to delete this item?'
            )
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: 'Yes, delete' })
        ).toBeInTheDocument()

        // Only the initial GET request has happened.
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    test('cancels deletion without sending a delete request', async () => {
        const user = userEvent.setup()
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(successfulPageResponse())

        renderPage()

        const deleteButtons = await screen.findAllByRole(
            'button',
            { name: 'Delete' }
        )

        await user.click(deleteButtons[0])
        await user.click(
            screen.getByRole('button', { name: 'Cancel' })
        )

        expect(
            screen.queryByText(
                'Are you sure you want to delete this item?'
            )
        ).not.toBeInTheDocument()

        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument()
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    test('deletes the item after confirmation', async () => {
        const user = userEvent.setup()
        const fetchSpy = vi.spyOn(globalThis, 'fetch')

        fetchSpy
            .mockResolvedValueOnce(successfulPageResponse())
            .mockResolvedValueOnce({
                ok: true,
                status: 204,
            })

        renderPage()

        const deleteButtons = await screen.findAllByRole(
            'button',
            { name: 'Delete' }
        )

        await user.click(deleteButtons[0])
        await user.click(
            screen.getByRole('button', { name: 'Yes, delete' })
        )

        await waitFor(() => {
            expect(
                screen.queryByText('Gaming Laptop')
            ).not.toBeInTheDocument()
        })

        expect(screen.getByText('Java Book')).toBeInTheDocument()

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/items/1',
            {
                method: 'DELETE',
                headers: {
                    Authorization: 'Bearer test-token',
                },
            }
        )
    })

    test('displays an ownership error when deletion is forbidden', async () => {
        const user = userEvent.setup()
        const fetchSpy = vi.spyOn(globalThis, 'fetch')

        fetchSpy
            .mockResolvedValueOnce(successfulPageResponse())
            .mockResolvedValueOnce({
                ok: false,
                status: 403,
            })

        renderPage()

        const deleteButtons = await screen.findAllByRole(
            'button',
            { name: 'Delete' }
        )

        await user.click(deleteButtons[0])
        await user.click(
            screen.getByRole('button', { name: 'Yes, delete' })
        )

        expect(
            await screen.findByText(
                'You can only delete your own items.'
            )
        ).toBeInTheDocument()

        // The item remains because deletion failed.
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument()
    })

    test('displays a general error when deletion fails', async () => {
        const user = userEvent.setup()
        const fetchSpy = vi.spyOn(globalThis, 'fetch')

        fetchSpy
            .mockResolvedValueOnce(successfulPageResponse())
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
            })

        renderPage()

        const deleteButtons = await screen.findAllByRole(
            'button',
            { name: 'Delete' }
        )

        await user.click(deleteButtons[0])
        await user.click(
            screen.getByRole('button', { name: 'Yes, delete' })
        )

        expect(
            await screen.findByText('Failed to delete item.')
        ).toBeInTheDocument()

        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument()
    })

    test('requests the next page when Next is clicked', async () => {
        const user = userEvent.setup()
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(
                successfulPageResponse({ totalPages: 3 })
            )

        renderPage()

        expect(
            await screen.findByText('Page 1 of 3')
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: 'Previous' })
        ).toBeDisabled()

        await user.click(
            screen.getByRole('button', { name: 'Next' })
        )

        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                '/api/items/my-items?page=1&size=18',
                expect.objectContaining({
                    method: 'GET',
                })
            )
        })

        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })

    test('disables Next on the final page', async () => {
        const user = userEvent.setup()

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            successfulPageResponse({ totalPages: 2 })
        )

        renderPage()

        await screen.findByText('Page 1 of 2')

        await user.click(
            screen.getByRole('button', { name: 'Next' })
        )

        await waitFor(() => {
            expect(
                screen.getByText('Page 2 of 2')
            ).toBeInTheDocument()
        })

        expect(
            screen.getByRole('button', { name: 'Next' })
        ).toBeDisabled()

        expect(
            screen.getByRole('button', { name: 'Previous' })
        ).toBeEnabled()
    })
})