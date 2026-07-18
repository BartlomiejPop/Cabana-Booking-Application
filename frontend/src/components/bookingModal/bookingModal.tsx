import { useState, type FormEvent } from 'react'
import './bookingModal.css'

const ROOM_NUMBER_REGEX = /^\d+$/
const GUEST_NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/

type BookingModalProps = {
	cabanaId: string
	onCancel: () => void
	onSubmit: (payload: { room: string; guestName: string }) => Promise<void>
}

export default function BookingModal({ cabanaId, onCancel, onSubmit }: BookingModalProps) {
	const [room, setRoom] = useState('')
	const [guestName, setGuestName] = useState('')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		const nextRoom = room.trim()
		const nextGuestName = guestName.trim()

		if (!nextRoom || !nextGuestName) {
			setErrorMessage('Enter both room number and guest name.')
			return
		}

		if (!ROOM_NUMBER_REGEX.test(nextRoom)) {
			setErrorMessage('Room number must contain digits only.')
			return
		}

		if (!GUEST_NAME_REGEX.test(nextGuestName)) {
			setErrorMessage('Guest name must contain letters, spaces, apostrophes, or hyphens only.')
			return
		}

		setIsSubmitting(true)
		setErrorMessage(null)

		try {
			await onSubmit({ room: nextRoom, guestName: nextGuestName })
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Booking failed')
			setIsSubmitting(false)
		}
	}

	return (
		<div className="modalBackdrop" role="presentation" onClick={onCancel}>
			<div
				className="modalCard"
				role="dialog"
				aria-modal="true"
				aria-labelledby="booking-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="modalHeader">
					<h2 id="booking-modal-title">Book Cabana {cabanaId}</h2>
					<p>Enter the room number and guest name exactly as listed in the resort booking system.</p>
				</div>

				<form className="bookingForm" onSubmit={handleSubmit}>
					<label className="bookingField">
						<span>Room number</span>
						<input
							autoFocus
							name="room"
							inputMode="numeric"
							value={room}
							onChange={(event) => setRoom(event.target.value)}
							disabled={isSubmitting}
						/>
					</label>

					<label className="bookingField">
						<span>Guest name</span>
						<input
							name="guestName"
							value={guestName}
							onChange={(event) => setGuestName(event.target.value)}
							disabled={isSubmitting}
						/>
					</label>

					<p className="modalMessage" aria-live="polite">
						{errorMessage}
					</p>

					<div className="modalActions">
						<button
							type="button"
							className="modalButton modalButtonSecondary"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button type="submit" className="modalButton modalButtonPrimary" disabled={isSubmitting}>
							{isSubmitting ? 'Booking...' : 'Confirm booking'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
