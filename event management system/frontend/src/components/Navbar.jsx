import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-logo">✦ EventFlow</Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/events" className={isActive('/events')}>Events</Link>
          {user && <Link to="/create" className={isActive('/create')}>Create</Link>}
          {user && <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>}
          {user ? (
            <>
              <span className="nav-user">👋 {user.name}</span>
              <button onClick={logout} className="nav-btn danger">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-btn">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
