import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

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
    </>
  );
}
