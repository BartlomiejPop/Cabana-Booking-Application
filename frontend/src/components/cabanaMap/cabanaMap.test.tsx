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

		expect(screen.getByText('Cabana cabana-0-0 is available. Complete the booking form to reserve it.')).toBeInTheDocument()
		expect(screen.getByRole('dialog', { name: 'Book Cabana cabana-0-0' })).toBeInTheDocument()
	})

	it('books an available cabana and refreshes the map', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValueOnce(mapFixture).mockResolvedValueOnce({
			...mapFixture,
			cabanas: [{ ...mapFixture.cabanas[0], isBooked: true }],
		})
		vi.spyOn(services, 'bookCabana').mockResolvedValue({
			success: true,
			message: 'Cabana cabana-0-0 booked successfully',
			cabanaId: 'cabana-0-0',
		})

		render(<CabanaMap />)

		await userEvent.click(await screen.findByRole('button', { name: 'Cabana cabana-0-0' }))
		await userEvent.type(screen.getByLabelText('Room number'), '101')
		await userEvent.type(screen.getByLabelText('Guest name'), 'Alex Guest')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		const statusMessage = await screen.findByText('Cabana cabana-0-0 booked successfully. cabana-0-0 is now unavailable.')
		expect(statusMessage).toBeInTheDocument()
		expect(statusMessage).toHaveClass('success')
		expect(screen.queryByRole('dialog', { name: 'Book Cabana cabana-0-0' })).not.toBeInTheDocument()
		expect(screen.getByText('Booked')).toBeInTheDocument()
		expect(services.bookCabana).toHaveBeenCalledWith('http://localhost:3000', 'cabana-0-0', {
			room: '101',
			guestName: 'Alex Guest',
		})
	})

	it('shows booking error inside the modal when reservation fails', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValue(mapFixture)
		vi.spyOn(services, 'bookCabana').mockRejectedValue(new Error('Room number and guest name do not match'))

		render(<CabanaMap />)

		await userEvent.click(await screen.findByRole('button', { name: 'Cabana cabana-0-0' }))
		await userEvent.type(screen.getByLabelText('Room number'), '404')
		await userEvent.type(screen.getByLabelText('Guest name'), 'Wrong Guest')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		const errorMessages = await screen.findAllByText('Room number and guest name do not match')
		expect(errorMessages).toHaveLength(2)
		expect(screen.getByText('Room number and guest name do not match', { selector: '.status' })).toHaveClass('error')
		expect(screen.getByText('Room number and guest name do not match', { selector: '.modalMessage' })).toBeInTheDocument()
		expect(screen.getByRole('dialog', { name: 'Book Cabana cabana-0-0' })).toBeInTheDocument()
	})

	it('validates room number format in the modal before submitting', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValue(mapFixture)
		const bookCabanaSpy = vi.spyOn(services, 'bookCabana')

		render(<CabanaMap />)

		await userEvent.click(await screen.findByRole('button', { name: 'Cabana cabana-0-0' }))
		await userEvent.type(screen.getByLabelText('Room number'), '10A')
		await userEvent.type(screen.getByLabelText('Guest name'), 'Alex Guest')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(screen.getByText('Room number must contain digits only.')).toBeInTheDocument()
		expect(bookCabanaSpy).not.toHaveBeenCalled()
	})

	it('validates guest name format in the modal before submitting', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValue(mapFixture)
		const bookCabanaSpy = vi.spyOn(services, 'bookCabana')

		render(<CabanaMap />)

		await userEvent.click(await screen.findByRole('button', { name: 'Cabana cabana-0-0' }))
		await userEvent.type(screen.getByLabelText('Room number'), '101')
		await userEvent.type(screen.getByLabelText('Guest name'), '12345')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(
			screen.getByText('Guest name must contain letters, spaces, apostrophes, or hyphens only.'),
		).toBeInTheDocument()
		expect(bookCabanaSpy).not.toHaveBeenCalled()
	})

	it('shows a reassignment message when a guest switches cabanas', async () => {
		vi.spyOn(services, 'fetchMapData').mockResolvedValueOnce(mapFixture).mockResolvedValueOnce({
			...mapFixture,
			cabanas: [{ ...mapFixture.cabanas[0], isBooked: true }],
		})
		vi.spyOn(services, 'bookCabana').mockResolvedValue({
			success: true,
			message: 'Booking moved from cabana-4-2 to cabana-0-0',
			cabanaId: 'cabana-0-0',
		})

		render(<CabanaMap />)

		await userEvent.click(await screen.findByRole('button', { name: 'Cabana cabana-0-0' }))
		await userEvent.type(screen.getByLabelText('Room number'), '101')
		await userEvent.type(screen.getByLabelText('Guest name'), 'Alex Guest')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		const statusMessage = await screen.findByText(
			'Booking moved from cabana-4-2 to cabana-0-0. cabana-0-0 is now unavailable.',
		)
		expect(statusMessage).toHaveClass('success')
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
