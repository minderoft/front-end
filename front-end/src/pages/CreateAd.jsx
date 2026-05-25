import { useState, useEffect } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CreateAd.css';

const CreateAd = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'image', // 'image' or 'video'
    file: null,
    fileName: '',
  });

  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'LocaPlus - Créer une Publicité';
  }, []);

  // Pricing configuration
  const pricingConfig = {
    image: {
      price: 500,
      period: '2 Jours',
      duration: 2,
    },
    video: {
      price: 1500,
      period: '3 Jours',
      duration: 3,
    },
  };

  const currentPricing = pricingConfig[formData.contentType];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleContentTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      contentType: type,
      file: null,
      fileName: '',
    }));
    setPreview(null);
    setError('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (formData.contentType === 'image') {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB max
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
    } else if (formData.contentType === 'video') {
      if (!file.type.includes('video') || !file.name.toLowerCase().endsWith('.mp4')) {
        setError('Veuillez sélectionner une vidéo MP4 valide');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        // 50MB max
        setError('La taille de la vidéo ne doit pas dépasser 50MB');
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      file,
      fileName: file.name,
    }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      file: null,
      fileName: '',
    }));
    setPreview(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La description est requise');
      return false;
    }
    if (!formData.file) {
      setError('Veuillez télécharger une image ou vidéo');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Simulate API call
    console.log('Form submitted:', {
      ...formData,
      pricing: currentPricing,
    });

    setSubmitted(true);
    setTimeout(() => {
      navigate('/announcements');
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="create-ad-page">
        <div className="success-container">
          <div className="success-content">
            <CheckCircle size={64} className="success-icon" />
            <h2 className="success-title">Publicité créée avec succès !</h2>
            <p className="success-message">
              Votre campagne publicitaire a été créée avec succès et sera visible sous peu.
            </p>
            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">
                  {formData.contentType === 'image' ? 'Campagne Image' : 'Campagne Vidéo'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Durée:</span>
                <span className="detail-value">{currentPricing.period}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Coût:</span>
                <span className="detail-value">{currentPricing.price} F CFA</span>
              </div>
            </div>
            <p className="success-redirect">Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-ad-page">
      <div className="create-ad-container">
        {/* Header */}
        <div className="create-ad-header">
          <h1 className="create-ad-title">Créer une Publicité</h1>
          <p className="create-ad-subtitle">
            Lancez votre campagne publicitaire pour augmenter votre visibilité
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="create-ad-form">
          {/* Content Type Selection */}
          <div className="form-section">
            <h2 className="form-section-title">Type de Contenu</h2>
            <div className="content-type-selector">
              <button
                type="button"
                className={`type-option ${formData.contentType === 'image' ? 'active' : ''}`}
                onClick={() => handleContentTypeChange('image')}
              >
                <div className="type-icon">🖼️</div>
                <div className="type-info">
                  <h3>Campagne Image</h3>
                  <p>500 F CFA pour 2 Jours</p>
                </div>
              </button>
              <button
                type="button"
                className={`type-option ${formData.contentType === 'video' ? 'active' : ''}`}
                onClick={() => handleContentTypeChange('video')}
              >
                <div className="type-icon">🎬</div>
                <div className="type-info">
                  <h3>Campagne Vidéo</h3>
                  <p>1,500 F CFA pour 3 Jours</p>
                </div>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="form-section">
            <h2 className="form-section-title">
              {formData.contentType === 'image' ? 'Télécharger Image' : 'Télécharger Vidéo'}
            </h2>
            <div className="upload-area">
              {!preview ? (
                <label htmlFor="file-input" className="upload-label">
                  <Upload size={48} className="upload-icon" />
                  <h3 className="upload-title">
                    Cliquez ou déposez votre
                    {formData.contentType === 'image' ? ' image' : ' vidéo MP4'}
                  </h3>
                  <p className="upload-description">
                    {formData.contentType === 'image'
                      ? 'JPG, PNG (max 5MB)'
                      : 'MP4 uniquement (max 50MB)'}
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept={formData.contentType === 'image' ? 'image/*' : 'video/mp4'}
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                </label>
              ) : (
                <div className="preview-container">
                  {formData.contentType === 'image' ? (
                    <img src={preview} alt="Preview" className="preview-image" />
                  ) : (
                    <video src={preview} controls className="preview-video" />
                  )}
                  <div className="file-info">
                    <p className="file-name">{formData.fileName}</p>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={handleRemoveFile}
                    >
                      <X size={20} />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="form-section">
            <h2 className="form-section-title">Informations de la Publicité</h2>

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Titre de la Publicité
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ex: Nouvelle collection 2024"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre offre en détail pour attirer les clients..."
                rows="5"
                className="form-textarea"
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div className="pricing-item">
              <span className="pricing-label">Type de Campagne:</span>
              <span className="pricing-value">
                {formData.contentType === 'image' ? 'Image' : 'Vidéo'}
              </span>
            </div>
            <div className="pricing-item">
              <span className="pricing-label">Durée:</span>
              <span className="pricing-value">{currentPricing.period}</span>
            </div>
            <div className="pricing-item pricing-total">
              <span className="pricing-label">Coût Total:</span>
              <span className="pricing-value">{currentPricing.price} F CFA</span>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit Button */}
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Créer la Publicité
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/')}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
