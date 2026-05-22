// filepath: front-end/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { announcementService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatPrice';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
        if (activeTab === 'announcements') {
        const response = await announcementService.getMyAnnouncements();
        setAnnouncements(Array.isArray(response.data.announcements) ? response.data.announcements : []);
      } else if (activeTab === 'payments') {
        const response = await paymentService.getHistory();
        setPayments(Array.isArray(response.data.payments) ? response.data.payments : []);
      }
    } catch (error) {
      console.error('Erreur fetchData:', error);
      setError('Impossible de charger vos données. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;
    
    try {
      await announcementService.delete(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const stats = {
    total: (announcements?.length || 0),
    active: Array.isArray(announcements) ? announcements.filter(a => a.status === 'active').length : 0,
    pending: Array.isArray(announcements) ? announcements.filter(a => a.status === 'pending').length : 0,
  };

  const statusLabels = {
    active: 'Active',
    pending: 'En attente',
    expired: 'Expirée',
  };

  const categoryLabels = {
    immobilier: 'Immobilier',
    vehicule: 'Véhicule',
    materiaux: 'Matériaux',
    technicien: 'Technicien',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Mon Dashboard</h1>
        <p className="text-muted">Bienvenue, {user?.name} !</p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total annonces</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.active}</div>
          <div className="stat-label">Annonces actives</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <Link to="/create" className="btn btn-accent" style={{ width: '100%' }}>
            + Nouvelle annonce
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Mes annonces
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Historique des paiements
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {activeTab === 'announcements' && (
            <>
              {error ? (
                <div className="alert alert-error">
                  <p>{error}</p>
                  <button type="button" className="btn btn-primary" onClick={fetchData}>
                    Réessayer
                  </button>
                </div>
              ) : (announcements?.length || 0) > 0 ? (
                <div className="announcements-grid">
                  {announcements.map(announcement => {
                    const parsedImages = parseImages(announcement.images);
                    const rawImage = announcement.image_url || parsedImages[0];
                    const imageUrl = resolveImageUrl(rawImage);
                    const location = announcement.location || announcement.geolocalisation || '';
                    const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;

                    if (import.meta.env.DEV) {
                      console.log('DEBUG Dashboard image', {
                        announcementId: announcement.id,
                        rawImages: announcement.images,
                        parsedImages,
                        imageUrl,
                      });
                    }

                    return (
                      <div key={announcement.id} className="card announcement-card">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={announcement.title}
                            className="card-image"
                            loading="lazy"
                            onError={handleImageError}
                          />
                        ) : (
                        <div className="card-image" style={{ 
                          backgroundColor: '#E2E8F0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '3rem'
                        }}>
                          🏠
                        </div>
                      )}
                      <div className="card-body">
                        <div className="d-flex justify-between align-center mb-2" style={{ gap: '8px' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent)',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}>
                            {categoryLabels[announcement.category]}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isBoosted && (
                              <span style={{
                                fontSize: '0.75rem',
                                backgroundColor: '#ffebc2',
                                color: '#b45309',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                🚀 Boosté
                              </span>
                            )}
                            <span style={{ 
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: announcement.status === 'active' ? 'var(--success)' : 'var(--warning)',
                              color: 'white'
                            }}>
                              {statusLabels[announcement.status]}
                            </span>
                          </div>
                        </div>
                        <h3 className="card-title">{announcement.title}</h3>
                        <p className="card-text">{location}</p>
                        <div className="card-price">{formatPrice(announcement.price)}</div>
                        <div className="d-flex gap-2 mt-3">
                          <Link 
                            to={`/announcements/${announcement.id}`} 
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1 }}
                          >
                            Voir
                          </Link>
                          <button 
                            onClick={() => handleDelete(announcement.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--error)' }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center" style={{ padding: '64px' }}>
                  <p className="text-muted">Vous n'avez pas encore d'annonces.</p>
                  <Link to="/create" className="btn btn-primary mt-3">
                    Créer ma première annonce
                  </Link>
                </div>
              )}
            </>
          )}

          {activeTab === 'payments' && (
            <>
              {(payments?.length || 0) > 0 ? (
                <div className="card" style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Annonce</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Montant</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Méthode</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {payment.announcement_title || 'Annonce supprimée'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {formatPrice(payment.amount)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {payment.method.replace('_', ' ')}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: payment.status === 'completed' ? 'var(--success)' : 'var(--error)',
                              color: 'white',
                              fontSize: '0.75rem'
                            }}>
                              {payment.status === 'completed' ? 'Succès' : 'Échoué'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center" style={{ padding: '64px' }}>
                  <p className="text-muted">Aucun paiement enregistré.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;