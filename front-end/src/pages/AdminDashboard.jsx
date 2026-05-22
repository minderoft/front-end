import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';

const tabItems = [
  { key: 'overview', label: 'Vue d\'ensemble' },
  { key: 'announcements', label: 'Gestion des Annonces' },
  { key: 'sponsored', label: 'Publicités Sponsorisées' },
  { key: 'users', label: 'Utilisateurs' },
];

const badgeStyles = {
  active: { backgroundColor: '#d1fae5', color: '#065f46' },
  suspended: { backgroundColor: '#fee2e2', color: '#991b1b' },
  pending: { backgroundColor: '#e0f2fe', color: '#0c4a6e' },
};

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchAnnouncements();
    }
  }, [user]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await adminService.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement stats admin:', error);
      setMessage('Erreur lors du chargement des statistiques.');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const response = await adminService.getAnnouncements();
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Erreur chargement annonces admin:', error);
      setMessage('Erreur lors du chargement des annonces.');
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleAction = async (announcement, action) => {
    setSavingId(announcement.id);
    setMessage('');

    const payload = { action };
    if (action === 'toggle_sponsored') {
      payload.is_sponsored = !announcement.is_sponsored;
    }

    try {
      await adminService.updateAnnouncementStatus(announcement.id, payload);
      await fetchStats();
      await fetchAnnouncements();
      setMessage('Mise à jour effectuée avec succès.');
    } catch (error) {
      console.error('Erreur mise à jour annonce admin:', error);
      setMessage('Impossible de mettre à jour l\'annonce.');
    } finally {
      setSavingId(null);
    }
  };

  const sponsoredAnnouncements = Array.isArray(announcements) ? announcements.filter((item) => item.is_sponsored && item.status === 'active') : [];

  if (!user || loading || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={{ padding: '34px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        <aside style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 18px 60px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ marginBottom: '28px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>Admin Dashboard</p>
            <h1 style={{ margin: '10px 0 0', fontSize: '1.8rem', color: '#111827' }}>Tableau de bord</h1>
          </div>
          <nav style={{ display: 'grid', gap: '10px' }}>
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: activeTab === tab.key ? '#1d4ed8' : '#f8fafc',
                  color: activeTab === tab.key ? '#ffffff' : '#111827',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <div>
              <p style={{ margin: 0, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>Administration</p>
              <h2 style={{ margin: '12px 0 0', fontSize: '2rem', color: '#111827' }}>Bienvenue, {user.name || user.email}</h2>
              <p style={{ margin: '10px 0 0', color: '#4b5563' }}>Utilisez ce tableau de bord pour surveiller les performances et gérer les annonces.</p>
            </div>
          </div>

          {message && (
            <div style={{ marginBottom: '24px', padding: '16px 18px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #dbeafe', color: '#1d4ed8' }}>
              {message}
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
                {[
                  { label: 'Total des utilisateurs', value: stats?.total_users ?? '—' },
                  { label: 'Annonces actives', value: stats?.total_active_announcements ?? '—' },
                  { label: 'Annonces sponsorisées', value: stats?.total_sponsored_ads ?? '—' },
                  { label: 'Revenu estimé', value: stats ? `${Number(stats.revenue_estimation).toLocaleString()} FCFA` : '—' },
                ].map((card) => (
                  <div key={card.label} style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #e5e7eb', boxShadow: '0 18px 60px rgba(15, 23, 42, 0.06)' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: 600 }}>{card.label}</p>
                    <p style={{ margin: '18px 0 0', fontSize: '1.95rem', fontWeight: 700, color: '#111827' }}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 18px 60px rgba(15, 23, 42, 0.06)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Aperçu rapide</h3>
                <p style={{ margin: '10px 0 0', color: '#4b5563' }}>Les données affichées ici sont extraites des annonces actives et des paiements complétés.</p>
              </div>
            </>
          )}

          {activeTab === 'announcements' && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827' }}>Gestion des annonces</h3>
                  <p style={{ margin: '8px 0 0', color: '#4b5563' }}>Approuvez, suspendez ou activez le sponsoring rapidement.</p>
                </div>
                <button
                  onClick={fetchAnnouncements}
                  style={{ padding: '12px 18px', borderRadius: '16px', backgroundColor: '#1d4ed8', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                >
                  Actualiser
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860, backgroundColor: '#ffffff', borderRadius: '20px', overflow: 'hidden' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      {['Titre', 'Utilisateur', 'Prix', 'Statut', 'Sponsorisé', 'Actions'].map((header) => (
                        <th key={header} style={{ padding: '16px 18px', textAlign: 'left', color: '#374151', fontWeight: 700, fontSize: '0.95rem' }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAnnouncements ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Chargement des annonces...</td>
                      </tr>
                    ) : (announcements?.length || 0) === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Aucune annonce trouvée</td>
                      </tr>
                    ) : announcements.map((announcement) => (
                      <tr key={announcement.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '16px 18px', fontWeight: 600, color: '#111827' }}>{announcement.title || '—'}</td>
                        <td style={{ padding: '16px 18px', color: '#4b5563' }}>{announcement.user_name || announcement.user_email || '—'}</td>
                        <td style={{ padding: '16px 18px', color: '#111827' }}>{announcement.price ? `${Number(announcement.price).toLocaleString()} FCFA` : '—'}</td>
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ display: 'inline-flex', padding: '8px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700, ...badgeStyles[announcement.status] || badgeStyles.pending }}>
                            {announcement.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 18px' }}>{announcement.is_sponsored ? 'Oui' : 'Non'}</td>
                        <td style={{ padding: '16px 18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            disabled={savingId === announcement.id}
                            onClick={() => handleAction(announcement, announcement.status === 'active' ? 'suspend' : 'approve')}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '14px',
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: announcement.status === 'active' ? '#ef4444' : '#10b981',
                              color: '#ffffff',
                              fontWeight: 600,
                              opacity: savingId === announcement.id ? 0.7 : 1,
                            }}
                          >
                            {announcement.status === 'active' ? 'Suspendre' : 'Approuver'}
                          </button>
                          <button
                            disabled={savingId === announcement.id}
                            onClick={() => handleAction(announcement, 'toggle_sponsored')}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '14px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: announcement.is_sponsored ? '#f8fafc' : '#2563eb',
                              color: announcement.is_sponsored ? '#111827' : '#ffffff',
                              cursor: 'pointer',
                              fontWeight: 600,
                              opacity: savingId === announcement.id ? 0.7 : 1,
                            }}
                          >
                            {announcement.is_sponsored ? 'Retirer sponsor' : 'Sponsoriser'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sponsored' && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#111827' }}>Publicités sponsorisées</h3>
                <p style={{ margin: '8px 0 0', color: '#4b5563' }}>Annonces marquées comme sponsorisées et actives.</p>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {loadingAnnouncements ? (
                  <div style={{ padding: '22px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e5e7eb' }}>Chargement...</div>
                ) : (sponsoredAnnouncements?.length || 0) === 0 ? (
                  <div style={{ padding: '22px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e5e7eb' }}>Aucune annonce sponsorisée actuellement.</div>
                ) : (
                  sponsoredAnnouncements.map((announcement) => (
                    <article key={announcement.id} style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '22px', border: '1px solid #e5e7eb', boxShadow: '0 22px 50px rgba(15, 23, 42, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>{announcement.title}</h4>
                          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{announcement.user_name || announcement.user_email}</p>
                        </div>
                        <span style={{ padding: '10px 14px', borderRadius: '14px', backgroundColor: '#e0f2fe', color: '#0c4a6e', fontWeight: 700 }}>{announcement.price ? `${Number(announcement.price).toLocaleString()} FCFA` : '—'}</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ display: 'grid', gap: '18px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e5e7eb', padding: '24px', boxShadow: '0 18px 60px rgba(15, 23, 42, 0.06)' }}>
                <h3 style={{ margin: 0, color: '#111827' }}>Utilisateurs</h3>
                <p style={{ margin: '10px 0 0', color: '#4b5563' }}>Vue rapide sur les utilisateurs et accès admin. Les actions utilisateur sont disponibles dans les prochaines itérations.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '22px' }}>
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '22px', padding: '18px' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontWeight: 600 }}>Total des comptes</p>
                    <p style={{ margin: '12px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#111827' }}>{stats?.total_users ?? '—'}</p>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '22px', padding: '18px', border: '1px solid #e5e7eb' }}>
                    <p style={{ margin: 0, color: '#6b7280', fontWeight: 600 }}>Comptes administrateurs</p>
                    <p style={{ margin: '12px 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#111827' }}>—</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
