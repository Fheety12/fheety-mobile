import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function formatDate(value) {
  if (!value) return 'Not provided'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-NG', {
    dateStyle: 'medium',
  })
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not set'
  }

  return `₦${Number(value).toLocaleString('en-NG')}`
}

function CarHireAdmin() {
  const [bookings, setBookings] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [fareInputs, setFareInputs] = useState({})

  async function loadData() {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const [bookingResult, driverResult, vehicleResult] =
        await Promise.all([
          supabase
            .from('car_hire_bookings')
            .select('*')
            .order('created_at', { ascending: false }),

          supabase
            .from('drivers')
            .select('id, full_name, phone, is_active')
            .order('full_name'),

          supabase
            .from('vehicles')
            .select(
              'id, vehicle_type, make_model, registration_number, is_active'
            )
            .order('created_at', { ascending: false }),
        ])

      if (bookingResult.error) {
        throw new Error(
          `Could not load car-hire bookings: ${bookingResult.error.message}`
        )
      }

      if (driverResult.error) {
        throw new Error(
          `Could not load drivers: ${driverResult.error.message}`
        )
      }

      if (vehicleResult.error) {
        throw new Error(
          `Could not load vehicles: ${vehicleResult.error.message}`
        )
      }

      const loadedBookings = bookingResult.data || []

      setBookings(loadedBookings)
      setDrivers(driverResult.data || [])
      setVehicles(vehicleResult.data || [])

      setFareInputs(
        Object.fromEntries(
          loadedBookings.map((booking) => [
            booking.id,
            booking.final_fare ?? booking.estimated_fare ?? '',
          ])
        )
      )
    } catch (err) {
      setError(err.message || 'Something went wrong while loading car hires.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function updateHireBooking(booking, changes, successMessage) {
    setSavingId(booking.id)
    setError('')
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('car_hire_bookings')
        .update(changes)
        .eq('id', booking.id)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        throw new Error(
          'No booking was updated. Check the admin permissions.'
        )
      }

      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, ...changes } : item
        )
      )

      setMessage(successMessage)
    } catch (err) {
      setError(err.message || 'Could not update this booking.')
    } finally {
      setSavingId(null)
    }
  }

  async function saveFare(booking) {
    const rawFare = fareInputs[booking.id]

    if (rawFare === '' || rawFare === null || rawFare === undefined) {
      setError('Enter a rental price before saving.')
      return
    }

    const fare = Number(rawFare)

    if (!Number.isFinite(fare) || fare < 0) {
      setError('Enter a valid rental price.')
      return
    }

    await updateHireBooking(
      booking,
      { final_fare: fare },
      'Final rental price saved.'
    )
  }

  const activeDrivers = drivers.filter((driver) => driver.is_active)
  const activeVehicles = vehicles.filter((vehicle) => vehicle.is_active)

  const pendingCount = bookings.filter(
    (booking) =>
      booking.status === 'pending' || booking.status === 'under_review'
  ).length

  const confirmedCount = bookings.filter(
    (booking) => booking.status === 'confirmed'
  ).length

  return (
    <section className="admin-bookings-panel admin-car-hire-panel">
      <div className="admin-bookings-header">
        <div>
          <h2>Car Hire Bookings</h2>
          <p>Manage chauffeur-driven vehicle hire requests.</p>
        </div>

        <button
          className="admin-refresh"
          type="button"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh car hires'}
        </button>
      </div>

      <div className="admin-driver-summary">
        <div>
          <strong>{bookings.length}</strong>
          <span>Total hire requests</span>
        </div>

        <div>
          <strong>{pendingCount}</strong>
          <span>Awaiting review</span>
        </div>

        <div>
          <strong>{confirmedCount}</strong>
          <span>Confirmed hires</span>
        </div>
      </div>

      {message && (
        <p className="admin-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="admin-loading">Loading car-hire requests...</p>
      )}

      {!loading && bookings.length === 0 && !error && (
        <div className="admin-empty">
          <h3>No car-hire requests yet</h3>
          <p>New customer requests will appear here.</p>
        </div>
      )}

      <div className="admin-booking-grid">
        {bookings.map((booking) => {
          const assignedDriver = drivers.find(
            (driver) => driver.id === booking.driver_id
          )

          const assignedVehicle = vehicles.find(
            (vehicle) => vehicle.id === booking.vehicle_id
          )

          const availableVehicles = activeVehicles.filter(
            (vehicle) =>
              vehicle.vehicle_type === booking.vehicle_type ||
              vehicle.id === booking.vehicle_id
          )

          return (
            <article className="admin-booking-card" key={booking.id}>
              <div className="admin-booking-header">
                <div>
                  <p className="admin-booking-label">CAR HIRE REQUEST</p>

                  <h3 className="admin-booking-title">
                    FH-CH-{booking.id.slice(0, 8).toUpperCase()}
                  </h3>

                  <p className="admin-submitted-date">
                    Submitted:{' '}
                    {new Date(booking.created_at).toLocaleString('en-NG')}
                  </p>
                </div>

                <span className="admin-status-badge">
                  {booking.status?.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="admin-customer-section">
                <p className="admin-section-label">CUSTOMER INFORMATION</p>

                <p>
                  <strong>Name:</strong> {booking.customer_name}
                </p>

                <p>
                  <strong>Email:</strong> {booking.customer_email}
                </p>

                <p>
                  <strong>Phone:</strong> {booking.customer_phone}
                </p>

                <p>
                  <strong>Booking for:</strong>{' '}
                  {booking.booking_for === 'someone_else'
                    ? 'Someone else'
                    : 'Customer'}
                </p>

                {booking.booking_for === 'someone_else' && (
                  <>
                    <p>
                      <strong>Passenger:</strong>{' '}
                      {booking.passenger_name || 'Not provided'}
                    </p>

                    <p>
                      <strong>Passenger phone:</strong>{' '}
                      {booking.passenger_phone || 'Not provided'}
                    </p>
                  </>
                )}
              </div>

              <div className="admin-customer-section">
                <p className="admin-section-label">HIRE DETAILS</p>

                <p>
                  <strong>Vehicle type:</strong> {booking.vehicle_type}
                </p>

                <p>
                  <strong>Start date:</strong>{' '}
                  {formatDate(booking.booking_date)}
                </p>

                <p>
                  <strong>Duration:</strong> {booking.number_of_days} day(s)
                </p>

                <p>
                  <strong>Travel:</strong>{' '}
                  {booking.travel_scope === 'outside_lagos'
                    ? 'Outside Lagos'
                    : 'Within Lagos'}
                </p>

                <p>
                  <strong>Area:</strong>{' '}
                  {booking.service_area === 'lagos_island'
                    ? 'Lagos Island'
                    : booking.service_area === 'lagos_mainland'
                      ? 'Lagos Mainland'
                      : 'Special travel request'}
                </p>

                <p>
                  <strong>Arrangement:</strong>{' '}
                  {booking.journey_arrangement?.replaceAll('_', ' ')}
                </p>

                <p>
                  <strong>Pickup:</strong> {booking.pickup_address}
                </p>

                <p>
                  <strong>Destination:</strong> {booking.destination}
                </p>

                <p>
                  <strong>Instructions:</strong>{' '}
                  {booking.trip_details || 'None'}
                </p>
              </div>

              <div className="admin-customer-section">
                <p className="admin-section-label">PRICING</p>

                <p>
                  <strong>Estimated price:</strong>{' '}
                  {formatMoney(booking.estimated_fare)}
                </p>

                <p>
                  <strong>Final rental price:</strong>{' '}
                  {formatMoney(booking.final_fare)}
                </p>
              </div>

              {booking.travel_scope === 'outside_lagos' && (
                <div className="booking-note">
                  <strong>Outside Lagos – Special Approval</strong>
                  <p>
                    Review the route, driver availability and pricing before
                    confirming this request.
                  </p>
                </div>
              )}

              <div className="admin-status-control">
                <label
                  className="admin-label"
                  htmlFor={`hire-driver-${booking.id}`}
                >
                  Assign driver
                </label>

                <select
                  className="admin-select"
                  id={`hire-driver-${booking.id}`}
                  value={booking.driver_id || ''}
                  disabled={savingId === booking.id}
                  onChange={(event) =>
                    updateHireBooking(
                      booking,
                      { driver_id: event.target.value || null },
                      'Driver assignment saved.'
                    )
                  }
                >
                  <option value="">Unassigned</option>

                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </option>
                  ))}

                  {assignedDriver && !assignedDriver.is_active && (
                    <option value={assignedDriver.id}>
                      {assignedDriver.full_name} (Inactive)
                    </option>
                  )}
                </select>

                <p className="admin-date-value">
                  Currently assigned:{' '}
                  {assignedDriver?.full_name || 'No driver assigned'}
                </p>
              </div>

              <div className="admin-status-control">
                <label
                  className="admin-label"
                  htmlFor={`hire-vehicle-${booking.id}`}
                >
                  Assign vehicle
                </label>

                <select
                  className="admin-select"
                  id={`hire-vehicle-${booking.id}`}
                  value={booking.vehicle_id || ''}
                  disabled={savingId === booking.id}
                  onChange={(event) =>
                    updateHireBooking(
                      booking,
                      { vehicle_id: event.target.value || null },
                      'Vehicle assignment saved.'
                    )
                  }
                >
                  <option value="">Unassigned</option>

                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make_model || vehicle.vehicle_type}
                      {vehicle.registration_number
                        ? ` – ${vehicle.registration_number}`
                        : ''}
                    </option>
                  ))}
                </select>

                <p className="admin-date-value">
                  Currently assigned:{' '}
                  {assignedVehicle
                    ? `${assignedVehicle.make_model || assignedVehicle.vehicle_type} ${assignedVehicle.registration_number || ''}`
                    : 'No vehicle assigned'}
                </p>

                {activeVehicles.length === 0 && (
                  <p className="admin-date-value">
                    No active vehicles registered yet. Add vehicles before
                    assigning one.
                  </p>
                )}
              </div>

              <div className="admin-status-control">
                <label
                  className="admin-label"
                  htmlFor={`hire-fare-${booking.id}`}
                >
                  Final rental price (₦)
                </label>

                <input
                  className="admin-input"
                  id={`hire-fare-${booking.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fareInputs[booking.id] ?? ''}
                  onChange={(event) =>
                    setFareInputs((current) => ({
                      ...current,
                      [booking.id]: event.target.value,
                    }))
                  }
                  placeholder="Enter final price"
                />

                <button
                  className="admin-refresh"
                  type="button"
                  onClick={() => saveFare(booking)}
                  disabled={savingId === booking.id}
                >
                  {savingId === booking.id
                    ? 'Saving...'
                    : 'Save rental price'}
                </button>
              </div>

              <div className="admin-status-control">
                <label
                  className="admin-label"
                  htmlFor={`hire-status-${booking.id}`}
                >
                  Update hire status
                </label>

                <select
                  className="admin-select"
                  id={`hire-status-${booking.id}`}
                  value={booking.status}
                  disabled={savingId === booking.id}
                  onChange={(event) =>
                    updateHireBooking(
                      booking,
                      { status: event.target.value },
                      'Car-hire booking status updated.'
                    )
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {savingId === booking.id && (
                <p className="admin-status-saving">Saving changes...</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default CarHireAdmin