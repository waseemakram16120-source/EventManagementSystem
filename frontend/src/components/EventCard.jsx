import { Link } from 'react-router-dom';

const CATEGORY_ICONS = {
  conference: '🎤', workshop: '🔧', seminar: '📚', meetup: '🤝',
  concert: '🎵', sports: '⚽', exhibition: '🎨', party: '🎉', other: '📌',
};

export default function EventCard({ event, onRsvp, onCancelRsvp, userId }) {
  const { _id, title, description, category, date, time, location, capacity, attendees = [], price, image } = event;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isAttending = userId && attendees.some(a => (a._id || a) === userId);
  const spotsLeft = capacity - attendees.length;

  return (
    <div className="event-card">
      {image ? (
        <img src={image} alt={title} className="event-img" loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <div className="event-img-placeholder">{CATEGORY_ICONS[category] || '📌'}</div>
      )}
      <div className="event-body">
        <span className="event-category">{category}</span>
        <Link to={`/events/${_id}`} className="event-title">{title}</Link>
        <p className="event-desc">{description?.substring(0, 100)}{description?.length > 100 ? '…' : ''}</p>
        <div className="event-meta">
          <div className="event-meta-item">📅 {formattedDate}{time ? ` • ${time}` : ''}</div>
          <div className="event-meta-item">📍 {location?.venue || location?.city || 'TBA'}</div>
          <div className="event-meta-item">👥 {attendees.length}/{capacity} ({spotsLeft > 0 ? `${spotsLeft} left` : 'Full'})</div>
        </div>
      </div>
      <div className="event-footer">
        <span className={`event-price ${price === 0 ? 'free' : ''}`}>
          {price === 0 ? '🆓 Free' : `$${price}`}
        </span>
        {userId && (
          isAttending ? (
            <button className="btn-rsvp cancel" onClick={() => onCancelRsvp?.(_id)}>Cancel RSVP</button>
          ) : spotsLeft > 0 ? (
            <button className="btn-rsvp" onClick={() => onRsvp?.(_id)}>RSVP Now</button>
          ) : (
            <span className="event-attend">Sold Out</span>
          )
        )}
        {!userId && <Link to="/login" className="btn-rsvp">Sign in to RSVP</Link>}
      </div>
    </div>
  );
}
