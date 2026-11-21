import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import EventCard from '../components/EventCard';
import { toast } from '../components/Toast';

const CATEGORIES = [
  { key: 'conference', icon: '🎤', label: 'Conferences' },
  { key: 'workshop', icon: '🔧', label: 'Workshops' },
  { key: 'concert', icon: '🎵', label: 'Concerts' },
  { key: 'meetup', icon: '🤝', label: 'Meetups' },
  { key: 'seminar', icon: '📚', label: 'Seminars' },
  { key: 'sports', icon: '⚽', label: 'Sports' },
];

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/events/featured');
        setFeatured(Array.isArray(data) ? data : []);
      } catch {
        setFeatured([]);
      } finally {
        setLoadingFeatured(false);
      }
    })();
  }, []);

  const handleRsvp = async (id) => {
    try {
      await api.post(`/api/events/${id}/rsvp`);
      toast.success('RSVP confirmed! 🎉');
    } catch (err) { toast.error(err.response?.data?.message || 'RSVP failed'); }
  };

  const handleCancelRsvp = async (id) => {
    try {
      await api.post(`/api/events/${id}/cancel-rsvp`);
      toast.success('RSVP cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-badge">✨ #1 Event Platform</div>
          <h1>
            Discover & Create<br />
            <span>Unforgettable Events</span>
          </h1>
          <p>
            Your all-in-one platform to explore amazing events, connect with people,
            and create memorable experiences. Start your journey today.
          </p>
          <div className="hero-btns">
            <Link to="/events" className="btn-primary">Explore Events →</Link>
            {user ? (
              <Link to="/create" className="btn-secondary">Create Event</Link>
            ) : (
              <Link to="/register" className="btn-secondary">Join Free</Link>
            )}
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num">500+</div>
          <div className="stat-label">Events Hosted</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">10K+</div>
          <div className="stat-label">Happy Attendees</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">200+</div>
          <div className="stat-label">Organizers</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">50+</div>
          <div className="stat-label">Cities</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Browse by Category</h2>
          <p>Jump straight to the kind of event you love</p>
        </div>
        <div className="filters" style={{ justifyContent: 'center' }}>
          {CATEGORIES.map((c) => (
            <Link key={c.key} to={`/events?category=${c.key}`} className="filter-btn">
              {c.icon} {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Featured Events</h2>
          <p>Hand-picked events happening soon</p>
        </div>
        {loadingFeatured ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : featured.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✨</div>
            <h3>No featured events right now</h3>
            <p>Check back soon — or <Link to="/events">explore all events</Link></p>
          </div>
        ) : (
          <>
            <div className="events-grid">
              {featured.map((ev) => (
                <EventCard key={ev._id} event={ev} userId={user?._id} onRsvp={handleRsvp} onCancelRsvp={handleCancelRsvp} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/events" className="btn-primary">View All Events →</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
