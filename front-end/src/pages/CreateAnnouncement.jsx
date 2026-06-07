// filepath: front-end/src/pages/CreateAnnouncement.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { announcementService, paymentService, pricingService } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/formatPrice';
import './CreateAnnouncement.css';

const categories = {
  immobilier: {
    name: 'Immobilier',
    types: ['location', 'vente'],
    subcategories: ['terrain', 'villa', 'appartement', 'bureau', 'magasin'],
    fields: [
      { name: 'surface', label: 'Surface (m²)', type: 'number' },
      { name: 'pieces', label: 'Nombre de pièces', type: 'number' },
      { name: 'chambres', label: 'Nombre de chambres', type: 'number' },
      { name: 'sallesBain', label: 'Salles de bain', type: 'number' },
      { name: 'equipements', label: 'Équipements', type: 'textarea' },
    ],
  },
  vehicule: {
    name: 'Véhicule',
    types: ['location', 'vente'],
    subcategories: ['voiture', 'moto', 'camion', 'autre'],
    fields: [
      { name: 'marque', label: 'Marque', type: 'text' },
      { name: 'modele', label: 'Modèle', type: 'text' },
      { name: 'annee', label: 'Année', type: 'number' },
      { name: 'kilometrage', label: 'Kilométrage', type: 'number' },
      { name: 'carburant', label: 'Carburant', type: 'select', options: ['essence', 'diesel', 'électrique', 'hybride'] },
      { name: 'boite', label: 'Boîte de vitesse', type: 'select', options: ['manuelle', 'automatique'] },
    ],
  },
  materiaux: {
    name: 'Matériaux de construction',
    types: [],
    subcategories: ['ciment', 'sable', 'gravier', 'fer', 'brique', 'bois', 'peinture', 'autre'],
    fields: [
      { name: 'unite', label: 'Unité', type: 'select', options: ['sac', 'tonne', 'm³', 'pièce', 'palette'] },
      { name: 'disponibilite', label: 'Disponibilité', type: 'select', options: ['en_stock', 'sur_commande'] },
      { name: 'quantite', label: 'Quantité disponible', type: 'number' },
    ],
  },
  technicien: {
    name: 'Technicien',
    types: [],
    subcategories: ['plombier', 'électricien', 'maçon', 'peintre', 'carreleur', 'mécanicien', 'serrurier', 'autre'],
    fields: [
      { name: 'experience', label: 'Années d\'expérience', type: 'number' },
      { name: 'disponibilite', label: 'Disponibilité', type: 'select', options: ['immédiate', 'sous_une_semaine', 'sur_rdv'] },
      { name: 'certifications', label: 'Certifications', type: 'textarea' },
    ],
  },
};

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pricing, setPricing] = useState({});
  const [success, setSuccess] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [previewUrls, setPreviewUrls] = useState([]);
  const MIN_PRICE = 5000;
 
  const [formData, setFormData] = useState({
    category: searchParams.get('category') || '',
    type: '',
    subcategory: '',
    title: '',
    description: '',
    price: '',
    location: '',
    latitude: '',
    longitude: '',
    phone: '',
    images: [],
    metadata: {},
    announcementId: null,
  });

  // Charger les tarifs depuis l'API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await pricingService.getAll();
        const pricingMap = {};
        const categoriesData = response.data?.categories || [];
        categoriesData.forEach(cat => {
          pricingMap[cat.category] = cat.price;
        });
        setPricing(pricingMap);
      } catch (err) {
        console.error('Erreur chargement tarifs:', err);
      }
    };
    fetchPricing();
  }, []);

  // Générer et nettoyer les URLs de prévisualisation pour éviter les fuites mémoire
  useEffect(() => {
    const urls = formData.images.map(img => URL.createObjectURL(img));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      // Réinitialiser les champs dépendant de la catégorie pour éviter les données périmées
      setFormData(prev => ({ ...prev, [name]: value, metadata: {}, type: '', subcategory: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
    setSuccess('');
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      metadata: { ...prev.metadata, [name]: value } 
    }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
    setSuccess('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const currentImages = Array.isArray(formData.images) ? formData.images : [];
    
    // Validation: Check if more than 2 files are selected
    if (files.length > 2) {
      alert('Vous ne pouvez télécharger que 2 images maximum. Veuillez sélectionner moins de fichiers.');
      // Clear the input
      e.target.value = '';
      setFieldErrors(prev => ({ ...prev, images: 'Maximum 2 images autorisées.' }));
      return;
    }
    
    // Validation: Check that all files are images
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert('Seuls les fichiers image sont autorisés (JPEG, PNG, WebP, GIF).');
      // Clear the input
      e.target.value = '';
      setFieldErrors(prev => ({ ...prev, images: 'Seuls les fichiers image sont autorisés.' }));
      return;
    }
    
    const remaining = 10 - currentImages.length;
    if (remaining <= 0) {
      setFieldErrors(prev => ({ ...prev, images: 'Limite de 10 images atteinte.' }));
      return;
    }
    const newFiles = files.slice(0, remaining);
    setFormData(prev => ({
      ...prev,
      images: [...(Array.isArray(prev.images) ? prev.images : []), ...newFiles],
    }));
    setFieldErrors(prev => ({ ...prev, images: '' }));
    setError('');
    setSuccess('');
  };

  const removeImage = (index) => {
    setFormData(prev => ({ 
      ...prev, 
      images: prev.images.filter((_, i) => i !== index) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const errors = {};
    const selectedCategory = categories[formData.category];
    const minPrice = formData.category !== 'technicien'
      ? Math.max(MIN_PRICE, pricing[formData.category] ?? MIN_PRICE)
      : 0;

    if (!formData.category) {
      errors.category = 'La catégorie est requise.';
    }

    if (!formData.title.trim()) {
      errors.title = 'Le titre est requis.';
    }

    if (!formData.description.trim()) {
      errors.description = 'La description est requise.';
    }

    if (!formData.location.trim()) {
      errors.location = 'La localisation est requise.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Le numéro de téléphone est requis.';
    }

    if (formData.category !== 'technicien') {
      const priceValue = Number(formData.price);
      if (!formData.price.toString().trim()) {
        errors.price = 'Le prix est requis.';
      } else if (Number.isNaN(priceValue) || priceValue <= 0) {
        errors.price = 'Le prix doit être un nombre valide.';
      } else if (priceValue < minPrice) {
        errors.price = `Le prix minimum est de ${formatPrice(minPrice)}.`;
      }
    }

    if ((formData.images?.length || 0) === 0) {
      errors.images = 'Veuillez ajouter au moins une image.';
    }

    if (!formData.latitude || !formData.longitude) {
      errors.locationPicker = 'Cliquez sur la carte pour définir une position précise.';
    }

    if (!acceptedPrivacy) {
      errors.acceptedPrivacy = 'Vous devez accepter la politique de confidentialité.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Veuillez corriger les erreurs ci-dessous et réessayer.');
      return;
    }

    setLoading(true);

    try {
      const images = Array.isArray(formData.images) ? formData.images : [];
      const announcementData = new FormData();
      announcementData.append('category', formData.category || '');
      announcementData.append('type', formData.type || '');
      announcementData.append('subcategory', formData.subcategory || '');
      announcementData.append('title', (formData.title || '').trim());
      announcementData.append('description', (formData.description || '').trim());
      announcementData.append('price', String(formData.category === 'technicien' ? 0 : Number(formData.price || 0)));
      announcementData.append('location', (formData.location || '').trim());
      announcementData.append('phone', (formData.phone || '').trim());
      announcementData.append('metadata', JSON.stringify(formData.metadata || {}));
      if (formData.latitude) announcementData.append('latitude', String(formData.latitude));
      if (formData.longitude) announcementData.append('longitude', String(formData.longitude));

      if (images.length > 0) {
        images.forEach((image) => announcementData.append('images', image));
      }

      const response = await announcementService.create(announcementData);
      const announcement = response.data;

      setFormData(prev => ({ ...prev, announcementId: announcement.id }));
      setSuccess('Annonce créée ! Procédons au paiement...');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0] || 'Erreur lors de la création de l\'annonce.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.announcementId) {
        setError('Impossible de lancer le paiement: annonce introuvable.');
        return;
      }

      // Le prix vient du catalogue via l'API
      const categoryPrice = pricing[formData.category];
      
      if (categoryPrice === undefined || categoryPrice === null) {
        setError('Tarif non trouvé pour cette catégorie');
        return;
      }

      if (categoryPrice <= 0) {
        setSuccess('Votre annonce a été créée avec succès. Aucun paiement requis pour cette catégorie.');
        return;
      }
      
      // Créer le paiement Paystack directement (sans sélection de méthode)
      const response = await paymentService.create({
        announcementId: formData.announcementId,
        method: 'mobile_money', // PayStack gère la sélection
        amount: categoryPrice,
      });

      // Rediriger vers Paystack pour le paiement
      if (response.data.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        setError('Erreur lors de la création du paiement');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories[formData.category];

  return (
    <div className="create-announcement-page">
      <div className="create-announcement-container">
        <h1 className="create-announcement-title">Publier une annonce</h1>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="progress-step-number">1</span>
            <span className="progress-step-label">Détails</span>
          </div>
          <div className="progress-step-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="progress-step-number">2</span>
            <span className="progress-step-label">Paiement</span>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-card">
              <h3 className="form-card-title">Informations de l'annonce</h3>

              {/* Catégorie */}
              <div className="form-group">
                <label className="form-label">Catégorie *</label>
                <select
                  name="category"
                  className="form-input"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
                {fieldErrors.category && <span className="form-error">{fieldErrors.category}</span>}
              </div>

              {/* Type (pour immobilier et véhicule) */}
              {(selectedCategory?.types?.length || 0) > 0 && (
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select
                    name="type"
                    className="form-input"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner le type</option>
                    {selectedCategory.types.map(t => (
                      <option key={t} value={t}>{t === 'vente' ? 'À vendre' : 'À louer'}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sous-catégorie */}
              {selectedCategory && (
                <div className="form-group">
                  <label className="form-label">Sous-catégorie *</label>
                  <select
                    name="subcategory"
                    className="form-input"
                    value={formData.subcategory}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {selectedCategory.subcategories.map(sc => (
                      <option key={sc} value={sc}>{sc.charAt(0).toUpperCase() + sc.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Titre */}
              <div className="form-group">
                <label className="form-label">Titre *</label>
                <input
                  type="text"
                  className="form-input"
                  name="title"
                  placeholder="Titre de l'annonce"
                  value={formData.title}
                  onChange={handleChange}
                  minLength={3}
                />
                {fieldErrors.title && <span className="form-error">{fieldErrors.title}</span>}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input form-textarea"
                  name="description"
                  placeholder="Décrivez votre bien ou service en détail..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                />
                {fieldErrors.description && <span className="form-error">{fieldErrors.description}</span>}
              </div>

              {formData.category === 'technicien' && (
                <div className="form-group">
                  <div className="form-note">
                    <strong>Note :</strong> pour la catégorie Technicien, le prix n'est pas saisi dans le formulaire. Le tarif sera négocié sur site avec le client.
                  </div>
                </div>
              )}
              {formData.category !== 'technicien' && (
                <div className="form-group">
                  <label className="form-label">Prix (FCFA) *</label>
                  <input
                    type="number"
                    className="form-input"
                    name="price"
                    placeholder="Prix en FCFA"
                    value={formData.price}
                    onChange={handleChange}
                    min={pricing[formData.category] || MIN_PRICE}
                  />
                  <span className="form-help">
                    Prix minimum: {formatPrice(Math.max(MIN_PRICE, pricing[formData.category] ?? MIN_PRICE))} pour cette catégorie.
                  </span>
                  {fieldErrors.price && <span className="form-error">{fieldErrors.price}</span>}
                </div>
              )}

              {/* Localisation */}
              <div className="form-group">
                <label className="form-label">Localisation *</label>
                <input
                  type="text"
                  className="form-input"
                  name="location"
                  placeholder="Ville, Quartier"
                  value={formData.location}
                  onChange={handleChange}
                />
                {fieldErrors.location && <span className="form-error">{fieldErrors.location}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Position précise</label>
                <LocationPicker
                  position={formData.latitude && formData.longitude ? [Number(formData.latitude), Number(formData.longitude)] : null}
                  onChange={(position) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: position.lat.toFixed(8),
                      longitude: position.lng.toFixed(8),
                    }));
                    setFieldErrors(prev => ({ ...prev, locationPicker: '' }));
                  }}
                />
                <div className="form-grid-2">
                  <div>
                    <label className="form-label">Latitude</label>
                    <input
                      type="text"
                      className="form-input"
                      name="latitude"
                      value={formData.latitude}
                      readOnly
                      placeholder="Cliquer sur la carte"
                    />
                  </div>
                  <div>
                    <label className="form-label">Longitude</label>
                    <input
                      type="text"
                      className="form-input"
                      name="longitude"
                      value={formData.longitude}
                      readOnly
                      placeholder="Cliquer sur la carte"
                    />
                  </div>
                </div>
                {fieldErrors.locationPicker && <span className="form-error">{fieldErrors.locationPicker}</span>}
              </div>

              {/* Numéro de téléphone */}
              <div className="form-group">
                <label className="form-label">Numéro de téléphone *</label>
                <input
                  type="tel"
                  className="form-input"
                  name="phone"
                  placeholder="Ex: +225 07 12 34 56 78"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {fieldErrors.phone && <span className="form-error">{fieldErrors.phone}</span>}
                <small className="form-help">Ce numéro sera affiché avec votre annonce pour que les intéressés puissent vous contacter</small>
              </div>

              {/* Champs dynamiques selon la catégorie */}
              {selectedCategory?.fields?.map(field => (
                <div className="form-group" key={field.name}>
                  <label className="form-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      name={field.name}
                      className="form-input"
                      value={formData.metadata[field.name] || ''}
                      onChange={handleMetadataChange}
                    >
                      <option value="">Sélectionner</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      className="form-input form-textarea"
                      value={formData.metadata[field.name] || ''}
                      onChange={handleMetadataChange}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="form-input"
                      name={field.name}
                      value={formData.metadata[field.name] || ''}
                      onChange={handleMetadataChange}
                    />
                  )}
                </div>
              ))}

              {/* Images */}
              <div className="form-group">
                <label className="form-label">Images (max 2)</label>
                <input
                  type="file"
                  className="form-input form-file-input"
                  onChange={handleImageChange}
                  accept="image/*"
                  multiple
                />
                {fieldErrors.images && <span className="form-error">{fieldErrors.images}</span>}
                {(formData.images?.length || 0) > 0 && (
                  <div className="image-preview-grid">
                    {formData.images.map((img, index) => (
                      <div key={index} className="image-preview-item">
                        <img 
                          src={previewUrls[index]} 
                          alt={`Preview ${index + 1}`}
                          className="image-preview-thumb"
                          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.svg'; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="image-preview-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group form-checkbox-group">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  checked={acceptedPrivacy}
                  onChange={(e) => {
                    setAcceptedPrivacy(e.target.checked);
                    setFieldErrors(prev => ({ ...prev, acceptedPrivacy: '' }));
                    setError('');
                  }}
                  className="form-checkbox"
                />
                <label htmlFor="acceptPrivacy" className="form-checkbox-label">
                  J'accepte la <a href="/privacy-policy.html" target="_blank" rel="noreferrer">Politique de Confidentialité</a>
                </label>
              </div>
              {fieldErrors.acceptedPrivacy && <span className="form-error">{fieldErrors.acceptedPrivacy}</span>}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Création...' : 'Créer l\'annonce'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="form-card">
            <h3 className="form-card-title">Paiement pour valider votre annonce</h3>
            
            <div className="payment-summary">
              <p className="payment-label">Frais de publication</p>
              <p className="payment-amount">
                {pricing[formData.category] != null ? formatPrice(pricing[formData.category]) : '0 FCFA'}
              </p>
              <p className="payment-note">
                Paiement sécurisé par PayStack
              </p>
            </div>

            <button 
              onClick={handlePayment}
              className="btn btn-accent btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Redirection vers le paiement...' : 'Payer maintenant'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAnnouncement;