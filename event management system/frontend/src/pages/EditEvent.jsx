import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../components/Toast';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: 'conference',
    date: '', time: '', venue: '', address: '', city: '',
    capacity: '', price: '0',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await axios.get(`/api/events/${id}`);
        setForm({
          title: data.title,
          description: data.description,
          category: data.category,
          date: data.date.split('T')[0],
          time: data.time,
          venue: data.location.venue,
          address: data.location.address,
          city: data.location.city,
          capacity: data.capacity,
          price: data.price,
        });
      } catch (err) {
        toast.error('Failed to load event');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        date: form.date,
        time: form.time,
        location: { venue: form.venue, address: form.address, city: form.city },
        capacity: parseInt(form.capacity),
        price: parseFloat(form.price) || 0,
      };
      await axios.put(`/api/events/${id}`, payload);
      toast.success('Event updated successfully! 📝');
      navigate(`/events/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="form-page">
      <div className="form-card" style={{ maxWidth: 620 }}>
        <h2>Edit Event 📝</h2>
        <p className="subtitle">Update the details for your event</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Tech Conference 2026" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your event…" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {['conference','workshop','seminar','meetup','concert','sports','exhibition','party','other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Time</label>
              <input type="time" name="time" value={form.time} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="100" min="1" required />
            </div>
          </div>
          <div className="form-group">
            <label>Venue Name</label>
            <input name="venue" value={form.venue} onChange={handleChange} placeholder="Grand Convention Center" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St" required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="New York" required />
            </div>
          </div>
          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" />
          </div>
          <div className="form-row">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
