
import { useState } from 'react'
import { supabase } from './supabaseClient'
import './CustomerAuth.css'

export default function CustomerAuth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) throw error

        setMessage(
          data.session
            ? 'Account created successfully. You are signed in!'
            : 'Account created. Check your email to confirm your account, then log in.'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error

        setMessage('Login successful! You can now make bookings.')
      }
    } catch (error) {
      setMessage(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setMessage('You have signed out.')
    } catch (error) {
      setMessage(error.message || 'Sign out failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'signup' ? 'login' : 'signup'))
    setMessage('')
    setPassword('')
  }

  return (
    <main className="customer-auth-page">
      <a className="auth-brand" href="/">
        Fheety<span>Mobile</span>
      </a>

      <section className="customer-auth">
        <div className="auth-icon" aria-hidden="true">
          🚘
        </div>

        <p className="auth-eyebrow">YOUR JOURNEY STARTS HERE</p>

        <h1>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>

        <p className="auth-description">
          {mode === 'signup'
            ? 'Join Fheety Mobile and make planning your journeys easier.'
            : 'Log in to access your account and manage your journeys.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="customer-email">Email address</label>
          <input
            id="customer-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="customer-password">Password</label>
          <input
            id="customer-password"
            type="password"
            autoComplete={
              mode === 'signup' ? 'new-password' : 'current-password'
            }
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create Account →'
                : 'Log In →'}
          </button>
        </form>

        {message && (
          <p
            className="auth-message"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          className="auth-switch"
          type="button"
          disabled={loading}
          onClick={toggleMode}
        >
          {mode === 'signup'
            ? 'Already registered? Log in'
            : 'New customer? Create an account'}
        </button>

        <button
          className="auth-logout"
          type="button"
          disabled={loading}
          onClick={handleLogout}
        >
          Sign out
        </button>

        <a className="auth-home-link" href="/">
          ← Back to homepage
        </a>
      </section>

      <p className="auth-footer">
        © {new Date().getFullYear()} Fheety Mobile. All rights reserved.
      </p>
    </main>
  )
}
