// filepath: front-end/src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, Phone, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    password: '', 
    confirmPassword: '' 
  });
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom complet est requis.';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Adresse email invalide.';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis.';
    } else if ((formData.password?.length || 0) < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer votre mot de passe.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    if (!acceptedPrivacy) {
      errors.acceptedPrivacy = 'Vous devez accepter la politique de confidentialité.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Veuillez corriger les champs indiqués.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        accepted_policy: acceptedPrivacy,
      });
      setSuccess('Inscription réussie ! Redirection vers le tableau de bord...');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0] || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-lightest via-bg-primary to-bg-secondary flex items-center justify-center pt-20 pb-20">
      <div className="container max-w-md">
        <div className="card shadow-xl">
          {/* Header */}
          <div className="card-header text-center space-y-4">
            <div className="w-16 h-16 rounded-xl bg-accent-lightest flex items-center justify-center mx-auto">
              <UserPlus className="text-accent" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Créer un Compte</h1>
              <p className="text-text-tertiary mt-2">Rejoignez la communauté LocaPlus</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="card-body bg-error-light border-l-4 border-error rounded p-4">
              <p className="text-error font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="card-body bg-success-light border-l-4 border-success rounded p-4">
              <p className="text-success font-medium flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </p>
            </div>
          )}

          {/* Form */}
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">
                  <User size={16} className="inline mr-2 text-primary" />
                  Nom Complet
                </label>
                <input
                  type="text"
                  name="name"
                  className={`input w-full ${fieldErrors.name ? 'border-error' : ''}`}
                  placeholder="Votre nom complet"
                  value={formData.name}
                  onChange={handleChange}
                />
                {fieldErrors.name && (
                  <span className="text-xs text-error font-medium">{fieldErrors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">
                  <Mail size={16} className="inline mr-2 text-primary" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className={`input w-full ${fieldErrors.email ? 'border-error' : ''}`}
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <span className="text-xs text-error font-medium">{fieldErrors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">
                  <Phone size={16} className="inline mr-2 text-primary" />
                  Téléphone <span className="text-text-tertiary text-xs">(optionnel)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="input w-full"
                  placeholder="+225 XX XXX XXX"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">
                  <Lock size={16} className="inline mr-2 text-primary" />
                  Mot de Passe
                </label>
                <input
                  type="password"
                  name="password"
                  className={`input w-full ${fieldErrors.password ? 'border-error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <span className="text-xs text-text-tertiary">Minimum 6 caractères</span>
                {fieldErrors.password && (
                  <span className="text-xs text-error font-medium block">{fieldErrors.password}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">
                  <Lock size={16} className="inline mr-2 text-primary" />
                  Confirmer le Mot de Passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className={`input w-full ${fieldErrors.confirmPassword ? 'border-error' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {fieldErrors.confirmPassword && (
                  <span className="text-xs text-error font-medium">{fieldErrors.confirmPassword}</span>
                )}
              </div>

              {/* Privacy Checkbox */}
              <div className="flex items-start gap-3 py-4 border-t border-b border-border-color">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  checked={acceptedPrivacy}
                  onChange={(e) => {
                    setAcceptedPrivacy(e.target.checked);
                    setFieldErrors(prev => ({ ...prev, acceptedPrivacy: '' }));
                    setError('');
                  }}
                  className="w-5 h-5 mt-0.5 cursor-pointer"
                />
                <label htmlFor="acceptPrivacy" className="text-sm text-text-secondary cursor-pointer">
                  J'accepte la{' '}
                  <a
                    href="/privacy-policy.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-semibold hover:text-primary-light transition-colors"
                  >
                    Politique de Confidentialité
                  </a>{' '}
                  et les conditions d'utilisation
                </label>
              </div>
              {fieldErrors.acceptedPrivacy && (
                <span className="text-xs text-error font-medium">{fieldErrors.acceptedPrivacy}</span>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !acceptedPrivacy}
                className="btn btn-primary btn-block btn-lg mt-2"
              >
                {loading ? 'Création du compte...' : 'Créer un compte'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="card-footer text-center">
            <p className="text-sm text-text-tertiary">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary font-semibold hover:text-primary-light transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Link */}
        <p className="text-center text-text-tertiary text-sm mt-6">
          <Link to="/" className="text-primary hover:text-primary-light transition-colors font-medium">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="acceptPrivacy"
              checked={acceptedPrivacy}
              onChange={(e) => {
                setAcceptedPrivacy(e.target.checked);
                setFieldErrors(prev => ({ ...prev, acceptedPrivacy: '' }));
                setError('');
              }}
              style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', cursor: 'pointer' }}
            />
            <label htmlFor="acceptPrivacy" style={{ fontSize: '0.95rem', lineHeight: '1.5', cursor: 'pointer' }}>
              J'accepte la <a href="/privacy-policy.html" target="_blank" rel="noreferrer">Politique de Confidentialité</a>
            </label>
          </div>
          {fieldErrors.acceptedPrivacy && <span className="form-error" style={{ display: 'block', marginBottom: '16px' }}>{fieldErrors.acceptedPrivacy}</span>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !acceptedPrivacy}>
            {loading ? 'Inscription...' : 'Créer un compte'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;