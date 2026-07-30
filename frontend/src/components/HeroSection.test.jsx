import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HeroSection from './HeroSection'

function renderHero(props = {}) {
    return render(
        <MemoryRouter>
            <HeroSection {...props} />
        </MemoryRouter>
    )
}

describe('HeroSection', () => {
    test('shows the community counters passed in', () => {
        renderHero({ memberCount: 1200, itemCount: 340, completedSwapCount: 800 })

        expect(screen.getByText(/1,200 members/)).toBeInTheDocument()
        expect(screen.getByText(/340 items listed/)).toBeInTheDocument()
        expect(screen.getByText(/800 swaps completed/)).toBeInTheDocument()
    })

    test('uses the singular form for a count of one', () => {
        renderHero({ memberCount: 1, itemCount: 1, completedSwapCount: 1 })

        expect(screen.getByText(/1 member$/)).toBeInTheDocument()
        expect(screen.getByText(/1 item listed/)).toBeInTheDocument()
        expect(screen.getByText(/1 swap completed/)).toBeInTheDocument()
    })

    test('falls back to zero when no counts are given', () => {
        renderHero()

        expect(screen.getByText(/0 members/)).toBeInTheDocument()
        expect(screen.getByText(/0 items listed/)).toBeInTheDocument()
        expect(screen.getByText(/0 swaps completed/)).toBeInTheDocument()
    })
})
