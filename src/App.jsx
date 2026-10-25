
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import Admin from './Admin.jsx'
import CustomerAuth from './CustomerAuth.jsx'
import CustomerBookings from './CustomerBookings.jsx'
import Navbar from './components/navbar.jsx'

function App() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const pathname = window.location.pathname

  if (pathname === '/admin') {
    return <Admin />
  }

  if (pathname === '/account') {
    return <CustomerAuth />
  }

  if (pathname === '/my-bookings') {
    return <CustomerBookings />
  }

  async function handleBooking(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setMessageType('')

    const form = event.currentTarget
    const formData = new FormData(form)

    const booking = {
      customer_name: formData.get('customer_name'),
      customer_email: formData.get('customer_email'),
      customer_phone: formData.get('customer_phone'),
      pickup_location: formData.get('pickup_location'),
      destination: formData.get('destination'),
      travel_date: formData.get('travel_date'),
      pickup_time: formData.get('pickup_time'),
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      // Allow guests to book without signing in.
      if (
        userError &&
        userError.name !== 'AuthSessionMissingError'
      ) {
        throw userError
      }

      const bookingWithUser = {
        ...booking,
        user_id: user?.id ?? null,
      }

      const { error } = await supabase
        .from('bookings')
        .insert([bookingWithUser])

      if (error) {
        throw error
      }

      setMessage('Booking request submitted successfully!')
      setMessageType('success')
      form.reset()
    } catch (error) {
      console.error('Booking error:', error)

      setMessage(
        error?.message
          ? `Booking failed: ${error.message}`
          : 'Booking could not be saved. Please check your connection and try again.'
      )
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="hero-section" id="home">
          <div className="hero-content">
            <p className="eyebrow">YOUR JOURNEY, YOUR WAY</p>

            <h1>
              Move smarter.
              <br />
              Travel <span>better.</span>
            </h1>

            <p className="hero-description">
              Book your ride ahead of time and travel with confidence.
              Fheety Mobile makes planning your next journey simple.
            </p>

            <div className="hero-actions">
              <a className="primary-btn" href="#book">
                Book a Ride →
              </a>

              <a className="secondary-btn" href="#how-it-works">
                How it works
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>Easy</strong>
                <span>Ride booking</span>
              </div>

              <div>
                <strong>Planned</strong>
                <span>Journeys</span>
              </div>

              <div>
                <strong>Simple</strong>
                <span>Experience</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-car-image"
              src="/fheety-luxury-black-car-hero.png"
              alt="Luxury black car on a city street at night"
            />
          </div>
        </section>

        <section className="booking-section" id="book">
          <div className="section-heading">
            <p className="eyebrow">PLAN YOUR JOURNEY</p>
            <h2>Book your next ride</h2>
            <p>Enter your trip details to get started.</p>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <label>
              Full name
              <input
                type="text"
                name="customer_name"
                placeholder="Enter your full name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                name="customer_email"
                placeholder="Enter your email address"
                required
              />
            </label>

            <label>
              Phone number
              <input
                type="tel"
                name="customer_phone"
                placeholder="Enter your phone number"
                required
              />
            </label>

            <label>
              Pickup location
              <input
                type="text"
                name="pickup_location"
                placeholder="Enter pickup address"
                required
              />
            </label>

            <label>
              Destination
              <input
                type="text"
                name="destination"
                placeholder="Where are you going?"
                required
              />
            </label>

            <label>
              Travel date
              <input
                type="date"
                name="travel_date"
                min={
                  new Date(
                    Date.now() -
                      new Date().getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .slice(0, 10)
                }
                required
              />
            </label>

            <label>
              Pickup time
              <input
                type="time"
                name="pickup_time"
                required
              />
            </label>

            <button
              type="submit"
              className="primary-btn booking-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Booking →'}
            </button>
          </form>

          {message && (
            <p
              role="status"
              aria-live="polite"
              style={{
                marginTop: '16px',
                color:
                  messageType === 'success'
                    ? 'green'
                    : 'crimson',
                fontWeight: 600,
              }}
            >
              {message}
            </p>
          )}

          <p className="booking-note">
            Your journey details will be submitted as a booking request.
            Driver confirmation and live vehicle tracking are future features.
          </p>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">SIMPLE AND CONVENIENT</p>
            <h2>How Fheety Mobile works</h2>
            <p>Three simple steps to plan your journey.</p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">01</div>
              <h3>Enter your trip</h3>
              <p>
                Choose your pickup location, destination, date and time.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">02</div>
              <h3>Arrange your ride</h3>
              <p>
                Submit your request so your journey can be arranged.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">03</div>
              <h3>Travel with ease</h3>
              <p>
                Driver updates and vehicle tracking will be added
                as we develop the platform.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <a className="logo" href="#home">
          Fheety<span>Mobile</span>
        </a>

        <p>Making every journey easier to plan.</p>

        <p>
          © {new Date().getFullYear()} Fheety Mobile. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default App
