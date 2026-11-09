
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import './navbar.css'

export default function Navbar() {
  const [session, setSession] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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

  useEffect(() => {
    if (!session?.user?.id) {
      setUnreadCount(0)
      return
    }

    let mounted = true

    async function loadUnreadCount() {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false)

      if (!error && mounted) {
        setUnreadCount(count || 0)
      }
    }

    loadUnreadCount()

    const interval = setInterval(loadUnreadCount, 15000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [session])

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
    setUnreadCount(0)
    closeMenu()
    window.location.href = '/'
  }

  return (
    <header className="site-navbar">
      <a className="site-logo" href="/" onClick={closeMenu}>
        Metro<span>Movers</span>
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
        <a href="/hire-a-car" onClick={closeMenu}>Hire a Car</a>
        <a href="/#how-it-works" onClick={closeMenu}>How It Works</a>
        <a href="/#contact" onClick={closeMenu}>Contact</a>
        <a href="/driver" onClick={closeMenu}>Driver Login</a>

        {session ? (
          <>
            <a
              href="/my-bookings"
              className="nav-bookings-link"
              onClick={closeMenu}
            >
              My Bookings
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
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
          <a
            className="nav-account-btn"
            href="/account"
            onClick={closeMenu}
          >
            Login / Sign Up
          </a>
        )}
      </nav>
    </header>
  )
}
