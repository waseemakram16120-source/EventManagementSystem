import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import { toast } from '../components/Toast';

const CATEGORIES = ['all','conference','workshop','seminar','meetup','concert','sports','exhibition','party','other'];
const SORT_OPTIONS = [
  { value: 'date', label: 'Date (soonest first)' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
];
const PAGE_SIZE = 9;

export default function Events() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchTimer = useRef(null);

  // Debounced search (400ms)
  useEffect(() => {
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, page, limit: PAGE_SIZE };
      if (category !== 'all') params.category = category;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await api.get('/api/events', { params });
      setEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setEvents([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, sort, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const changeCategory = (c) => {
    setCategory(c);
    setPage(1);
    setSearchParams(c === 'all' ? {} : { category: c }, { replace: true });
  };

  const handleRsvp = async (id) => {
    try {
      await api.post(`/api/events/${id}/rsvp`);
      toast.success('RSVP confirmed! 🎉');
      fetchEvents();
    } catch (err) { toast.error(err.response?.data?.message || 'RSVP failed'); }
  };

  const handleCancelRsvp = async (id) => {
    try {
      await api.post(`/api/events/${id}/cancel-rsvp`);
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
          <button key={c} className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => changeCategory(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} aria-label="Sort events">
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {!loading && total > 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {total} event{total === 1 ? '' : 's'} found
        </p>
      )}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No events found</h3>
          <p>Try a different category or search term</p>
        </div>
      ) : (
        <>
          <div className="events-grid">
            {events.map(ev => (
              <EventCard key={ev._id} event={ev} userId={user?._id} onRsvp={handleRsvp} onCancelRsvp={handleCancelRsvp} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
