import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './CustomerBookings.css'

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

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
        setCustomerEmail('')
        setMessage('Please log in to view your bookings.')
        return
      }

      setCustomerEmail(user.email || '')

      const { data: rows, error: bookingError } = await supabase
        .from('bookings')
        .select(
          'id, pickup_location, destination, travel_date, pickup_time, status, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (bookingError) throw bookingError

      setBookings(rows || [])
    } catch (error) {
      console.error('Booking history error:', error)
      setMessage('Unable to load bookings. Please try again.')
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

  function getStatusClass(status) {
    const normalizedStatus = (status || 'pending').toLowerCase()

    if (normalizedStatus === 'confirmed') {
      return 'status-confirmed'
    }

    if (normalizedStatus === 'cancelled') {
      return 'status-cancelled'
    }

    if (normalizedStatus === 'completed') {
      return 'status-completed'
    }

    return 'status-pending'
  }

  function formatStatus(status) {
    const value = status || 'pending'

    return value.charAt(0).toUpperCase() + value.slice(1)
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
            <span aria-hidden="true">↻</span>
            {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>

        {loading && (
          <div className="booking-state">
            <div className="loading-spinner" aria-hidden="true"></div>
            <p>Loading your bookings...</p>
          </div>
        )}

        {!loading && message && (
          <div className="booking-state booking-message" role="status">
            <div className="state-icon">!</div>
            <h2>Something went wrong</h2>
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

        {!loading && !message && bookings.length === 0 && (
          <div className="booking-state">
            <div className="state-icon">🚘</div>
            <h2>No bookings yet</h2>
            <p>
              You have not made any registered-customer bookings yet.
              Your future journeys will appear here.
            </p>

            <a className="book-ride-button" href="/#book">
              Book a Ride →
            </a>
          </div>
        )}

        {!loading && !message && bookings.length > 0 && (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card-top">
                  <div>
                    <p className="booking-label">JOURNEY</p>

                    <h2>
                      {booking.pickup_location}
                      <span> → </span>
                      {booking.destination}
                    </h2>
                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      booking.status
                    )}`}
                  >
                    {formatStatus(booking.status)}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="booking-detail">
                    <span className="detail-icon">📅</span>
                    <div>
                      <small>Travel date</small>
                      <strong>{booking.travel_date}</strong>
                    </div>
                  </div>

                  <div className="booking-detail">
                    <span className="detail-icon">🕐</span>
                    <div>
                      <small>Pickup time</small>
                      <strong>{booking.pickup_time}</strong>
                    </div>
                  </div>
                </div>

                <div className="booking-card-footer">
                  <span>
                    Booking ID: {booking.id.slice(0, 8)}
                  </span>

                  <span>
                    Status updates automatically
                  </span>
                </div>
              </article>
            ))}
          </div>
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