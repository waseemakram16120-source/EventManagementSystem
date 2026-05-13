import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { toast } from '../components/Toast';

const CATEGORIES = ['all','conference','workshop','seminar','meetup','concert','sports','exhibition','party','other'];

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const { data } = await axios.get('/api/events', { params });
      setEvents(data.events || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleRsvp = async (id) => {
    try {
      await axios.post(`/api/events/${id}/rsvp`);
      toast.success('RSVP confirmed! 🎉');
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'RSVP failed'); }
  };

  const handleCancelRsvp = async (id) => {
    try {
      await axios.post(`/api/events/${id}/cancel-rsvp`);
      toast.success('RSVP cancelled');
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2>Explore Events</h2>
        <p>Find your next unforgettable experience</p>
      </div>

      <div className="filters">
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <form onSubmit={handleSearch} className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
        </form>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No events found</h3>
          <p>Try a different category or search term</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(ev => (
            <EventCard key={ev._id} event={ev} userId={user?._id} onRsvp={handleRsvp} onCancelRsvp={handleCancelRsvp} />
          ))}
        </div>
      )}
    </div>
  );
}
