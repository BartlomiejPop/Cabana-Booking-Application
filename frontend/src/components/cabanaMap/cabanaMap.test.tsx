import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CabanaMap from './cabanaMap.tsx'
import * as services from './cabanaMapServices.ts'

const mapFixture: services.MapResponse = {
	map: 'W.\n#p',
	rows: ['W.', '#p'],
	grid: [
		['W', '.'],
		['#', 'p'],
	],
	cabanas: [
		{
			id: 'cabana-0-0',
			x: 0,
			y: 0,
			isBooked: false,
		},
	],
}

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

describe('CabanaMap', () => {
	it('shows loading state before map is loaded', () => {
		vi.spyOn(services, 'fetchMapData').mockImplementation(
			() => new Promise(() => {
				// Keep pending to assert initial loading UI.
			}),
		)

		render(<CabanaMap />)

		expect(screen.getByText('Loading map...')).toBeInTheDocument()
	})

	it('shows API error message when map fetch fails', async () => {
		vi.spyOn(services, 'fetchMapData').mockRejectedValue(new Error('Network down'))

		render(<CabanaMap />)

		expect(await screen.findByText('Could not load map: Network down')).toBeInTheDocument()
	})

	it('renders cabana tile and updates status after clicking available cabana', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValue(mapFixture)

		render(<CabanaMap />)

		const cabanaButton = await screen.findByRole('button', { name: 'Cabana cabana-0-0' })
		await userEvent.click(cabanaButton)

		expect(screen.getByText('Cabana cabana-0-0 is available. Booking form comes in Step 2.')).toBeInTheDocument()
	})

	it('shows unavailable message for booked cabana', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValue({
			...mapFixture,
			cabanas: [{ ...mapFixture.cabanas[0], isBooked: true }],
		})

		render(<CabanaMap />)

		const cabanaButton = await screen.findByRole('button', { name: 'Cabana cabana-0-0' })
		await userEvent.click(cabanaButton)

		expect(screen.getByText('Cabana cabana-0-0 is currently unavailable.')).toBeInTheDocument()
		expect(screen.getByText('Booked')).toBeInTheDocument()
	})
})
