
import { useState } from 'react'
import { supabase } from './supabaseClient'
import Navbar from './components/navbar.jsx'

function CarHire() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [travelScope, setTravelScope] = useState('within_lagos')
  const [bookingFor, setBookingFor] = useState('myself')

  const today = new Date()
  const minimumDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10)

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setMessageType('')

    const form = event.currentTarget
    const data = new FormData(form)

    const hireBooking = {
      customer_name: data.get('customer_name')?.trim(),
      customer_email: data.get('customer_email')?.trim(),
      customer_phone: data.get('customer_phone')?.trim(),

      vehicle_type: data.get('vehicle_type'),
      booking_date: data.get('booking_date'),
      number_of_days: Number(data.get('number_of_days')),

      travel_scope: data.get('travel_scope'),
      service_area:
        data.get('travel_scope') === 'within_lagos'
          ? data.get('service_area')
          : null,

      booking_for: data.get('booking_for'),
      journey_arrangement: data.get('journey_arrangement'),

      pickup_address: data.get('pickup_address')?.trim(),
      destination: data.get('destination')?.trim(),

      passenger_name:
        data.get('booking_for') === 'someone_else'
          ? data.get('passenger_name')?.trim()
          : null,

      passenger_phone:
        data.get('booking_for') === 'someone_else'
          ? data.get('passenger_phone')?.trim()
          : null,

      trip_details: data.get('trip_details')?.trim() || null,

      status:
        data.get('travel_scope') === 'outside_lagos'
          ? 'under_review'
          : 'pending',
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

      hireBooking.user_id = user?.id ?? null

      const { error } = await supabase
        .from('car_hire_bookings')
        .insert([hireBooking])

      if (error) throw error

      setMessage(
        hireBooking.travel_scope === 'outside_lagos'
          ? 'Your outside-Lagos request has been submitted for special review. Our team will contact you.'
          : 'Your car-hire request has been submitted successfully. Our team will contact you.'
      )

      setMessageType('success')
      form.reset()
      setTravelScope('within_lagos')
      setBookingFor('myself')
    } catch (error) {
      console.error('Car hire booking error:', error)

      setMessage(
        error?.message
          ? `Booking failed: ${error.message}`
          : 'Your request could not be submitted. Please try again.'
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
        <section className="booking-section">
          <div className="section-heading">
            <p className="eyebrow">PREMIUM CHAUFFEUR SERVICE</p>
            <h2>Hire a Car with a Driver</h2>
            <p>
              Book a dedicated vehicle and professional driver
              for the number of days you need.
            </p>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <h3>Customer Information</h3>

            <label>
              Full name
              <input
                name="customer_name"
                type="text"
                placeholder="Your full name"
                required
              />
            </label>

            <label>
              Email address
              <input
                name="customer_email"
                type="email"
                placeholder="Your email address"
                required
              />
            </label>

            <label>
              Phone number
              <input
                name="customer_phone"
                type="tel"
                placeholder="Your phone number"
                required
              />
            </label>

            <h3>Vehicle Selection</h3>

            <label>
              Choose your vehicle
              <select name="vehicle_type" required defaultValue="">
                <option value="" disabled>Select vehicle type</option>
                <option value="SUV">SUV</option>
                <option value="Saloon">Saloon car</option>
              </select>
            </label>

            <h3>Booking Duration</h3>

            <label>
              Booking start date
              <input
                type="date"
                name="booking_date"
                min={minimumDate}
                required
              />
            </label>

            <label>
              Number of days
              <input
                type="number"
                name="number_of_days"
                min="1"
                max="90"
                placeholder="e.g. 3"
                required
              />
            </label>

            <h3>Travel Location</h3>

            <label>
              Where will you be travelling?
              <select
                name="travel_scope"
                value={travelScope}
                onChange={(event) => setTravelScope(event.target.value)}
                required
              >
                <option value="within_lagos">Within Lagos</option>
                <option value="outside_lagos">Outside Lagos</option>
              </select>
            </label>

            {travelScope === 'within_lagos' && (
              <label>
                Lagos location
                <select name="service_area" required defaultValue="">
                  <option value="" disabled>Select area</option>
                  <option value="lagos_island">Lagos Island</option>
                  <option value="lagos_mainland">Lagos Mainland</option>
                </select>
              </label>
            )}

            {travelScope === 'outside_lagos' && (
              <div className="booking-note">
                <strong>Special travel request</strong>
                <p>
                  You can submit your request. Our team will
                  review the journey, vehicle availability and
                  pricing before confirming your booking.
                </p>
              </div>
            )}

            <h3>Who is this booking for?</h3>

            <label>
              Booking for
              <select
                name="booking_for"
                value={bookingFor}
                onChange={(event) => setBookingFor(event.target.value)}
                required
              >
                <option value="myself">Myself</option>
                <option value="someone_else">Someone else</option>
              </select>
            </label>

            {bookingFor === 'someone_else' && (
              <>
                <label>
                  Passenger's full name
                  <input
                    name="passenger_name"
                    type="text"
                    placeholder="Passenger's name"
                    required
                  />
                </label>

                <label>
                  Passenger's phone number
                  <input
                    name="passenger_phone"
                    type="tel"
                    placeholder="Passenger's phone number"
                    required
                  />
                </label>
              </>
            )}

            <h3>Journey Arrangements</h3>

            <label>
              What do you need?
              <select
                name="journey_arrangement"
                required
                defaultValue=""
              >
                <option value="" disabled>Select arrangement</option>
                <option value="pickup">Pickup</option>
                <option value="dropoff">Drop-off</option>
                <option value="pickup_and_dropoff">
                  Pickup and drop-off
                </option>
              </select>
            </label>

            <label>
              Pickup address
              <input
                name="pickup_address"
                type="text"
                placeholder="Enter pickup address"
                required
              />
            </label>

            <label>
              Destination / drop-off address
              <input
                name="destination"
                type="text"
                placeholder="Enter destination or drop-off address"
                required
              />
            </label>

            <label>
              Additional journey instructions
              <textarea
                name="trip_details"
                rows="4"
                placeholder="Tell us about your journey, extra stops or special arrangements..."
              />
            </label>

            <button
              type="submit"
              className="primary-btn booking-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Car Hire Request →'}
            </button>
          </form>

          {message && (
            <p
              role="status"
              aria-live="polite"
              style={{
                marginTop: '16px',
                color: messageType === 'success' ? 'green' : 'crimson',
                fontWeight: 600,
              }}
            >
              {message}
            </p>
          )}

          <p className="booking-note">
            Your request is subject to vehicle and driver availability.
            The same driver and vehicle will be assigned for your
            agreed hire period. Final pricing will be confirmed by
            Fheety Mobile.
          </p>
        </section>
      </main>
    </div>
  )
}

export default CarHire
