// filepath: front-end/src/pages/AnnouncementDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Phone,
  Mail,
  Flag,
  Share2,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { announcementService, favoriteService, reportService, paymentService } from '../services/api';
import { parseImages, resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { formatPrice } from '../utils/formatPrice';

const AnnouncementDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await announcementService.getById(id);
        setAnnouncement(response.data.announcement);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger cette annonce.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncement();
  }, [id]);

  useEffect(() => {
    const fetchFavorite = async () => {
      if (!user || !announcement?.id) return;
      try {
        const response = await favoriteService.getAll();
        const favoriteIds = Array.isArray(response.data.favorites)
          ? response.data.favorites.map((item) => item.announcement_id)
          : [];
        setIsFavorite(favoriteIds.includes(announcement.id));
      } catch (err) {
        console.error('Erreur favoris:', err);
      }
    };
    fetchFavorite();
  }, [user, announcement]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center pt-20">
        <div className="container">
          <div className="card p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-slate-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center pt-20">
        <div className="container max-w-md">
          <div className="card text-center py-16">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              {error ? 'Erreur de chargement' : 'Annonce non trouvée'}
            </h2>
            <p className="text-text-tertiary mb-6">
              {error || 'Cette annonce n\'existe pas ou a été supprimée.'}
            </p>
            <Link to="/announcements" className="btn btn-primary">
              <ChevronLeft size={18} />
              Retour aux annonces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = Array.isArray(parseImages(announcement.images)) ? parseImages(announcement.images) : [];
  const allImages = announcement.image_url ? [announcement.image_url, ...images] : images;
  const selectedImageUrl = resolveImageUrl(allImages[selectedImage] || announcement.image_url);
  const sellerPhone = announcement.user_phone || announcement.phone;
  const isBoosted = announcement.is_boosted ?? announcement.statut_boost ?? false;
  const location = announcement.location || announcement.geolocalisation || 'Localisation non spécifiée';

  const handleToggleFavorite = async () => {
    if (!user) return window.alert('Veuillez vous connecter.');
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.remove(announcement.id);
      } else {
        await favoriteService.add(announcement.id);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Erreur');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user) return window.alert('Veuillez vous connecter.');
    const reason = window.prompt('Raison du signalement:');
    if (!reason?.trim()) return;
    try {
      await reportService.create({ announcementId: announcement.id, reason: reason.trim() });
      window.alert('Signalement envoyé.');
    } catch (err) {
      window.alert(err.response?.data?.error || 'Erreur');
    }
  };

  const categoryLabel = {
    immobilier: 'Immobilier',
    vehicule: 'Véhicule',
    materiaux: 'Matériaux BTP',
    technicien: 'Technicien',
  }[announcement.category] || 'Annonce';

  return (
    <div className="bg-bg-primary min-h-screen pt-20">
      <div className="container py-12">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/announcements')}
          className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors mb-8"
        >
          <ChevronLeft size={18} />
          Retour aux annonces
        </button>

        <div className="grid lg:grid-2 gap-8">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 bg-slate-100 rounded-2xl overflow-hidden group">
              <img
                src={selectedImageUrl}
                alt={announcement.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              
              {/* Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {isBoosted && (
                  <div className="badge badge-accent">
                    <Zap size={14} />
                    Boosté
                  </div>
                )}
                {announcement.is_favorite && (
                  <div className="badge badge-success">
                    <CheckCircle size={14} />
                    Favori
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                    disabled={selectedImage === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-icon bg-white text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(Math.min(allImages.length - 1, selectedImage + 1))}
                    disabled={selectedImage === allImages.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-icon bg-white text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      idx === selectedImage ? 'border-primary' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img src={resolveImageUrl(img)} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              {/* Category & Type */}
              <div className="flex items-center gap-2">
                <span className="badge badge-primary">{categoryLabel}</span>
                {announcement.type && (
                  <span className="badge badge-accent text-xs">
                    {announcement.type === 'vente' ? 'Vente' : 'Location'}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-text-primary">
                {announcement.title}
              </h1>

              {/* Location */}
              <div className="flex items-center gap-2 text-lg text-text-secondary">
                <MapPin size={20} className="text-primary" />
                {location}
              </div>
            </div>

            {/* Price Card */}
            <div className="card bg-gradient-to-br from-accent-lightest to-white p-8 space-y-4">
              <p className="text-sm text-text-tertiary uppercase tracking-wider font-semibold">
                Prix de l'annonce
              </p>
              <h2 className="text-5xl font-bold text-accent">
                {announcement.category === 'technicien' || announcement.price === 0
                  ? 'Sur devis'
                  : formatPrice(announcement.price)}
              </h2>
              {announcement.currency && (
                <p className="text-sm text-text-tertiary">{announcement.currency}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-text-primary">Description</h3>
              <p className="text-lg text-text-secondary leading-relaxed">
                {announcement.description}
              </p>
            </div>

            {/* Seller Info Card */}
            <div className="card space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-4">Vendeur</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {announcement.user_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary text-lg">
                    {announcement.user_name || 'Vendeur'}
                  </h4>
                  <p className="text-sm text-text-tertiary">Membre LocaPlus</p>
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border-color">
                {sellerPhone && (
                  <a
                    href={`https://wa.me/${sellerPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-block btn-lg"
                  >
                    <Phone size={18} />
                    Contacter sur WhatsApp
                  </a>
                )}
                <button className="btn btn-secondary btn-block btn-lg">
                  <Mail size={18} />
                  Envoyer un message
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                className={`btn btn-lg flex-1 ${
                  isFavorite
                    ? 'bg-error text-white hover:bg-error'
                    : 'btn-secondary'
                }`}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                {isFavorite ? 'Favoris' : 'Ajouter aux favoris'}
              </button>
              <button
                onClick={handleReport}
                className="btn btn-text text-error hover:bg-error-light"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        {announcement.metadata && (
          <div className="mt-12 card">
            <div className="card-header">
              <h3 className="text-2xl font-bold">Informations détaillées</h3>
            </div>
            <div className="card-body">
              <div className="grid md:grid-2 gap-8">
                {typeof announcement.metadata === 'string'
                  ? Object.entries(JSON.parse(announcement.metadata)).map(([key, value]) => (
                      <div key={key} className="border-b border-border-color pb-4 last:border-0">
                        <p className="text-sm text-text-tertiary uppercase tracking-wider font-semibold mb-2">
                          {key}
                        </p>
                        <p className="text-lg font-medium text-text-primary">{value}</p>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className="mt-12 grid md:grid-3 gap-6">
          <div className="card text-center py-8">
            <Calendar size={24} className="text-primary mx-auto mb-3" />
            <p className="text-sm text-text-tertiary mb-2">Publié le</p>
            <p className="font-semibold text-text-primary">
              {new Date(announcement.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="card text-center py-8">
            <DollarSign size={24} className="text-accent mx-auto mb-3" />
            <p className="text-sm text-text-tertiary mb-2">Type d'annonce</p>
            <p className="font-semibold text-text-primary">
              {announcement.type === 'vente' ? 'Vente' : 'Location'}
            </p>
          </div>
          <div className="card text-center py-8">
            {isBoosted && (
              <>
                <Zap size={24} className="text-accent mx-auto mb-3" />
                <p className="text-sm text-text-tertiary mb-2">Statut</p>
                <p className="font-semibold text-accent">Boosté</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
