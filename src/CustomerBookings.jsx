
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './CustomerBookings.css'

function getBookingReference(id, prefix = 'FH') {
  if (!id) return 'Unavailable'
  return `${prefix}-${String(id).slice(0, 8).toUpperCase()}`
}

function formatDate(date) {
  if (!date) return 'Not provided'

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return 'Not yet provided'
  }

  const number = Number(amount)

  if (Number.isNaN(number)) return String(amount)

  return `₦${number.toLocaleString('en-NG')}`
}

function formatNotificationTime(date) {
  if (!date) return 'Time unavailable'

  return new Date(date).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getStatusClass(status) {
  const value = (status || 'pending').toLowerCase()

  const classes = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    cancelled: 'status-cancelled',
    completed: 'status-completed',
  }

  return classes[value] || 'status-pending'
}

function formatStatus(status) {
  const value = status || 'pending'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([])
  const [carHireBookings, setCarHireBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [updatingNotification, setUpdatingNotification] = useState(null)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setMessage('')

    try {
      const { data, error } = await supabase.auth.getUser()

      if (error) throw error

      const user = data.user

      if (!user) {
        setBookings([])
        setCarHireBookings([])
        setNotifications([])
        setCustomerEmail('')
        setMessage('Please log in to view your bookings.')
        return
      }

      setCustomerEmail(user.email || '')

      // Load ordinary ride bookings.
      const { data: rideRows, error: rideError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (rideError) throw rideError

      // Load car hire bookings.
      const { data: hireRows, error: hireError } = await supabase
        .from('car_hire_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (hireError) throw hireError

      // Load customer notifications.
      const { data: notificationRows, error: notificationError } =
        await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

      if (notificationError) throw notificationError

      // Load assigned vehicles and drivers.
      const vehicleIds = [
        ...new Set(
          (hireRows || []).map((item) => item.vehicle_id).filter(Boolean)
        ),
      ]

      const driverIds = [
        ...new Set(
          (hireRows || []).map((item) => item.driver_id).filter(Boolean)
        ),
      ]

      let vehicleMap = {}
      let driverMap = {}

      if (vehicleIds.length > 0) {
        const { data: vehicleRows, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .in('id', vehicleIds)

        if (vehicleError) throw vehicleError

        vehicleMap = Object.fromEntries(
          (vehicleRows || []).map((vehicle) => [vehicle.id, vehicle])
        )
      }

      if (driverIds.length > 0) {
        const { data: driverRows, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .in('id', driverIds)

        if (driverError) throw driverError

        driverMap = Object.fromEntries(
          (driverRows || []).map((driver) => [driver.id, driver])
        )
      }

      const enrichedHireRows = (hireRows || []).map((booking) => ({
        ...booking,
        assignedVehicle: vehicleMap[booking.vehicle_id] || null,
        assignedDriver: driverMap[booking.driver_id] || null,
      }))

      setBookings(rideRows || [])
      setCarHireBookings(enrichedHireRows)
      setNotifications(notificationRows || [])
    } catch (error) {
      console.error('Booking history error:', error)
      setMessage(
        error?.message || 'Unable to load bookings. Please try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()

    const intervalId = setInterval(() => {
      loadBookings(true)
    }, 15000)

    return () => clearInterval(intervalId)
  }, [loadBookings])

  async function markNotificationRead(notification) {
    if (notification.is_read) return

    setUpdatingNotification(notification.id)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
        .select()
        .single()

      if (error) throw error

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? data : item
        )
      )
    } catch (error) {
      console.error('Notification update error:', error)
      setMessage(error.message || 'Unable to update notification.')
    } finally {
      setUpdatingNotification(null)
    }
  }

  async function markAllNotificationsRead() {
    if (unreadCount === 0) return

    setMarkingAllRead(true)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .select()

      if (error) throw error

      const updatedIds = new Set((data || []).map((item) => item.id))

      setNotifications((current) =>
        current.map((item) =>
          updatedIds.has(item.id) ? { ...item, is_read: true } : item
        )
      )
    } catch (error) {
      console.error('Mark all notifications error:', error)
      setMessage(error.message || 'Unable to update notifications.')
    } finally {
      setMarkingAllRead(false)
    }
  }

  async function cancelBooking(booking) {
    const currentStatus = (booking.status || 'pending').toLowerCase()

    if (currentStatus !== 'pending') return

    const confirmed = window.confirm(
      'Are you sure you want to cancel this ride booking?'
    )

    if (!confirmed) return

    setCancellingId(booking.id)
    setMessage('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError) throw userError

      if (!userData.user) {
        throw new Error('Please log in again to cancel this booking.')
      }

      const { error } = await supabase.rpc('cancel_booking', {
        p_booking_id: booking.id,
      })

      if (error) throw error

      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id
            ? { ...item, status: 'cancelled' }
            : item
        )
      )

      await loadBookings(true)
    } catch (error) {
      console.error('Booking cancellation error:', error)
      setMessage(error.message || 'Unable to cancel this booking.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <main className="customer-bookings-page">
      <header className="bookings-header">
        <a className="bookings-brand" href="/">
          Fheety<span>Mobile</span>
        </a>

        <a className="bookings-home-link" href="/">
          ← Home
        </a>
      </header>

      <section className="customer-bookings">
        <div className="bookings-heading">
          <div>
            <p className="bookings-eyebrow">CUSTOMER ACCOUNT</p>
            <h1>My Bookings</h1>

            {customerEmail && (
              <p className="customer-email">
                Signed in as <strong>{customerEmail}</strong>
              </p>
            )}
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={() => loadBookings(true)}
            disabled={loading || refreshing}
          >
            ↻ {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>

        {loading && (
          <div className="booking-state">
            <div className="loading-spinner" aria-hidden="true"></div>
            <p>Loading your bookings...</p>
          </div>
        )}

        {!loading && message && (
          <div className="booking-state booking-message" role="alert">
            <div className="state-icon">!</div>
            <h2>Booking information</h2>
            <p>{message}</p>

            <button
              type="button"
              className="retry-button"
              onClick={() => loadBookings(true)}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !message && (
          <>
            {/* NOTIFICATIONS */}
            <section className="customer-booking-category notifications-section">
              <div className="bookings-heading">
                <div>
                  <h2>🔔 Notifications</h2>
                  <p>
                    {unreadCount > 0
                      ? `You have ${unreadCount} unread notification(s).`
                      : 'You are all caught up.'}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="refresh-button"
                    onClick={markAllNotificationsRead}
                    disabled={markingAllRead}
                  >
                    {markingAllRead ? 'Updating...' : 'Mark all as read'}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="booking-state">
                  <p>No notifications yet. Booking updates will appear here.</p>
                </div>
              ) : (
                <div className="booking-list">
                  {notifications.map((notification) => (
                    <article
                      className="booking-card notification-card"
                      key={notification.id}
                      style={{
                        borderLeft: notification.is_read
                          ? '4px solid #d1d5db'
                          : '4px solid #2563eb',
                      }}
                    >
                      <div className="booking-card-top">
                        <div>
                          <p className="booking-label">
                            {notification.is_read ? 'READ' : 'NEW NOTIFICATION'}
                          </p>
                          <h3>{notification.title}</h3>
                        </div>

                        {!notification.is_read && (
                          <span className="status-badge status-confirmed">
                            New
                          </span>
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <small>
                        {formatNotificationTime(notification.created_at)}
                      </small>

                      {!notification.is_read && (
                        <div className="booking-card-footer">
                          <button
                            type="button"
                            className="refresh-button"
                            onClick={() => markNotificationRead(notification)}
                            disabled={updatingNotification === notification.id}
                          >
                            {updatingNotification === notification.id
                              ? 'Updating...'
                              : 'Mark as read'}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* RIDE BOOKINGS */}
            <section className="customer-booking-category">
              <h2>🚘 Ride Bookings</h2>

              {bookings.length === 0 ? (
                <p>You have no ride bookings yet.</p>
              ) : (
                <div className="booking-list">
                  {bookings.map((booking) => (
                    <article className="booking-card" key={booking.id}>
                      <div className="booking-card-top">
                        <div>
                          <p className="booking-label">BOOKING REFERENCE</p>
                          <h3 className="booking-reference">
                            {getBookingReference(booking.id)}
                          </h3>
                        </div>

                        <span className={`status-badge ${getStatusClass(booking.status)}`}>
                          {formatStatus(booking.status)}
                        </span>
                      </div>

                      <div className="booking-route">
                        <div className="route-point">
                          <span className="pickup-dot">●</span>
                          <div>
                            <small>PICKUP LOCATION</small>
                            <strong>{booking.pickup_location || 'Not provided'}</strong>
                          </div>
                        </div>

                        <div className="route-point">
                          <span className="destination-dot">●</span>
                          <div>
                            <small>DESTINATION</small>
                            <strong>{booking.destination || 'Not provided'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="booking-details">
                        <div className="booking-detail">
                          <span className="detail-icon">📅</span>
                          <div>
                            <small>Travel date</small>
                            <strong>{formatDate(booking.travel_date)}</strong>
                          </div>
                        </div>

                        <div className="booking-detail">
                          <span className="detail-icon">🕐</span>
                          <div>
                            <small>Pickup time</small>
                            <strong>{booking.pickup_time || 'Not provided'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="booking-card-footer">
                        <span>Reference: {getBookingReference(booking.id)}</span>

                        {booking.status?.toLowerCase() === 'pending' && (
                          <button
                            type="button"
                            className="cancel-booking-button"
                            onClick={() => cancelBooking(booking)}
                            disabled={cancellingId === booking.id}
                          >
                            {cancellingId === booking.id
                              ? 'Cancelling...'
                              : 'Cancel booking'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* CAR HIRE BOOKINGS */}
            <section className="customer-booking-category">
              <h2>🚙 Car Hire Bookings</h2>

              {carHireBookings.length === 0 ? (
                <p>You have no car hire bookings yet.</p>
              ) : (
                <div className="booking-list">
                  {carHireBookings.map((booking) => {
                    const vehicle = booking.assignedVehicle
                    const driver = booking.assignedDriver

                    return (
                      <article className="booking-card" key={booking.id}>
                        <div className="booking-card-top">
                          <div>
                            <p className="booking-label">CAR HIRE REFERENCE</p>
                            <h3 className="booking-reference">
                              {getBookingReference(booking.id, 'FH-CH')}
                            </h3>
                          </div>

                          <span className={`status-badge ${getStatusClass(booking.status)}`}>
                            {formatStatus(booking.status)}
                          </span>
                        </div>

                        <div className="booking-details">
                          <div className="booking-detail">
                            <span className="detail-icon">🚘</span>
                            <div>
                              <small>Requested vehicle</small>
                              <strong>{booking.vehicle_type || 'Not provided'}</strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">📅</span>
                            <div>
                              <small>Booking date</small>
                              <strong>{formatDate(booking.booking_date)}</strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">🗓️</span>
                            <div>
                              <small>Hire duration</small>
                              <strong>
                                {booking.number_of_days
                                  ? `${booking.number_of_days} day(s)`
                                  : 'Not provided'}
                              </strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">📍</span>
                            <div>
                              <small>Pickup address</small>
                              <strong>{booking.pickup_address || 'Not provided'}</strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">🏁</span>
                            <div>
                              <small>Destination</small>
                              <strong>{booking.destination || 'Not provided'}</strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">🧭</span>
                            <div>
                              <small>Travel scope</small>
                              <strong>{booking.travel_scope || 'Not provided'}</strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">📌</span>
                            <div>
                              <small>Service area</small>
                              <strong>{booking.service_area || 'Not provided'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="car-hire-assignment">
                          <h4>Vehicle assignment</h4>
                          {vehicle ? (
                            <p>
                              <strong>{vehicle.make_model || 'Vehicle'}</strong>
                              {' · '}
                              {vehicle.registration_number || 'Registration unavailable'}
                            </p>
                          ) : (
                            <p>Vehicle not yet assigned.</p>
                          )}

                          <h4>Driver assignment</h4>
                          {driver ? (
                            <>
                              <p>
                                <strong>
                                  {driver.full_name || driver.name || 'Assigned driver'}
                                </strong>
                              </p>
                              <p>{driver.phone || 'Phone number unavailable'}</p>
                            </>
                          ) : (
                            <p>Driver not yet assigned.</p>
                          )}
                        </div>

                        <div className="booking-details">
                          <div className="booking-detail">
                            <span className="detail-icon">💰</span>
                            <div>
                              <small>Estimated fare</small>
                              <strong>{formatMoney(booking.estimated_fare)}</strong>
                            </div>
                          </div>

                          <div className="booking-detail">
                            <span className="detail-icon">💳</span>
                            <div>
                              <small>Final fare</small>
                              <strong>{formatMoney(booking.final_fare)}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="booking-card-footer">
                          <span>
                            Reference: {getBookingReference(booking.id, 'FH-CH')}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>

      <footer className="bookings-footer">
        <p>
          Fheety<span>Mobile</span> · Making every journey easier to plan.
        </p>
      </footer>
    </main>
  )
}
