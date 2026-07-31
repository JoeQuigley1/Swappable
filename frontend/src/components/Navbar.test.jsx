import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation
} from 'react-router-dom'
import { clearSession } from '../lib/auth'
import Navbar from './Navbar'

vi.mock('../lib/auth', () => ({
    isTokenValid: vi.fn((token) => token === 'valid-token'),
    clearSession: vi.fn(() => {
        localStorage.removeItem('token')
    })
}))

function CurrentLocation() {
    const location = useLocation()

    return (
        <div data-testid="current-location">
            {location.pathname}
        </div>
    )
}

function renderNavbar(initialPath = '/') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Navbar />

            <Routes>
                <Route path="*" element={<CurrentLocation />} />
            </Routes>
        </MemoryRouter>
    )
}

function expectCurrentLocation(expectedPath) {
    expect(screen.getByTestId('current-location'))
        .toHaveTextContent(expectedPath)
}

beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
})

describe('Navbar', () => {
    describe('mobile navigation menu', () => {
        test('opens and closes when the toggle is clicked', async () => {
            const user = userEvent.setup()

            renderNavbar()

            const toggle = screen.getByRole('button', {
                name: /toggle navigation/i
            })

            const menu = document.getElementById('mainNav')

            expect(menu).not.toHaveClass('show')
            expect(toggle).toHaveAttribute(
                'aria-expanded',
                'false'
            )

            await user.click(toggle)

            expect(menu).toHaveClass('show')
            expect(toggle).toHaveAttribute(
                'aria-expanded',
                'true'
            )

            await user.click(toggle)

            expect(menu).not.toHaveClass('show')
            expect(toggle).toHaveAttribute(
                'aria-expanded',
                'false'
            )
        })

        test('closes after navigating to another page', async () => {
            const user = userEvent.setup()

            renderNavbar()

            const toggle = screen.getByRole('button', {
                name: /toggle navigation/i
            })

            const menu = document.getElementById('mainNav')

            await user.click(toggle)

            expect(menu).toHaveClass('show')

            await user.click(
                screen.getByRole('link', {
                    name: 'Browse Items'
                })
            )

            expectCurrentLocation('/items')
            expect(menu).not.toHaveClass('show')
            expect(toggle).toHaveAttribute(
                'aria-expanded',
                'false'
            )
        })
    })

    describe('when logged out', () => {
        test('shows the public links with the correct URLs', () => {
            renderNavbar()

            expect(
                screen.getByRole('link', { name: 'Home' })
            ).toHaveAttribute('href', '/')

            expect(
                screen.getByRole('link', {
                    name: 'Browse Items'
                })
            ).toHaveAttribute('href', '/items')

            expect(
                screen.getByRole('link', {
                    name: 'How It Works'
                })
            ).toHaveAttribute('href', '/how-it-works')

            expect(
                screen.getByRole('link', { name: 'Log In' })
            ).toHaveAttribute('href', '/login')

            expect(
                screen.getByRole('link', { name: 'Sign Up' })
            ).toHaveAttribute('href', '/register')
        })

        test('does not show authenticated navigation options', () => {
            renderNavbar()

            expect(
                screen.queryByRole('link', {
                    name: 'My Items'
                })
            ).not.toBeInTheDocument()

            expect(
                screen.queryByRole('link', {
                    name: 'Swap Requests'
                })
            ).not.toBeInTheDocument()

            expect(
                screen.queryByRole('link', {
                    name: 'My Profile'
                })
            ).not.toBeInTheDocument()

            expect(
                screen.queryByRole('button', {
                    name: 'Log Out'
                })
            ).not.toBeInTheDocument()
        })

        test.each([
            ['Home', '/'],
            ['Browse Items', '/items'],
            ['How It Works', '/how-it-works'],
            ['Log In', '/login'],
            ['Sign Up', '/register']
        ])(
            'clicking %s navigates to %s',
            async (linkName, expectedPath) => {
                const user = userEvent.setup()

                renderNavbar()

                await user.click(
                    screen.getByRole('link', {
                        name: linkName
                    })
                )

                expectCurrentLocation(expectedPath)
            }
        )
    })

    describe('when logged in', () => {
        beforeEach(() => {
            localStorage.setItem('token', 'valid-token')
        })

        test('shows authenticated links with the correct URLs', () => {
            renderNavbar()

            expect(
                screen.getByRole('link', { name: 'Home' })
            ).toHaveAttribute('href', '/')

            expect(
                screen.getByRole('link', {
                    name: 'Browse Items'
                })
            ).toHaveAttribute('href', '/items')

            expect(
                screen.getByRole('link', {
                    name: 'How It Works'
                })
            ).toHaveAttribute('href', '/how-it-works')

            expect(
                screen.getByRole('link', {
                    name: 'My Items'
                })
            ).toHaveAttribute('href', '/my-items')

            expect(
                screen.getByRole('link', {
                    name: 'Swap Requests'
                })
            ).toHaveAttribute('href', '/swap-requests')

            expect(
                screen.getByRole('link', {
                    name: 'My Profile'
                })
            ).toHaveAttribute('href', '/profile')

            expect(
                screen.getByRole('button', {
                    name: 'Log Out'
                })
            ).toBeInTheDocument()
        })

        test('does not show login or sign-up links', () => {
            renderNavbar()

            expect(
                screen.queryByRole('link', {
                    name: 'Log In'
                })
            ).not.toBeInTheDocument()

            expect(
                screen.queryByRole('link', {
                    name: 'Sign Up'
                })
            ).not.toBeInTheDocument()
        })

        test.each([
            ['Home', '/'],
            ['Browse Items', '/items'],
            ['How It Works', '/how-it-works'],
            ['My Items', '/my-items'],
            ['Swap Requests', '/swap-requests'],
            ['My Profile', '/profile']
        ])(
            'clicking %s navigates to %s',
            async (linkName, expectedPath) => {
                const user = userEvent.setup()

                renderNavbar()

                await user.click(
                    screen.getByRole('link', {
                        name: linkName
                    })
                )

                expectCurrentLocation(expectedPath)
            }
        )

        test('logs the user out and navigates to login', async () => {
            const user = userEvent.setup()

            renderNavbar()

            await user.click(
                screen.getByRole('button', {
                    name: 'Log Out'
                })
            )

            expect(clearSession).toHaveBeenCalledOnce()
            expectCurrentLocation('/login')

            expect(
                screen.getByRole('link', { name: 'Log In' })
            ).toBeInTheDocument()

            expect(
                screen.getByRole('link', { name: 'Sign Up' })
            ).toBeInTheDocument()

            expect(
                screen.queryByRole('button', {
                    name: 'Log Out'
                })
            ).not.toBeInTheDocument()
        })
    })
})