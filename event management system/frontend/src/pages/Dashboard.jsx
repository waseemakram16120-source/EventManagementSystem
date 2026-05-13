import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { toast } from '../components/Toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0, totalAttendees: 0 });
  const [myEvents, setMyEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, eventsRes, userRes] = await Promise.all([
          axios.get('/api/events/stats'),
          axios.get('/api/events/my-events'),
          axios.get('/api/auth/me'),
        ]);
        setStats(statsRes.data);
        setMyEvents(eventsRes.data);
        setJoinedEvents(userRes.data.eventsAttending || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="section">
      <div className="section-header" style={{ textAlign: 'left' }}>
        <h2>Welcome back, {user?.name} 👋</h2>
        <p>Here's an overview of your events</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📅</div>
          <div className="stat-card-value">{stats.totalEvents}</div>
          <div className="stat-card-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🔜</div>
          <div className="stat-card-value">{stats.upcomingEvents}</div>
          <div className="stat-card-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-value">{stats.totalAttendees}</div>
          <div className="stat-card-label">Total Attendees</div>
        </div>
        <Link to="/create" className="stat-card" style={{ justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--border-hover)', cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem' }}>➕</div>
          <div className="stat-card-label">Create New</div>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
        <div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Events You Created</h3>
          {myEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>You haven't created any events yet.</p>
              <Link to="/create" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>Create First Event</Link>
            </div>
          ) : (
            <div className="events-grid">
              {myEvents.map(ev => (
                <EventCard key={ev._id} event={ev} userId={user?._id} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Events You're Joining</h3>
          {joinedEvents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>You haven't joined any events yet.</p>
              <Link to="/events" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>Explore Events</Link>
            </div>
          ) : (
            <div className="events-grid">
              {joinedEvents.map(ev => (
                <EventCard key={ev._id} event={ev} userId={user?._id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
