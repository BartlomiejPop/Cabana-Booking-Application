import { useEffect, useMemo, useState } from 'react'
import emptyTile from '../../assets/parchmentBasic.png'
import BookingModal from '../bookingModal/bookingModal.tsx'
import './cabanaMap.css'
import {
	bookCabana,
	buildCabanaLookup,
	fetchMapData,
	getTileAsset,
	getTileRotation,
	type Cabana,
	type MapResponse,
} from './cabanaMapServices.ts'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

type StatusTone = 'info' | 'success' | 'error'

export default function CabanaMap() {
	const [mapData, setMapData] = useState<MapResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [cabanaMessage, setCabanaMessage] = useState('Tap a cabana to check availability.')
	const [cabanaMessageTone, setCabanaMessageTone] = useState<StatusTone>('info')
	const [selectedCabana, setSelectedCabana] = useState<Cabana | null>(null)

	async function loadMap() {
		setLoading(true)
		setErrorMessage(null)

		try {
			const payload = await fetchMapData(API_BASE_URL)
			setMapData(payload)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown map loading error'
			setErrorMessage(message)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadMap()
	}, [])

	const cabanaByCoordinate = useMemo(() => buildCabanaLookup(mapData), [mapData])

	function handleCabanaClick(x: number, y: number) {
		const cabana = cabanaByCoordinate.get(`${x},${y}`)
		if (!cabana) {
			return
		}

		if (cabana.isBooked) {
			setSelectedCabana(null)
			setCabanaMessage(`Cabana ${cabana.id} is currently unavailable.`)
			setCabanaMessageTone('error')
			return
		}

		setSelectedCabana(cabana)
		setCabanaMessage(`Cabana ${cabana.id} is available. Complete the booking form to reserve it.`)
		setCabanaMessageTone('info')
	}

	async function handleBookingSubmit(payload: { room: string; guestName: string }) {
		if (!selectedCabana) {
			return
		}

		try {
			const booking = await bookCabana(API_BASE_URL, selectedCabana.id, payload)
			await loadMap()
			setSelectedCabana(null)
			setCabanaMessage(`${booking.message}. ${booking.cabanaId} is now unavailable.`)
			setCabanaMessageTone('success')
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Booking failed'
			setCabanaMessage(message)
			setCabanaMessageTone('error')
			throw error
		}
	}

	const statusClassName = ['status', cabanaMessageTone === 'success' ? 'success' : '', cabanaMessageTone === 'error' ? 'error' : '']
		.filter(Boolean)
		.join(' ')

	const columns = mapData?.grid[0]?.length ?? 0

	return (
		<main className="app">
			<section className="mapSection">
				{loading && <p className="status">Loading map...</p>}
				{errorMessage && <p className="status error">Could not load map: {errorMessage}</p>}

				{!loading && !errorMessage && mapData && (
					<div className="boardWrap">
						<div
							className="board"
							style={{
								gridTemplateColumns: `repeat(${columns}, var(--tile-size))`,
								backgroundImage: `url(${emptyTile})`,
							}}
						>
							{mapData.grid.map((row, y) =>
								row.map((cell, x) => {
									const cabana = cabanaByCoordinate.get(`${x},${y}`)
									const isCabana = cell === 'W' && cabana
									const tileClassName = [
										'tile',
										isCabana ? 'isCabana' : '',
										isCabana && cabana.isBooked ? 'isBooked' : '',
									]
										.filter(Boolean)
										.join(' ')

									return (
										<button
											key={`${x}-${y}`}
											type="button"
											className={tileClassName}
											onClick={() => (isCabana ? handleCabanaClick(x, y) : undefined)}
											disabled={!isCabana}
											aria-label={isCabana ? `Cabana ${cabana.id}` : `Tile ${cell}`}
										>
											{cell !== '.' && (
												<img
													src={getTileAsset(cell, mapData, x, y)}
													alt=""
													draggable={false}
													style={{ transform: `rotate(${getTileRotation(cell, mapData, x, y)}deg)` }}
												/>
											)}
											{isCabana && cabana.isBooked && <span className="bookedBadge">Booked</span>}
										</button>
									)
								}),
							)}
						</div>
					</div>
				)}

				<p className={statusClassName}>{cabanaMessage}</p>
			</section>

			{selectedCabana && (
				<BookingModal
					cabanaId={selectedCabana.id}
					onCancel={() => setSelectedCabana(null)}
					onSubmit={handleBookingSubmit}
				/>
			)}
		</main>
	)
}
