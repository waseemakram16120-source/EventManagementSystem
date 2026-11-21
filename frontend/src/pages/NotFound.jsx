import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="icon">🔍</div>
      <h3 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Page not found</h3>
      <p style={{ marginBottom: '1.5rem' }}>The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link to="/" className="btn-primary">Back to Home →</Link>
    </div>
  );
}
