import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BookingModal from './bookingModal.tsx'

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

describe('BookingModal', () => {
	it('shows required fields message when room or guest name is missing', async () => {
		const onSubmit = vi.fn<() => Promise<void>>()

		render(<BookingModal cabanaId="cabana-0-0" onCancel={vi.fn()} onSubmit={onSubmit} />)

		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(screen.getByText('Enter both room number and guest name.')).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('validates room number format before submit', async () => {
		const onSubmit = vi.fn<() => Promise<void>>()

		render(<BookingModal cabanaId="cabana-0-0" onCancel={vi.fn()} onSubmit={onSubmit} />)

		await userEvent.type(screen.getByLabelText('Room number'), '10A')
		await userEvent.type(screen.getByLabelText('Guest name'), 'Alex Guest')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(screen.getByText('Room number must contain digits only.')).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('validates guest name format before submit', async () => {
		const onSubmit = vi.fn<() => Promise<void>>()

		render(<BookingModal cabanaId="cabana-0-0" onCancel={vi.fn()} onSubmit={onSubmit} />)

		await userEvent.type(screen.getByLabelText('Room number'), '101')
		await userEvent.type(screen.getByLabelText('Guest name'), '1234')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(
			screen.getByText('Guest name must contain letters, spaces, apostrophes, or hyphens only.'),
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('submits trimmed room and guest name values', async () => {
		const onSubmit = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

		render(<BookingModal cabanaId="cabana-0-0" onCancel={vi.fn()} onSubmit={onSubmit} />)

		await userEvent.type(screen.getByLabelText('Room number'), ' 101 ')
		await userEvent.type(screen.getByLabelText('Guest name'), ' Alex Guest ')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(onSubmit).toHaveBeenCalledWith({ room: '101', guestName: 'Alex Guest' })
	})

	it('shows submit error message returned by parent submit handler', async () => {
		const onSubmit = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('Booking failed at API'))

		render(<BookingModal cabanaId="cabana-0-0" onCancel={vi.fn()} onSubmit={onSubmit} />)

		await userEvent.type(screen.getByLabelText('Room number'), '101')
		await userEvent.type(screen.getByLabelText('Guest name'), 'Alex Guest')
		await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

		expect(await screen.findByText('Booking failed at API')).toBeInTheDocument()
	})

	it('calls onCancel when cancel button is clicked', async () => {
		const onCancel = vi.fn()

		render(<BookingModal cabanaId="cabana-0-0" onCancel={onCancel} onSubmit={vi.fn<() => Promise<void>>()} />)

		await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

		expect(onCancel).toHaveBeenCalledTimes(1)
	})
})
