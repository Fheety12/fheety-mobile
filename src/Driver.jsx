
import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Driver() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [driver, setDriver] = useState(null)

  async function signIn(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('drivers')
      .select('id, full_name, is_active')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (profileError || !profile || !profile.is_active) {
      await supabase.auth.signOut()
      setMessage('This account is not authorized as an active driver.')
      setLoading(false)
      return
    }

    setDriver(profile)
    setMessage('')
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setDriver(null)
    setEmail('')
    setPassword('')
    setMessage('You have signed out.')
  }

  return (
    <main style={{
      maxWidth: '480px',
      margin: '60px auto',
      padding: '24px',
      color: '#f8fafc',
      background: '#0f172a',
      borderRadius: '16px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1>Fheety Mobile Driver</h1>
      <p>Sign in to access your driver account.</p>

      {driver ? (
        <>
          <h2>Welcome, {driver.full_name}</h2>
          <p>Driver account verified.</p>
          <p>Ride tracking will be enabled after a ride is assigned.</p>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <form onSubmit={signIn}>
          <label htmlFor="driver-email">Email</label>
          <input
            id="driver-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            style={{ display: 'block', width: '100%', padding: '12px', margin: '8px 0 16px', boxSizing: 'border-box' }}
          />

          <label htmlFor="driver-password">Password</label>
          <input
            id="driver-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            style={{ display: 'block', width: '100%', padding: '12px', margin: '8px 0 16px', boxSizing: 'border-box' }}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Driver sign in'}
          </button>
        </form>
      )}

      {message && <p role="status">{message}</p>}
    </main>
  )
}
