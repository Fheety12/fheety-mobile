
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function VehicleAdmin() {
  const [vehicles, setVehicles] = useState([])
  const [vehicleType, setVehicleType] = useState('')
  const [makeModel, setMakeModel] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadVehicles() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setVehicles(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  async function addVehicle(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const { error } = await supabase
      .from('vehicles')
      .insert([{
        vehicle_type: vehicleType.trim(),
        make_model: makeModel.trim(),
        registration_number: registrationNumber.trim(),
        is_active: true
      }])

    if (error) {
      setError(error.message)
    } else {
      setMessage('Vehicle registered successfully!')
      setVehicleType('')
      setMakeModel('')
      setRegistrationNumber('')
      await loadVehicles()
    }

    setSaving(false)
  }

  async function toggleVehicle(vehicle) {
    setError('')
    setMessage('')

    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: !vehicle.is_active })
      .eq('id', vehicle.id)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Vehicle status updated.')
      await loadVehicles()
    }
  }

  return (
    <section className="admin-bookings-panel admin-vehicles-panel">
      <div className="admin-bookings-header">
        <div>
          <h2>Vehicle Management</h2>
          <p>Register vehicles and manage their availability.</p>
        </div>

        <button
          type="button"
          className="admin-refresh"
          onClick={loadVehicles}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh vehicles'}
        </button>
      </div>

      <div className="admin-driver-summary">
        <div>
          <strong>{vehicles.length}</strong>
          <span>Total vehicles</span>
        </div>

        <div>
          <strong>{vehicles.filter(v => v.is_active).length}</strong>
          <span>Active vehicles</span>
        </div>
      </div>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <form className="admin-driver-form" onSubmit={addVehicle}>
        <h3>Register a new vehicle</h3>

        <div className="admin-driver-form-grid">
          <div>
            <label className="admin-label">Vehicle type</label>
            <input
              className="admin-input"
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              placeholder="e.g. SUV, Sedan, Bus"
              required
            />
          </div>

          <div>
            <label className="admin-label">Make and model</label>
            <input
              className="admin-input"
              value={makeModel}
              onChange={e => setMakeModel(e.target.value)}
              placeholder="e.g. Toyota Highlander"
              required
            />
          </div>

          <div>
            <label className="admin-label">Registration number</label>
            <input
              className="admin-input"
              value={registrationNumber}
              onChange={e => setRegistrationNumber(e.target.value)}
              placeholder="e.g. ABC-123-XY"
              required
            />
          </div>
        </div>

        <button
          className="admin-primary-button admin-driver-submit"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Registering...' : '+ Register vehicle'}
        </button>
      </form>

      <div className="admin-driver-list">
        <h3>Registered vehicles</h3>

        {loading && <p className="admin-loading">Loading vehicles...</p>}

        {!loading && vehicles.length === 0 && (
          <div className="admin-empty">
            <h3>No vehicles registered yet</h3>
            <p>Use the form above to register your first vehicle.</p>
          </div>
        )}

        {vehicles.map(vehicle => (
          <div className="admin-driver-card" key={vehicle.id}>
            <div>
              <h4>{vehicle.make_model}</h4>
              <p>Type: {vehicle.vehicle_type}</p>
              <p>Registration: {vehicle.registration_number}</p>

              <span className={
                vehicle.is_active
                  ? 'admin-driver-active'
                  : 'admin-driver-inactive'
              }>
                {vehicle.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <button
              type="button"
              className="admin-refresh"
              onClick={() => toggleVehicle(vehicle)}
            >
              {vehicle.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
