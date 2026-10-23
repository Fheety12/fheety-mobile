import { useState } from 'react'
import { supabase } from './supabaseClient'

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
      setBookingsError('This booking has no ID, so it cannot be updated.')
      return
    }

    setUpdatingId(booking.id)
    setBookingsError('')
    setMessage('')

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', booking.id)
      .select()

    if (error) {
      setBookingsError('Could not update booking: ' + error.message)
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
    setEmail('')
    setPassword('')
  }

  const totalBookings = bookings.length

  const pendingBookings = bookings.filter(
    (booking) => booking.status === 'pending'
  ).length

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === 'confirmed'
  ).length

  const completedBookings = bookings.filter(
    (booking) => booking.status === 'completed'
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

  if (!isLoggedIn) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f1f5f9',
          padding: '24px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            maxWidth: '400px',
            boxSizing: 'border-box',
            background: '#fff',
            padding: '32px',
            borderRadius: '16px',
          }}
        >
          <h1>Fheety Mobile</h1>
          <p>Administrator Login</p>

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px',
              margin: '8px 0 18px',
            }}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px',
              margin: '8px 0 20px',
            }}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {message && <p style={{ color: 'red' }}>{message}</p>}
        </form>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f1f5f9',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Fheety Mobile Admin Dashboard</h1>
      <p>Welcome, Administrator!</p>

      {/* Dashboard Statistics */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginTop: '24px',
          marginBottom: '24px',
        }}
      >
        {[
          { title: 'Total Bookings', count: totalBookings },
          { title: 'Pending', count: pendingBookings },
          { title: 'Confirmed', count: confirmedBookings },
          { title: 'Completed', count: completedBookings },
        ].map((stat) => (
          <div
            key={stat.title}
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
            }}
          >
            <p>{stat.title}</p>
            <h2>{stat.count}</h2>
          </div>
        ))}
      </section>

      <button onClick={loadBookings} disabled={bookingsLoading}>
        {bookingsLoading ? 'Loading bookings...' : 'Refresh Bookings'}
      </button>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '20px',
          marginBottom: '20px',
        }}
      >
        <input
          type="search"
          placeholder="Search bookings or customers..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search bookings or customers"
          style={{
            padding: '12px',
            width: '280px',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter bookings by status"
          style={{ padding: '12px' }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button onClick={handleSignOut}>Sign out</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}

      {bookingsError && (
        <p style={{ color: '#b91c1c' }}>{bookingsError}</p>
      )}

      {!bookingsLoading && filteredBookings.length === 0 && (
        <p>
          {bookings.length === 0
            ? 'No bookings loaded yet. Click Refresh Bookings to check.'
            : 'No bookings match your search or selected filter.'}
        </p>
      )}

      {filteredBookings.map((booking, index) => (
        <section
          key={booking.id ?? index}
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            padding: '16px',
            marginTop: '16px',
            borderRadius: '8px',
          }}
        >
          <h3>Booking {index + 1}</h3>

          {/* Customer Information — displayed once */}
          <div
            style={{
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <h4>Customer Information</h4>

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
              <strong>Booking type:</strong>{' '}
              {booking.user_id ? 'Registered customer' : 'Guest booking'}
            </p>
          </div>

          <p>
            <strong>Pickup:</strong>{' '}
            {booking.pickup_location ?? 'Not provided'}
          </p>

          <p>
            <strong>Destination:</strong>{' '}
            {booking.destination ?? 'Not provided'}
          </p>

          <p>
            <strong>Date:</strong>{' '}
            {booking.travel_date ?? 'Not provided'}
          </p>

          <p>
            <strong>Time:</strong>{' '}
            {booking.pickup_time ?? 'Not provided'}
          </p>

          <p>
            <strong>Status:</strong>{' '}
            {booking.status ?? 'Not provided'}
          </p>

          <label htmlFor={`status-${booking.id}`}>
            Change booking status:
          </label>

          <select
            id={`status-${booking.id}`}
            value={booking.status || 'pending'}
            disabled={updatingId === booking.id}
            onChange={(event) =>
              updateBookingStatus(booking, event.target.value)
            }
            style={{
              display: 'block',
              padding: '10px',
              marginTop: '8px',
              marginBottom: '8px',
            }}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {updatingId === booking.id && <p>Updating status...</p>}
        </section>
      ))}
    </main>
  )
}
