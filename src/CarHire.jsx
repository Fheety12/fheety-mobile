
import { useState } from 'react'
import { supabase } from './supabaseClient'
import Navbar from './components/navbar.jsx'

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi',
  'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
  'Federal Capital Territory (Abuja)',
]

// Actual MetroMovers SUV photographs
const suvPhotos = [
  { src: '/prado-front.jpg', alt: 'Toyota Prado front view' },
  { src: '/prado-second.jpg', alt: 'Toyota Prado second view' },
  { src: '/prado-third.jpg', alt: 'Toyota Prado third view' },
  { src: '/prado-four.jpg', alt: 'Toyota Prado fourth view' },
  { src: '/prado-fifth.jpg', alt: 'Toyota Prado fifth view' },
]

// Actual MetroMovers Saloon photographs
const saloonPhotos = [
  { src: '/saloon-car.jpg', alt: 'MetroMovers Saloon' },
  { src: '/saloon-second.jpg', alt: 'Saloon second view' },
]

function CarHire() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [travelScope, setTravelScope] = useState('within_lagos')
  const [bookingFor, setBookingFor] = useState('myself')
  const [journeyArrangement, setJourneyArrangement] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')

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
      service_area: data.get('service_area') || null,

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
          ? 'Your interstate request has been submitted for review. Our team will contact you.'
          : 'Your MetroMovers car-hire request has been submitted successfully. Our team will contact you.'
      )

      setMessageType('success')
      form.reset()
      setTravelScope('within_lagos')
      setBookingFor('myself')
      setJourneyArrangement('')
      setSelectedVehicle('')
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

  function selectVehicle(vehicle) {
    setSelectedVehicle(vehicle)

    document.getElementById('vehicle_type')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  return (
    <div className="app">
      <Navbar />

      <main>
        <section className="booking-section">
          <div className="section-heading">
            <p className="eyebrow">PREMIUM CHAUFFEUR SERVICE</p>
            <h2>MetroMovers Car Hire</h2>
            <p>
              Choose your vehicle and arrange comfortable travel
              with a professional driver.
            </p>
          </div>

          {/* VEHICLE GALLERY */}
          <div className="metro-vehicle-gallery">
            <h3>Choose Your MetroMovers Vehicle</h3>
            <p>Explore our available vehicle categories.</p>

            <div className="metro-vehicle-grid">
              <article className="metro-vehicle-card">
                <h4>Premium SUV – Toyota Prado</h4>

                <div className="metro-photo-grid">
                  {suvPhotos.map((photo) => (
                    <img
                      key={photo.src}
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => selectVehicle('SUV')}
                >
                  Select SUV
                </button>
              </article>

              <article className="metro-vehicle-card">
                <h4>Premium Saloon</h4>

                <div className="metro-photo-grid">
                  {saloonPhotos.map((photo) => (
                    <img
                      key={photo.src}
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => selectVehicle('Saloon')}
                >
                  Select Saloon
                </button>
              </article>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <h3>1. Customer Information</h3>

            <label>
              Full name
              <input
                name="customer_name"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </label>

            <label>
              Email address
              <input
                name="customer_email"
                type="email"
                placeholder="Your email address"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Phone number
              <input
                name="customer_phone"
                type="tel"
                placeholder="Your phone number"
                autoComplete="tel"
                required
              />
            </label>

            <h3>2. Choose Your Vehicle</h3>

            <label>
              Vehicle category
              <select
                id="vehicle_type"
                name="vehicle_type"
                required
                value={selectedVehicle}
                onChange={(event) =>
                  setSelectedVehicle(event.target.value)
                }
              >
                <option value="">Select vehicle</option>
                <option value="SUV">SUV</option>
                <option value="Saloon">Saloon</option>
              </select>
            </label>

            <h3>3. Choose Your Journey</h3>

            <label>
              Journey arrangement
              <select
                name="journey_arrangement"
                value={journeyArrangement}
                onChange={(event) => {
                  const value = event.target.value
                  setJourneyArrangement(value)

                  if (value === 'interstate') {
                    setTravelScope('outside_lagos')
                  } else if (value) {
                    setTravelScope('within_lagos')
                  }
                }}
                required
              >
                <option value="">Select journey type</option>
                <option value="airport_pickup">Airport pickup</option>
                <option value="airport_dropoff">Airport drop-off</option>
                <option value="full_day">Full-day hire (24 hours)</option>
                <option value="interstate">Interstate travel</option>
              </select>
            </label>

            <div className="booking-note">
              <strong>Full-day hire</strong>
              <p>
                One full day is 24 hours. Select the number of days
                you need the vehicle and driver.
              </p>
            </div>

            <h3>4. Booking Duration</h3>

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
                placeholder="e.g. 1"
                required
              />
            </label>

            <p className="booking-note">
              For full-day hire, each selected day represents
              24 hours of service. Airport and interstate requests
              will be reviewed by our team before confirmation.
            </p>

            <h3>5. Travel Location</h3>

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
                Lagos service area
                <select name="service_area" required defaultValue="">
                  <option value="" disabled>Select area</option>
                  <option value="lagos_island">Lagos Island</option>
                  <option value="lagos_mainland">Lagos Mainland</option>
                </select>
              </label>
            )}

            {travelScope === 'outside_lagos' && (
              <>
                <label>
                  Destination state
                  <select name="service_area" required defaultValue="">
                    <option value="" disabled>
                      Select destination state
                    </option>
                    {nigerianStates
                      .filter((state) => state !== 'Lagos')
                      .map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                  </select>
                </label>

                <div className="booking-note">
                  <strong>Interstate booking review</strong>
                  <p>
                    Our team will review your destination, vehicle
                    availability and journey details before confirming
                    the final price.
                  </p>
                </div>
              </>
            )}

            <h3>6. Passenger Information</h3>

            <label>
              Who is this booking for?
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

            <h3>7. Journey Details</h3>

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
                placeholder="Enter destination address"
                required
              />
            </label>

            <label>
              Additional journey instructions
              <textarea
                name="trip_details"
                rows="4"
                placeholder="Airport flight details, extra stops or other arrangements..."
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
            All requests are subject to vehicle and driver availability.
            Final pricing and arrangements will be confirmed by MetroMovers.
          </p>
        </section>
      </main>
    </div>
  )
}

export default CarHire
