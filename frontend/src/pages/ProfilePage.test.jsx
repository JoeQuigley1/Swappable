import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ProfilePage from './ProfilePage'
import { getMyProfile, updateMyProfile } from '../api/users'

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

beforeEach(() => {
    getMyProfile.mockReset()
    updateMyProfile.mockReset()
    getMyProfile.mockResolvedValue(PROFILE)
    localStorage.clear()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
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
})
