import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = async () => {
    try {
      const { data } = await axios.get(`/api/events/${id}`);
      setEvent(data);
    } catch { toast.error('Event not found'); navigate('/events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvent(); }, [id]);

  const handleRsvp = async () => {
    try {
      await axios.post(`/api/events/${id}/rsvp`);
      toast.success('RSVP confirmed! 🎉');
      fetchEvent();
    } catch (err) { toast.error(err.response?.data?.message || 'RSVP failed'); }
  };

  const handleCancelRsvp = async () => {
    try {
      await axios.post(`/api/events/${id}/cancel-rsvp`);
      toast.success('RSVP cancelled');
      fetchEvent();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`/api/events/${id}`);
      toast.success('Event deleted');
      navigate('/events');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!event) return null;

  const { title, description, category, date, time, location, capacity, attendees = [], price, organizer } = event;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isAttending = user && attendees.some(a => (a._id || a) === user._id);
  const isOwner = user && organizer && (organizer._id || organizer) === user._id;
  const spotsLeft = capacity - attendees.length;
  const fillPct = Math.min((attendees.length / capacity) * 100, 100);

  return (
    <div className="event-detail">
      <div className="event-detail-header">
        <span className="event-category" style={{ marginBottom: '1rem', display: 'inline-block' }}>{category}</span>
        <h1>{title}</h1>
        <div className="event-detail-meta">
          <span>📅 {formattedDate}{time ? ` at ${time}` : ''}</span>
          <span>📍 {location?.venue}, {location?.city}</span>
          {organizer?.name && <span>👤 By {organizer.name}</span>}
        </div>
      </div>

      <div className="event-detail-body">
        <div>
          <p className="event-detail-desc">{description}</p>
          {location?.address && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <strong>📍 Full Address</strong>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{location.address}, {location.city}</p>
            </div>
          )}
        </div>

        <div className="event-sidebar">
          <div className="event-sidebar-card">
            <h3>🎟️ Tickets</h3>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: price === 0 ? 'var(--accent3)' : 'var(--success)' }}>
              {price === 0 ? 'FREE' : `$${price}`}
            </div>
            <div className="capacity-bar"><div className="capacity-fill" style={{ width: `${fillPct}%` }}></div></div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{attendees.length}/{capacity} spots filled • {spotsLeft} left</p>
            {user && !isOwner && (
              isAttending ? (
                <button className="btn-submit" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', marginTop: '0.75rem', boxShadow: 'none' }} onClick={handleCancelRsvp}>Cancel RSVP</button>
              ) : spotsLeft > 0 ? (
                <button className="btn-submit" style={{ marginTop: '0.75rem' }} onClick={handleRsvp}>RSVP Now 🎉</button>
              ) : (
                <p style={{ marginTop: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>Sold Out</p>
              )
            )}
            {!user && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sign in to RSVP</p>}
          </div>

          {isOwner && (
            <div className="event-sidebar-card">
              <h3>⚙️ Manage</h3>
              <button className="btn-submit" style={{ marginBottom: '0.75rem' }} onClick={() => navigate(`/events/${id}/edit`)}>
                Edit Event
              </button>
              <button className="btn-submit" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', boxShadow: 'none' }} onClick={handleDelete}>
                Delete Event
              </button>
            </div>
          )}

          {attendees.length > 0 && (
            <div className="event-sidebar-card">
              <h3>👥 Attendees ({attendees.length})</h3>
              {attendees.slice(0, 8).map((a, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.2rem 0' }}>
                  {a.name || 'Attendee'}
                </div>
              ))}
              {attendees.length > 8 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+{attendees.length - 8} more</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
