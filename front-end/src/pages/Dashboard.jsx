// filepath: front-end/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { announcementService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatPrice';
import { Plus, Eye, Trash2, Rocket, CheckCircle, Clock } from 'lucide-react';
import './Dashboard.css';

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

  const statusColors = {
    active: 'status-active',
    pending: 'status-pending',
    expired: 'status-expired',
  };

  const categoryLabels = {
    immobilier: 'Immobilier',
    vehicule: 'Véhicule',
    materiaux: 'Matériaux',
    technicien: 'Technicien',
  };

  const getCategoryBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'immobilier': return 'badge-immobilier';
      case 'vehicule': return 'badge-vehicule';
      case 'materiaux': return 'badge-materiaux';
      case 'technicien': return 'badge-technicien';
      default: return 'badge-default';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Mon Dashboard</h1>
          <p className="dashboard-subtitle">Bienvenue, {user?.name} !</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-total">
            <Eye size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total annonces</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-active">
            <CheckCircle size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value stat-value-active">{stats.active}</div>
            <div className="stat-label">Annonces actives</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-pending">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value stat-value-pending">{stats.pending}</div>
            <div className="stat-label">En attente</div>
          </div>
        </div>
        <div className="stat-card stat-card-action">
          <Link to="/create" className="stat-action-btn">
            <Plus size={20} />
            <span>Nouvelle annonce</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Mes annonces
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Historique des paiements
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : (
        <>
          {activeTab === 'announcements' && (
            <>
              {error ? (
                <div className="error-state">
                  <p>{error}</p>
                  <button type="button" className="btn btn-primary" onClick={fetchData}>
                    Réessayer
                  </button>
                </div>
              ) : (announcements?.length || 0) > 0 ? (
                <div className="dashboard-announcements-grid">
                  {announcements.map(announcement => {
                    const parsedImages = parseImages(announcement.images);
                    const rawImage = announcement.image_url || parsedImages[0];
                    const imageUrl = resolveImageUrl(rawImage);
                    const location = announcement.location || announcement.geolocalisation || '';
                    const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;

                    return (
                      <div key={announcement.id} className="dashboard-card">
                        <div className="dashboard-card-image">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={announcement.title}
                              loading="lazy"
                              onError={handleImageError}
                            />
                          ) : (
                            <div className="dashboard-card-placeholder">
                              🏠
                            </div>
                          )}
                          {isBoosted && (
                            <div className="dashboard-card-badge-boosted">
                              <Rocket size={12} />
                              <span>Boosté</span>
                            </div>
                          )}
                        </div>
                        <div className="dashboard-card-body">
                          <div className="dashboard-card-header">
                            <span className={`dashboard-card-category ${getCategoryBadgeClass(announcement.category)}`}>
                              {categoryLabels[announcement.category]}
                            </span>
                            <span className={`dashboard-card-status ${statusColors[announcement.status]}`}>
                              {statusLabels[announcement.status]}
                            </span>
                          </div>
                          <h3 className="dashboard-card-title">{announcement.title}</h3>
                          <p className="dashboard-card-location">{location}</p>
                          <div className="dashboard-card-price">{formatPrice(announcement.price)}</div>
                          <div className="dashboard-card-actions">
                            <Link 
                              to={`/announcements/${announcement.id}`} 
                              className="btn btn-outline btn-sm"
                            >
                              <Eye size={14} />
                              Voir
                            </Link>
                            <button 
                              onClick={() => handleDelete(announcement.id)}
                              className="btn btn-ghost btn-sm btn-danger"
                            >
                              <Trash2 size={14} />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3 className="empty-title">Vous n'avez pas encore d'annonces</h3>
                  <p className="empty-text">Créez votre première annonce pour commencer à vendre ou louer.</p>
                  <Link to="/create" className="btn btn-primary">
                    <Plus size={18} />
                    Créer ma première annonce
                  </Link>
                </div>
              )}
            </>
          )}

          {activeTab === 'payments' && (
            <>
              {(payments?.length || 0) > 0 ? (
                <div className="payments-table-wrapper">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Annonce</th>
                        <th>Montant</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id}>
                          <td>
                            {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="payment-announcement">
                            {payment.announcement_title || 'Annonce supprimée'}
                          </td>
                          <td className="payment-amount">
                            {formatPrice(payment.amount)}
                          </td>
                          <td className="payment-method">
                            {payment.method.replace('_', ' ')}
                          </td>
                          <td>
                            <span className={`payment-status payment-status-${payment.status === 'completed' ? 'success' : 'failed'}`}>
                              {payment.status === 'completed' ? 'Succès' : 'Échoué'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <h3 className="empty-title">Aucun paiement enregistré</h3>
                  <p className="empty-text">Vos transactions apparaîtront ici une fois effectuées.</p>
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