import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import { getMyProfile, updateMyProfile } from '../api/users'
localStorage.setItem('token', 'test-token')

vi.mock('../api/users', () => ({
    getMyProfile: vi.fn(),
    updateMyProfile: vi.fn()
}))

const PROFILE = {
    username: 'anna',
    email: 'anna@test.com',
    phoneNumber: '',
    location: 'Galway',
    lat: 53.27,
    lng: -9.05
}
let fetchMock

beforeEach(() => {
    getMyProfile.mockReset()
    updateMyProfile.mockReset()
    getMyProfile.mockResolvedValue(PROFILE)
    localStorage.clear()

    fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ totpEnabled: false })
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ProfilePage', () => {
    test('displays the saved location as plain text', async () => {
        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        expect(await screen.findByText('Galway')).toBeInTheDocument()
    })

    test('pre-fills the location search box with the existing location when editing', async () => {
        const user = userEvent.setup()

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await screen.findByText('Galway')

        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        expect(
            screen.getByPlaceholderText(/type your town or city/i)
        ).toHaveValue('Galway')
    })

    test('clears the location search box after cancelling an edit', async () => {
        const user = userEvent.setup()

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await screen.findByText('Galway')
        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        const locationInput = screen.getByPlaceholderText(/type your town or city/i)
        await user.clear(locationInput)
        await user.type(locationInput, 'Dublin')

        await user.click(screen.getByRole('button', { name: /^cancel$/i }))
        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        // re-entering edit mode should show the saved location again, not
        // the unsaved text that was typed before cancelling
        expect(
            screen.getByPlaceholderText(/type your town or city/i)
        ).toHaveValue('Galway')
    })

    test('saves profile changes including the cached coordinates', async () => {
        const user = userEvent.setup()
        updateMyProfile.mockResolvedValue({ ...PROFILE, username: 'anna2' })

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await screen.findByText('Galway')
        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        const usernameInput = screen.getByDisplayValue('anna')
        await user.clear(usernameInput)
        await user.type(usernameInput, 'anna2')

        await user.click(screen.getByRole('button', { name: /save changes/i }))

        await waitFor(() => {
            expect(updateMyProfile).toHaveBeenCalledWith({
                username: 'anna2',
                location: 'Galway',
                phoneNumber: '',
                lat: 53.27,
                lng: -9.05
            })
        })

        expect(
            await screen.findByText('Profile updated successfully!')
        ).toBeInTheDocument()
    })

    test('updates the visible location box immediately after using GPS, without needing to save first', async () => {
        const user = userEvent.setup()

        const getCurrentPosition = vi.fn((success) => {
            success({ coords: { latitude: 52.26, longitude: -7.11 } })
        })
        vi.stubGlobal('navigator', {
            ...navigator,
            geolocation: { getCurrentPosition }
        })

        vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
            if (url.includes('nominatim.openstreetmap.org/reverse')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        address: { city: 'Waterford' },
                        display_name: 'Waterford, Ireland'
                    })
                })
            }
            return Promise.resolve({ ok: true, json: async () => ({ totpEnabled: false }) })
        })

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await screen.findByText('Galway')
        await user.click(screen.getByRole('button', { name: /edit profile/i }))

        // the box starts out pre-filled with the previously saved location
        expect(
            screen.getByPlaceholderText(/type your town or city/i)
        ).toHaveValue('Galway')

        await user.click(screen.getByRole('button', { name: /use my location/i }))

        // the box should update straight away, not stay on the old value
        // until the user clicks Save
        expect(
            await screen.findByPlaceholderText(/type your town or city/i)
        ).toHaveValue('Waterford')

        expect(
            await screen.findByText(/location detected: waterford/i)
        ).toBeInTheDocument()
    })
    test('shows an error when username is empty', async () => {
        const user = userEvent.setup()

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await screen.findByText('Galway')
        await user.click(
            screen.getByRole('button', { name: /edit profile/i })
        )

        const usernameInput = screen.getByDisplayValue('anna')

        await user.clear(usernameInput)

        await user.click(
            screen.getByRole('button', { name: /save changes/i })
        )

        expect(
            screen.getByText(/username is required/i)
        ).toBeInTheDocument()

        expect(updateMyProfile).not.toHaveBeenCalled()
    })

    test('shows that 2FA is enabled when returned by the backend', async () => {
        localStorage.setItem('token', 'test-token')

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ totpEnabled: true })
        })

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        expect(
            await screen.findByText(
                /two-factor authentication is enabled/i
            )
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', { name: /disable 2fa/i })
        ).toBeInTheDocument()
    })

    test('starts 2FA setup and displays the secret', async () => {
        const user = userEvent.setup()

        localStorage.setItem('token', 'test-token')

        fetchMock.mockImplementation((url) => {
            if (url.includes('/2fa/status')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ totpEnabled: false })
                })
            }

            if (url.includes('/2fa/setup')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        qrCodeUrl: 'otpauth://test',
                        secret: 'TESTSECRET'
                    })
                })
            }

            return Promise.reject(new Error('Unexpected request'))
        })

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await user.click(
            await screen.findByRole('button', {
                name: /enable 2fa/i
            })
        )

        expect(
            await screen.findByText('TESTSECRET')
        ).toBeInTheDocument()

        expect(
            screen.getByPlaceholderText('123456')
        ).toBeInTheDocument()
    })

    test('verifies a 2FA code and enables 2FA', async () => {
        const user = userEvent.setup()

        localStorage.setItem('token', 'test-token')

        fetchMock.mockImplementation((url) => {
            if (url.includes('/2fa/status')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ totpEnabled: false })
                })
            }

            if (url.includes('/2fa/setup')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        qrCodeUrl: 'otpauth://test',
                        secret: 'TESTSECRET'
                    })
                })
            }

            if (url.includes('/verify-setup')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({})
                })
            }

            return Promise.reject(new Error('Unexpected request'))
        })

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await user.click(
            await screen.findByRole('button', {
                name: /enable 2fa/i
            })
        )

        await user.type(
            await screen.findByPlaceholderText('123456'),
            '123456'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify and enable/i
            })
        )

        expect(
            await screen.findByText(/2fa enabled successfully/i)
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                /two-factor authentication is enabled/i
            )
        ).toBeInTheDocument()

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/2fa/verify-setup'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    code: '123456'
                })
            })
        )
    })

    test('shows an error when the 2FA verification code is invalid', async () => {
        const user = userEvent.setup()

        localStorage.setItem('token', 'test-token')

        fetchMock.mockImplementation((url) => {
            if (url.includes('/2fa/status')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ totpEnabled: false })
                })
            }

            if (url.includes('/2fa/setup')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        qrCodeUrl: 'otpauth://test',
                        secret: 'TESTSECRET'
                    })
                })
            }

            return Promise.resolve({
                ok: false,
                json: async () => ({})
            })
        })

        render(<MemoryRouter><ProfilePage /></MemoryRouter>)

        await user.click(
            await screen.findByRole('button', {
                name: /enable 2fa/i
            })
        )

        await user.type(
            await screen.findByPlaceholderText('123456'),
            '000000'
        )

        await user.click(
            screen.getByRole('button', {
                name: /verify and enable/i
            })
        )

        expect(
            await screen.findByText(/invalid code/i)
        ).toBeInTheDocument()
    })


})
