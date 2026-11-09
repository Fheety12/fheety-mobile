
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import Admin from './Admin.jsx'
import CustomerAuth from './CustomerAuth.jsx'
import CustomerBookings from './CustomerBookings.jsx'
import Navbar from './components/navbar.jsx'
import Driver from './Driver.jsx'
import CarHire from './CarHire.jsx'

// MetroMovers actual vehicle photographs
const vehicles = [
  {
    name: 'SUV',
    category: 'SUV',
    description:
      'Toyota Prado SUV for executive travel, family journeys and airport transfers.',
    image: '/prado-front.jpg',
  },
  {
    name: 'Saloon',
    category: 'Saloon',
    description:
      'Comfortable saloon car for business trips and personal journeys.',
    image: '/saloon-car.jpg',
  },
]

function App() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [messageType, setMessageType] = useState('')

  const pathname = window.location.pathname

  if (pathname === '/admin') return <Admin />
  if (pathname === '/account') return <CustomerAuth />
  if (pathname === '/my-bookings') return <CustomerBookings />
  if (pathname === '/driver') return <Driver />
  if (pathname === '/hire-a-car') return <CarHire />

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
      vehicle_type: formData.get('vehicle_type'),
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

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

      if (error) throw error

      setMessage(
        'Your MetroMovers booking request was submitted successfully!'
      )
      setMessageType('success')
      form.reset()
      setSelectedVehicle('')
    } catch (error) {
      console.error('Booking error:', error)

      setMessage(
        error?.message
          ? `Booking failed: ${error.message}`
          : 'Booking could not be saved. Please try again.'
      )
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10)

  return (
    <div className="app">
      <Navbar />

      <main>
        {/* HERO */}
        <section className="hero-section" id="home">
          <div className="hero-content">
            <p className="eyebrow">
              YOUR JOURNEY, OUR PRIORITY
            </p>

            <h1>
              Move smarter.
              <br />
              Travel <span>better.</span>
            </h1>

            <p className="hero-description">
              From airport transfers to everyday journeys and
              interstate travel, MetroMovers makes every trip
              comfortable, convenient and easy to arrange.
            </p>

            <div className="hero-actions">
              <a className="primary-btn" href="#book">
                Book a Ride →
              </a>

              <a className="secondary-btn" href="#vehicles">
                Explore Vehicles
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>Airport</strong>
                <span>Transfers</span>
              </div>

              <div>
                <strong>Full-Day</strong>
                <span>Car Hire</span>
              </div>

              <div>
                <strong>Interstate</strong>
                <span>Journeys</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-car-image"
              src="/prado-front.jpg"
              alt="MetroMovers Toyota Prado SUV"
            />
          </div>
        </section>

        {/* SERVICES */}
        <section className="how-section" id="services">
          <div className="section-heading">
            <p className="eyebrow">OUR SERVICES</p>
            <h2>Travel your way with MetroMovers</h2>
            <p>
              Transportation solutions designed around your journey.
            </p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">01</div>
              <h3>Airport Transfers</h3>
              <p>
                Convenient airport pickup and drop-off services
                for your arrival and departure.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">02</div>
              <h3>Full-Day Service</h3>
              <p>
                Arrange a vehicle and driver for your personal
                or business activities throughout the day.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">03</div>
              <h3>Interstate Travel</h3>
              <p>
                Plan journeys between Lagos and other states
                across Nigeria.
              </p>
            </article>
          </div>
        </section>

        {/* VEHICLE GALLERY */}
        <section className="vehicle-section" id="vehicles">
          <div className="section-heading">
            <p className="eyebrow">OUR VEHICLES</p>
            <h2>Find a vehicle for your journey</h2>
            <p>
              Explore our available SUV and Saloon vehicles.
            </p>
          </div>

          <div className="vehicle-grid">
            {vehicles.map((vehicle) => (
              <article
                className="vehicle-card"
                key={vehicle.name}
              >
                <div className="vehicle-image-wrapper">
                  <img
                    src={vehicle.image}
                    alt={`MetroMovers ${vehicle.name}`}
                    className="vehicle-image"
                    loading="lazy"
                  />
                </div>

                <div className="vehicle-card-content">
                  <span className="vehicle-category">
                    {vehicle.category}
                  </span>

                  <h3>{vehicle.name}</h3>

                  <p>{vehicle.description}</p>

                  <a
                    href="#book"
                    className="primary-btn vehicle-btn"
                    onClick={() =>
                      setSelectedVehicle(vehicle.name)
                    }
                  >
                    Select This Vehicle →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* BOOKING */}
        <section className="booking-section" id="book">
          <div className="section-heading">
            <p className="eyebrow">PLAN YOUR JOURNEY</p>
            <h2>Book with MetroMovers</h2>
            <p>
              Enter your details and submit your transportation request.
            </p>
          </div>

          <form className="booking-form" onSubmit={handleBooking}>
            <label>
              Full name
              <input
                type="text"
                name="customer_name"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                name="customer_email"
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Phone number
              <input
                type="tel"
                name="customer_phone"
                placeholder="Enter your phone number"
                autoComplete="tel"
                required
              />
            </label>

            <label>
              Select your vehicle
              <select
                name="vehicle_type"
                value={selectedVehicle}
                onChange={(event) =>
                  setSelectedVehicle(event.target.value)
                }
                required
              >
                <option value="">Choose a vehicle</option>

                {vehicles.map((vehicle) => (
                  <option
                    key={vehicle.name}
                    value={vehicle.name}
                  >
                    {vehicle.name}
                  </option>
                ))}
              </select>
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
                min={today}
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
            Our team will follow up to confirm your arrangements.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">SIMPLE AND CONVENIENT</p>
            <h2>How MetroMovers works</h2>
            <p>Three simple steps to arrange your journey.</p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <div className="step-number">01</div>
              <h3>Choose your journey</h3>
              <p>
                Enter your pickup location, destination,
                preferred date and time.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">02</div>
              <h3>Submit your request</h3>
              <p>
                Send your booking request to the MetroMovers team
                for confirmation.
              </p>
            </article>

            <article className="step-card">
              <div className="step-number">03</div>
              <h3>Get ready to travel</h3>
              <p>
                Receive booking updates and arrange your journey
                with our team.
              </p>
            </article>
          </div>
        </section>

        {/* CONTACT */}
        <section className="booking-section" id="contact">
          <div className="section-heading">
            <p className="eyebrow">WE ARE HERE TO HELP</p>
            <h2>Contact MetroMovers</h2>
            <p>
              Have a question about a journey or vehicle hire?
              Our team will be happy to assist.
            </p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <h3>Phone and WhatsApp</h3>
              <p>
                Company contact number will be added after confirmation.
              </p>
            </article>

            <article className="step-card">
              <h3>Email</h3>
              <p>
                Official MetroMovers email will be added after confirmation.
              </p>
            </article>

            <article className="step-card">
              <h3>Office address</h3>
              <p>
                Company address will be added after confirmation.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <a className="logo" href="#home">
          Metro<span>Movers</span>
        </a>

        <p>
          <a href="/driver">Driver Login</a>
        </p>

        <p>
          <a href="/hire-a-car">Hire a Car</a>
        </p>

        <p>Reliable journeys. Comfortable travel.</p>

        <p>
          © {new Date().getFullYear()} MetroMovers.
          All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default App
