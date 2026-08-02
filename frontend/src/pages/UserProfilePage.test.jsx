import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import UserProfilePage from './UserProfilePage'
import { getPublicProfile } from '../api/users.js'
import { toCardItem } from '../api/items.js'
import { isTokenValid } from '../lib/auth.js'

vi.mock('../api/users.js', () => ({
    getPublicProfile: vi.fn()
}))

vi.mock('../api/items.js', () => ({
    toCardItem: vi.fn((item) => ({
        ...item,
        mapped: true
    }))
}))

vi.mock('../lib/auth.js', () => ({
    isTokenValid: vi.fn()
}))

vi.mock('../components/ItemGrid.jsx', () => ({
    default: ({ items }) => (
        <div data-testid="item-grid">
            {items.map((item) => (
                <div key={item.id}>{item.title}</div>
            ))}
        </div>
    )
}))

vi.mock('../components/ItemList.jsx', () => ({
    default: ({ items }) => (
        <div data-testid="item-list">
            {items.map((item) => (
                <div key={item.id}>{item.title}</div>
            ))}
        </div>
    )
}))

const PROFILE_RESPONSE = {
    username: 'Joe User',
    location: 'Galway',
    items: {
        content: [
            {
                id: 1,
                title: 'Old guitar'
            },
            {
                id: 2,
                title: 'Book collection'
            }
        ],
        totalPages: 2,
        totalElements: 7
    }
}

const renderPage = (initialEntry = '/users/12') => {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="/users/:id"
                    element={<UserProfilePage />}
                />

                <Route
                    path="/profile"
                    element={<div>My Profile Page</div>}
                />

                <Route
                    path="/login"
                    element={<div>Login Page</div>}
                />

                <Route
                    path="/"
                    element={<div>Home Page</div>}
                />
            </Routes>
        </MemoryRouter>
    )
}

describe('UserProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()

        getPublicProfile.mockResolvedValue(PROFILE_RESPONSE)
        isTokenValid.mockReturnValue(false)
    })

    test('shows a loading spinner while the profile is loading', () => {
        getPublicProfile.mockReturnValue(new Promise(() => {}))

        renderPage()

        expect(
            screen.getByRole('status')
        ).toBeInTheDocument()

        expect(
            screen.getByText(/loading/i)
        ).toBeInTheDocument()
    })

    test('loads and displays a public member profile', async () => {
        renderPage()

        expect(
            await screen.findByRole('heading', {
                name: /joe user/i
            })
        ).toBeInTheDocument()

        expect(
            screen.getByText('Galway')
        ).toBeInTheDocument()

        expect(
            getPublicProfile
        ).toHaveBeenCalledWith('12', 0)
    })

    test('shows the total number of listings', async () => {
        renderPage()

        await screen.findByRole('heading', {
            name: /joe user/i
        })

        expect(
            screen.getByText('(7)')
        ).toBeInTheDocument()
    })

    test('maps profile items before passing them to the item grid', async () => {
        renderPage()

        expect(
            await screen.findByTestId('item-grid')
        ).toBeInTheDocument()

        expect(toCardItem).toHaveBeenCalledTimes(2)

        expect(toCardItem).toHaveBeenNthCalledWith(
            1,
            {
                id: 1,
                title: 'Old guitar'
            },
            0,
            PROFILE_RESPONSE.items.content
        )

        expect(toCardItem).toHaveBeenNthCalledWith(
            2,
            {
                id: 2,
                title: 'Book collection'
            },
            1,
            PROFILE_RESPONSE.items.content
        )

        expect(
            screen.getByText('Old guitar')
        ).toBeInTheDocument()

        expect(
            screen.getByText('Book collection')
        ).toBeInTheDocument()
    })

    test('uses card view by default', async () => {
        renderPage()

        expect(
            await screen.findByTestId('item-grid')
        ).toBeInTheDocument()

        expect(
            screen.queryByTestId('item-list')
        ).not.toBeInTheDocument()
    })

    test('switches from card view to list view', async () => {
        const user = userEvent.setup()

        renderPage()

        await screen.findByTestId('item-grid')

        const viewButtons = screen.getAllByRole('button')
        const listButton = viewButtons.find(
            (button) => button.getAttribute('aria-pressed') === 'false'
        )

        await user.click(listButton)

        expect(
            screen.getByTestId('item-list')
        ).toBeInTheDocument()

        expect(
            screen.queryByTestId('item-grid')
        ).not.toBeInTheDocument()
    })

    test('shows an error when the profile cannot be loaded', async () => {
        getPublicProfile.mockRejectedValue(
            new Error('request failed')
        )

        renderPage()

        expect(
            await screen.findByText(
                /could not load this member/i
            )
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('status')
        ).not.toBeInTheDocument()
    })

    test('does not show a location when none is provided', async () => {
        getPublicProfile.mockResolvedValue({
            ...PROFILE_RESPONSE,
            location: ''
        })

        renderPage()

        await screen.findByRole('heading', {
            name: /joe user/i
        })

        expect(
            screen.queryByText('Galway')
        ).not.toBeInTheDocument()
    })

    test('uses the item count when totalElements is missing', async () => {
        getPublicProfile.mockResolvedValue({
            ...PROFILE_RESPONSE,
            items: {
                content: PROFILE_RESPONSE.items.content,
                totalPages: 1
            }
        })

        renderPage()

        await screen.findByRole('heading', {
            name: /joe user/i
        })

        expect(
            screen.getByText('(2)')
        ).toBeInTheDocument()
    })

    test('handles a profile with no listed items', async () => {
        getPublicProfile.mockResolvedValue({
            username: 'Empty User',
            location: 'Dublin',
            items: {
                content: [],
                totalPages: 0,
                totalElements: 0
            }
        })

        renderPage()

        expect(
            await screen.findByRole('heading', {
                name: /empty user/i
            })
        ).toBeInTheDocument()

        expect(
            screen.getByText('(0)')
        ).toBeInTheDocument()

        expect(
            screen.getByTestId('item-grid')
        ).toBeEmptyDOMElement()
    })

    test('shows pagination controls when there is more than one page', async () => {
        renderPage()

        expect(
            await screen.findByText(/page 1 of 2/i)
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: /previous/i
            })
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: /next/i
            })
        ).toBeEnabled()
    })

    test('loads the next page when Next is clicked', async () => {
        const user = userEvent.setup()

        getPublicProfile
            .mockResolvedValueOnce(PROFILE_RESPONSE)
            .mockResolvedValueOnce({
                ...PROFILE_RESPONSE,
                items: {
                    content: [
                        {
                            id: 3,
                            title: 'Second-page item'
                        }
                    ],
                    totalPages: 2,
                    totalElements: 7
                }
            })

        renderPage()

        await user.click(
            await screen.findByRole('button', {
                name: /next/i
            })
        )

        await waitFor(() => {
            expect(getPublicProfile).toHaveBeenLastCalledWith(
                '12',
                1
            )
        })

        expect(
            await screen.findByText(/page 2 of 2/i)
        ).toBeInTheDocument()

        expect(
            screen.getByText('Second-page item')
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: /next/i
            })
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: /previous/i
            })
        ).toBeEnabled()
    })

    test('loads the previous page when Previous is clicked', async () => {
        const user = userEvent.setup()

        getPublicProfile
            .mockResolvedValueOnce(PROFILE_RESPONSE)
            .mockResolvedValueOnce({
                ...PROFILE_RESPONSE,
                items: {
                    content: [
                        {
                            id: 3,
                            title: 'Second-page item'
                        }
                    ],
                    totalPages: 2,
                    totalElements: 7
                }
            })
            .mockResolvedValueOnce(PROFILE_RESPONSE)

        renderPage()

        await user.click(
            await screen.findByRole('button', {
                name: /next/i
            })
        )

        await screen.findByText(/page 2 of 2/i)

        await user.click(
            screen.getByRole('button', {
                name: /previous/i
            })
        )

        await waitFor(() => {
            expect(getPublicProfile).toHaveBeenLastCalledWith(
                '12',
                0
            )
        })

        expect(
            await screen.findByText(/page 1 of 2/i)
        ).toBeInTheDocument()
    })

    test('does not show pagination controls for a single page', async () => {
        getPublicProfile.mockResolvedValue({
            ...PROFILE_RESPONSE,
            items: {
                ...PROFILE_RESPONSE.items,
                totalPages: 1
            }
        })

        renderPage()

        await screen.findByRole('heading', {
            name: /joe user/i
        })

        expect(
            screen.queryByRole('button', {
                name: /previous/i
            })
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: /next/i
            })
        ).not.toBeInTheDocument()
    })

    test('redirects users/me to the profile page when logged in', async () => {
        localStorage.setItem('token', 'valid-token')
        isTokenValid.mockReturnValue(true)

        renderPage('/users/me')

        expect(
            await screen.findByText('My Profile Page')
        ).toBeInTheDocument()

        expect(isTokenValid).toHaveBeenCalledWith(
            'valid-token'
        )

        expect(getPublicProfile).not.toHaveBeenCalled()
    })

    test('redirects users/me to login when logged out', async () => {
        isTokenValid.mockReturnValue(false)

        renderPage('/users/me')

        expect(
            await screen.findByText('Login Page')
        ).toBeInTheDocument()

        expect(isTokenValid).toHaveBeenCalledWith(null)

        expect(getPublicProfile).not.toHaveBeenCalled()
    })

    test('redirects a non-numeric public profile id to home', async () => {
        renderPage('/users/not-a-number')

        expect(
            await screen.findByText('Home Page')
        ).toBeInTheDocument()

        expect(getPublicProfile).not.toHaveBeenCalled()
    })
})