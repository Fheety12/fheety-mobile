import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './navbar.css'

export default function Navbar() {
  const [session, setSession] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted && !error) {
        setSession(data.session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert('Unable to sign out. Please try again.')
      return
    }

    setSession(null)
    closeMenu()
    window.location.href = '/'
  }

  return (
    <header className="site-navbar">
      <a className="site-logo" href="/" onClick={closeMenu}>
        Fheety<span>Mobile</span>
        <small>YOUR JOURNEY, SIMPLIFIED</small>
      </a>

      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <nav className={`site-nav-links ${menuOpen ? 'is-open' : ''}`}>
        <a href="/#home" onClick={closeMenu}>Home</a>
        <a href="/#book" onClick={closeMenu}>Book a Ride</a>
        <a href="/#how-it-works" onClick={closeMenu}>How It Works</a>
        <a href="/#contact" onClick={closeMenu}>Contact</a>

        {session ? (
          <>
            <a href="/my-bookings" onClick={closeMenu}>
              My Bookings
            </a>
            <button
              className="nav-account-btn"
              type="button"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        ) : (
          <a className="nav-account-btn" href="/account" onClick={closeMenu}>
            Login / Sign Up
          </a>
        )}
      </nav>
    </header>
  )
}