import React, { useEffect, useState } from 'react';
import { announcementService } from '../services/api';
import AdCard from '../components/AdCard';

const StatCard = ({ title, value, emoji }) => (
  <div className="card stat-card" style={{ padding: 16, textAlign: 'center' }}>
    <div style={{ fontSize: 28 }}>{emoji}</div>
    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{title}</div>
    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8 }}>{Number(value || 0).toLocaleString()}</div>
  </div>
);

const AdvertiserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await announcementService.getAdvertiserDashboard();
      setStats(res.data?.stats || {});
      setListings(res.data?.listings || []);
    } catch (err) {
      console.error('Erreur advertiser dashboard:', err);
      setError('Impossible de charger le tableau de bord. Veuillez vous reconnecter et réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="advertiser-dashboard page" style={{ padding: 20 }}>
      <h1>Tableau de bord annonceur</h1>
      <p className="text-muted">Vue d'ensemble de performance pour vos annonces sponsorisées.</p>

      {loading ? (
        <div className="skeleton-grid" style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton-card" style={{ width: 200, height: 80 }} />
          <div className="skeleton-card" style={{ width: 200, height: 80 }} />
          <div className="skeleton-card" style={{ width: 200, height: 80 }} />
          <div className="skeleton-card" style={{ width: 200, height: 80 }} />
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
            <StatCard title="Total Views" value={stats?.total_views} emoji={'👁️'} />
            <StatCard title="Total Clicks" value={stats?.total_clicks} emoji={'🖱️'} />
            <StatCard title="WhatsApp Inquiries" value={stats?.total_whatsapp_clicks} emoji={'💬'} />
            <StatCard title="Direct Calls" value={stats?.total_call_clicks} emoji={'📞'} />
          </div>

          <section style={{ marginTop: 20 }}>
            <h3>Vos annonces sponsorisées</h3>
            {listings.length === 0 ? (
              <div className="empty-state">Aucune annonce sponsorisée pour le moment.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
                {listings.map((item) => (
                  <AdCard key={item.id} announcement={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdvertiserDashboard;
