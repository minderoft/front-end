// filepath: front-end/src/pages/Favorites.jsx
// Page pour afficher les annonces sauvegardées en favoris

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { parseImages, resolveImageUrl } from '../utils/imageUtils';
import '../styles/Favorites.css';

const Favorites = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await api.get('/favorites');
        const favList = Array.isArray(response.data.favorites) ? response.data.favorites : [];
        setFavorites(favList);
      } catch (err) {
        console.error('Erreur chargement favoris:', err);
        setError('Impossible de charger vos favoris');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, navigate]);

  const handleRemoveFavorite = async (announcementId) => {
    try {
      await api.delete(`/favorites/${announcementId}`);
      setFavorites(prev => prev.filter(fav => fav.announcement_id !== announcementId));
    } catch (err) {
      console.error('Erreur suppression favori:', err);
      alert('Erreur lors de la suppression du favori');
    }
  };

  const handleViewDetails = (announcementId) => {
    navigate(`/announcements/${announcementId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="favorites-container">
        <p>Veuillez vous connecter pour voir vos favoris</p>
      </div>
    );
  }

  if (loading) {
    return <div className="favorites-container loading">Chargement...</div>;
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>♥ Mes Favoris</h1>
        <p>{favorites.length} annonce{favorites.length !== 1 ? 's' : ''} sauvegardée{favorites.length !== 1 ? 's' : ''}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>Vous n'avez pas encore de favoris</p>
          <button onClick={() => navigate('/announcements')} className="btn-primary">
            Explorer les annonces
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((favorite) => {
            const parsedImages = parseImages(favorite.images);
            const displayImage = parsedImages[0] || '/placeholder.svg';

            return (
              <div key={favorite.announcement_id} className="favorite-card">
                <div className="favorite-image">
                  <img 
                    src={resolveImageUrl(displayImage)} 
                    alt={favorite.title}
                    onError={(e) => {
                      e.target.src = '/placeholder.svg';
                    }}
                  />
                  {favorite.status === 'active' && (
                    <div className="status-badge active">Actif</div>
                  )}
                </div>
                
                <div className="favorite-info">
                  <h3>{favorite.title}</h3>
                  <p className="category">📂 {favorite.category}</p>
                  <p className="price">{favorite.price?.toLocaleString('fr-CI')} FCFA</p>
                  <p className="date">
                    {new Date(favorite.created_at).toLocaleDateString('fr-CI', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="favorite-actions">
                  <button 
                    onClick={() => handleViewDetails(favorite.announcement_id)}
                    className="btn-view"
                  >
                    Voir détails
                  </button>
                  <button 
                    onClick={() => handleRemoveFavorite(favorite.announcement_id)}
                    className="btn-remove"
                    title="Retirer des favoris"
                  >
                    ♥ Retirer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
