
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './Admin.css'

// Generate a short reference for each booking.
function getBookingReference(booking) {
  if (!booking.id) return 'Reference unavailable'
  return `FH-${String(booking.id).slice(0, 8).toUpperCase()}`
}

// Format the date and time the booking was submitted.
function formatSubmittedDate(date) {
  if (!date) return 'Date unavailable'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable'
  }

  return parsedDate.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// Set the colour for each booking status.
function statusColor(status) {
  const colors = {
    pending: '#fbbf24',
    confirmed: '#60a5fa',
    completed: '#34d399',
    cancelled: '#fb7185',
  }

  return colors[(status || 'pending').toLowerCase()] || '#cbd5e1'
}

export default function Admin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setBookingsError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      setMessage(error?.message || 'Login failed.')
      setLoading(false)
      return
    }

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (adminError || !admin) {
      await supabase.auth.signOut()

      setMessage(
        adminError
          ? adminError.message
          : 'This account is not authorized as an administrator.'
      )

      setLoading(false)
      return
    }

    setIsLoggedIn(true)
    setLoading(false)
  }

  async function loadBookings() {
    setBookingsLoading(true)
    setBookingsError('')
    setMessage('')

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setBookingsError(error.message)
      setBookings([])
    } else {
      setBookings(data || [])
    }

    setBookingsLoading(false)
  }

  async function updateBookingStatus(booking, newStatus) {
    if (!booking.id) {
      setBookingsError(
        'This booking has no ID, so it cannot be updated.'
      )
      return
    }

    if (newStatus === booking.status) return

    setUpdatingId(booking.id)
    setBookingsError('')
    setMessage('')

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id)
      .select()

    if (error) {
      setBookingsError(
        'Could not update booking: ' + error.message
      )
    } else if (!data || data.length === 0) {
      setBookingsError(
        'No booking was updated. Check the Supabase UPDATE and SELECT policies.'
      )
    } else {
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id
            ? { ...item, status: newStatus }
            : item
        )
      )

      setMessage('Booking status updated successfully.')
    }

    setUpdatingId(null)
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setMessage(error.message)
      return
    }

    setIsLoggedIn(false)
    setBookings([])
    setMessage('')
    setBookingsError('')
    setEmail('')
    setPassword('')
    setSearchTerm('')
    setStatusFilter('all')
  }

  const totalBookings = bookings.length

  const pendingBookings = bookings.filter(
    (booking) =>
      (booking.status || 'pending').toLowerCase() === 'pending'
  ).length

  const confirmedBookings = bookings.filter(
    (booking) =>
      (booking.status || '').toLowerCase() === 'confirmed'
  ).length

  const completedBookings = bookings.filter(
    (booking) =>
      (booking.status || '').toLowerCase() === 'completed'
  ).length

  const filteredBookings = bookings.filter((booking) => {
    const search = searchTerm.trim().toLowerCase()

    const matchesSearch =
      (booking.pickup_location || '').toLowerCase().includes(search) ||
      (booking.destination || '').toLowerCase().includes(search) ||
      (booking.customer_name || '').toLowerCase().includes(search) ||
      (booking.customer_email || '').toLowerCase().includes(search) ||
      (booking.customer_phone || '').toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'all' ||
      (booking.status || 'pending').toLowerCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  // Admin login screen.
  if (!isLoggedIn) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-logo">F</div>

          <p className="admin-brand">FHEETYMOBILE</p>
          <h1>Admin sign in</h1>

          <p className="admin-login-description">
            Sign in securely to manage your ride bookings.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label className="admin-label" htmlFor="admin-email">
              Email address
            </label>

            <input
              className="admin-input"
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              placeholder="Enter your admin email"
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>

            <input
              className="admin-input"
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <button
            className="admin-login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in to dashboard →'}
          </button>

          {message && (
            <p
              className="admin-error"
              role="alert"
              style={{ marginTop: 18 }}
            >
              {message}
            </p>
          )}
        </form>
      </main>
    )
  }

  const stats = [
    {
      title: 'Total bookings',
      count: totalBookings,
      symbol: '▦',
      color: '#60a5fa',
    },
    {
      title: 'Pending',
      count: pendingBookings,
      symbol: '◷',
      color: '#fbbf24',
    },
    {
      title: 'Confirmed',
      count: confirmedBookings,
      symbol: '✓',
      color: '#34d399',
    },
    {
      title: 'Completed',
      count: completedBookings,
      symbol: '★',
      color: '#c4b5fd',
    },
  ]

  // Admin dashboard.
  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div className="admin-header-brand">
            <div className="admin-header-logo">F</div>

            <div>
              <h2 className="admin-header-title">Fheety Mobile</h2>
              <p className="admin-header-subtitle">
                ADMINISTRATION PORTAL
              </p>
            </div>
          </div>

          <button
            className="admin-signout"
            onClick={handleSignOut}
          >
            ↪ Sign out
          </button>
        </header>

        <section className="admin-overview">
          <p className="admin-eyebrow">OVERVIEW</p>
          <h1>Admin dashboard</h1>

          <p>
            Welcome back. Here&apos;s what&apos;s happening with your ride
            bookings.
          </p>
        </section>

        <section className="admin-stats">
          {stats.map((stat) => (
            <article className="admin-stat" key={stat.title}>
              <div className="admin-stat-top">
                <span className="admin-stat-title">
                  {stat.title}
                </span>

                <span
                  className="admin-stat-icon"
                  style={{ color: stat.color }}
                >
                  {stat.symbol}
                </span>
              </div>

              <h2 className="admin-stat-number">
                {stat.count}
              </h2>

              <p className="admin-stat-description">
                Current loaded bookings
              </p>
            </article>
          ))}
        </section>

        <section className="admin-bookings-panel">
          <div className="admin-bookings-header">
            <div>
              <h2>Ride bookings</h2>
              <p>
                Review customer requests and manage booking statuses.
              </p>
            </div>

            <button
              className="admin-refresh"
              onClick={loadBookings}
              disabled={bookingsLoading}
            >
              {bookingsLoading
                ? 'Loading...'
                : '↻ Refresh bookings'}
            </button>
          </div>

          <div className="admin-filters">
            <input
              className="admin-input admin-search"
              type="search"
              placeholder="Search customers, pickup or destination..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search bookings or customers"
            />

            <select
              className="admin-select admin-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter bookings by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        {message && (
          <p className="admin-success" role="status">
            {message}
          </p>
        )}

        {bookingsError && (
          <p className="admin-error" role="alert">
            {bookingsError}
          </p>
        )}

        {bookingsLoading && (
          <p className="admin-loading">
            Loading bookings from Supabase...
          </p>
        )}

        {!bookingsLoading && filteredBookings.length === 0 && (
          <section className="admin-empty">
            <div className="admin-empty-icon">▦</div>

            <h3>
              {bookings.length === 0
                ? 'No bookings loaded yet'
                : 'No matching bookings'}
            </h3>

            <p>
              {bookings.length === 0
                ? 'Click Refresh bookings to load requests from your database.'
                : 'Try another search term or status filter.'}
            </p>
          </section>
        )}

        <section className="admin-booking-grid">
          {filteredBookings.map((booking, index) => (
            <article
              className="admin-booking-card"
              key={booking.id ?? index}
            >
              <div className="admin-booking-header">
                <div>
                  <p className="admin-booking-label">
                    BOOKING REQUEST
                  </p>

                  <h3 className="admin-booking-title">
                    {getBookingReference(booking)}
                  </h3>

                  <p className="admin-submitted-date">
                    Submitted: {formatSubmittedDate(booking.created_at)}
                  </p>
                </div>

                <span
                  className="admin-status-badge"
                  style={{
                    color: statusColor(booking.status),
                    background: '#0b1325',
                    border: `1px solid ${statusColor(booking.status)}55`,
                  }}
                >
                  {booking.status || 'pending'}
                </span>
              </div>

              <div style={{ marginTop: 18 }}>
                <p className="admin-section-label">
                  CUSTOMER INFORMATION
                </p>

                <div className="admin-customer-section">
                  <p>
                    <strong>Name:</strong>{' '}
                    {booking.customer_name || 'Not provided'}
                  </p>

                  <p>
                    <strong>Email:</strong>{' '}
                    {booking.customer_email || 'Not provided'}
                  </p>

                  <p>
                    <strong>Phone:</strong>{' '}
                    {booking.customer_phone || 'Not provided'}
                  </p>

                  <p>
                    <strong>Account:</strong>{' '}
                    {booking.user_id
                      ? 'Registered customer'
                      : 'Guest booking'}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <p className="admin-section-label">
                  JOURNEY DETAILS
                </p>

                <div className="admin-journey">
                  <div className="admin-route-line">
                    <span className="pickup-dot">●</span>
                    <div className="line" />
                    <span className="destination-dot">●</span>
                  </div>

                  <div className="admin-journey-content">
                    <p className="admin-location-label">
                      PICKUP LOCATION
                    </p>

                    <p className="admin-location">
                      {booking.pickup_location || 'Not provided'}
                    </p>

                    <p className="admin-location-label">
                      DESTINATION
                    </p>

                    <p className="admin-location">
                      {booking.destination || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-date-section">
                <div>
                  <p className="admin-section-label">TRAVEL DATE</p>
                  <p className="admin-date-value">
                    {booking.travel_date || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="admin-section-label">PICKUP TIME</p>
                  <p className="admin-date-value">
                    {booking.pickup_time || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="admin-status-control">
                <label
                  className="admin-label"
                  htmlFor={`status-${booking.id}`}
                >
                  Update booking status
                </label>

                <select
                  className="admin-select"
                  id={`status-${booking.id}`}
                  value={(booking.status || 'pending').toLowerCase()}
                  disabled={updatingId === booking.id}
                  onChange={(event) =>
                    updateBookingStatus(booking, event.target.value)
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {updatingId === booking.id && (
                  <p className="admin-status-saving">
                    Saving status...
                  </p>
                )}
              </div>
            </article>
          ))}
        </section>

        <footer className="admin-footer">
          Fheety Mobile · Admin Dashboard
        </footer>
      </div>
    </main>
  )
}
