// filepath: front-end/src/pages/CreateAnnouncement.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { announcementService, paymentService, pricingService } from '../services/api';
import LocationPicker from '../components/LocationPicker';

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
  const [success, setSuccess] = useState('');
  const [pricing, setPricing] = useState({});
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
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
        response.data.categories.forEach(cat => {
          pricingMap[cat.category] = cat.price;
        });
        setPricing(pricingMap);
      } catch (err) {
        console.error('Erreur chargement tarifs:', err);
      }
    };
    fetchPricing();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      metadata: { ...prev.metadata, [name]: value } 
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
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
    setLoading(true);

    try {
      // Validation des champs obligatoires
      if (!formData.category || !formData.title || !formData.description || !formData.location || !formData.phone) {
        setError('Veuillez remplir tous les champs obligatoires: catégorie, titre, description, localisation, téléphone');
        setLoading(false);
        return;
      }

      if (formData.images.length === 0) {
        setError('Veuillez ajouter au moins une image');
        setLoading(false);
        return;
      }

      // Préparer les données avec FormData pour les fichiers
      const announcementData = new FormData();
      announcementData.append('category', formData.category);
      announcementData.append('type', formData.type);
      announcementData.append('title', formData.title);
      announcementData.append('description', formData.description);
      announcementData.append('price', formData.category === 'technicien' ? 0 : formData.price);
      announcementData.append('location', formData.location);
      announcementData.append('phone', formData.phone);
      announcementData.append('metadata', JSON.stringify(formData.metadata));
      if (formData.latitude) announcementData.append('latitude', formData.latitude);
      if (formData.longitude) announcementData.append('longitude', formData.longitude);
      formData.images.forEach((image) => announcementData.append('images', image));


      // Créer l'annonce
      const response = await announcementService.create(announcementData);
      const announcement = response.data;
      
      // Stocker l'ID de l'annonce pour le paiement
      setFormData(prev => ({ ...prev, announcementId: announcement.id }));
      setSuccess('Annonce créée ! Procédons au paiement...');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0] || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Le prix vient du catalogue via l'API
      const categoryPrice = pricing[formData.category];
      
      if (!categoryPrice) {
        setError('Tarif non trouvé pour cette catégorie');
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
    <div className="announcements-section" style={{ maxWidth: '800px' }}>
      <h1 className="mb-4">Publier une annonce</h1>

      {/* Progress Steps */}
      <div className="d-flex gap-2 mb-4" style={{ justifyContent: 'center' }}>
        <span style={{ 
          padding: '8px 16px', 
          backgroundColor: step >= 1 ? 'var(--primary)' : 'var(--border)',
          color: step >= 1 ? 'white' : 'var(--text-light)',
          borderRadius: 'var(--radius-md)',
          fontWeight: '600'
        }}>
          1. Détails
        </span>
        <span style={{ 
          padding: '8px 16px', 
          backgroundColor: step >= 2 ? 'var(--primary)' : 'var(--border)',
          color: step >= 2 ? 'white' : 'var(--text-light)',
          borderRadius: 'var(--radius-md)',
          fontWeight: '600'
        }}>
          2. Paiement
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 className="mb-3">Informations de l'annonce</h3>

            {/* Catégorie */}
            <div className="form-group">
              <label className="form-label">Catégorie *</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {Object.entries(categories).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Type (pour immobilier et véhicule) */}
            {selectedCategory?.types.length > 0 && (
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                  name="type"
                  className="form-select"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner le type</option>
                  {selectedCategory.types.map(t => (
                    <option key={t} value={t}>{t === 'vente' ? 'À vendre' : 'À location'}</option>
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
                  className="form-select"
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
                name="title"
                className="form-input"
                placeholder="Titre de l'annonce"
                value={formData.title}
                onChange={handleChange}
                required
                minLength={3}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-textarea"
                placeholder="Décrivez votre bien ou service en détail..."
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
              />
            </div>

            {formData.category === 'technicien' && (
              <div className="form-group">
                <div className="form-note" style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '8px', padding: '12px 16px', color: '#1e3a8a' }}>
                  <strong>Note :</strong> pour la catégorie Technicien, le prix n'est pas saisi dans le formulaire. Le tarif sera négocié sur site avec le client.
                </div>
              </div>
            )}
            {formData.category !== 'technicien' && (
              <div className="form-group">
                <label className="form-label">Prix (FCFA) *</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  placeholder="Prix en FCFA"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min={pricing[formData.category] || 0}
                />
                <span className="form-help">
                  Prix minimum: {pricing[formData.category]?.toLocaleString() || '0'} FCFA pour cette catégorie
                </span>
              </div>
            )}

            {/* Localisation */}
            <div className="form-group">
              <label className="form-label">Localisation *</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="Ville, Quartier"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Position précise</label>
              <LocationPicker
                position={formData.latitude && formData.longitude ? [Number(formData.latitude), Number(formData.longitude)] : null}
                onChange={(position) => setFormData(prev => ({
                  ...prev,
                  latitude: position.lat.toFixed(8),
                  longitude: position.lng.toFixed(8),
                }))}
              />
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    className="form-input"
                    value={formData.latitude}
                    readOnly
                    placeholder="Cliquer sur la carte"
                  />
                </div>
                <div>
                  <label className="form-label">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    className="form-input"
                    value={formData.longitude}
                    readOnly
                    placeholder="Cliquer sur la carte"
                  />
                </div>
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div className="form-group">
              <label className="form-label">Numéro de téléphone *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="Ex: +225 07 12 34 56 78"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <small className="text-muted">Ce numéro sera affiché avec votre annonce pour que les interessés puissent vous contacter</small>
            </div>

            {/* Champs dynamiques selon la catégorie */}
            {selectedCategory?.fields?.map(field => (
              <div className="form-group" key={field.name}>
                <label className="form-label">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    className="form-select"
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
                    className="form-textarea"
                    value={formData.metadata[field.name] || ''}
                    onChange={handleMetadataChange}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    className="form-input"
                    value={formData.metadata[field.name] || ''}
                    onChange={handleMetadataChange}
                  />
                )}
              </div>
            ))}

            {/* Images */}
            <div className="form-group">
              <label className="form-label">Images (max 10)</label>
              <input
                type="file"
                className="form-input"
                onChange={handleImageChange}
                accept="image/*"
                multiple
              />
              {formData.images.length > 0 && (
                <div className="d-flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                  {formData.images.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt={`Preview ${index + 1}`}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'var(--error)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="acceptPrivacy"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', cursor: 'pointer' }}
                required
              />
              <label htmlFor="acceptPrivacy" style={{ fontSize: '0.95rem', lineHeight: '1.5', cursor: 'pointer' }}>
                J'accepte la <a href="/privacy-policy.html" target="_blank" rel="noreferrer">Politique de Confidentialité</a>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !acceptedPrivacy}>
              {loading ? 'Création...' : 'Créer l\'annonce'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 className="mb-3">Paiement pour valider votre annonce</h3>
          
          <div style={{ 
            backgroundColor: 'var(--background)', 
            padding: 'var(--spacing-lg)', 
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-lg)',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '8px' }}>Frais de publication</p>
            <p className="text-accent" style={{ fontSize: '2rem', fontWeight: '700' }}>
              {pricing[formData.category]?.toLocaleString() || '0'} FCFA
            </p>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Paiement sécurisé par PayStack
            </p>
          </div>

          <button 
            onClick={handlePayment}
            className="btn btn-accent" 
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'Redirection vers le paiement...' : 'Payer maintenant'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateAnnouncement;