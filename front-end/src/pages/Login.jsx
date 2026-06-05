// filepath: front-end/src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Adresse email invalide.';
    }

    if (!formData.password.trim()) {
      errors.password = 'Le mot de passe est requis.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Veuillez corriger les informations ci-dessous.');
      return;
    }

    setLoading(true);

    try {
      await login(formData.email.trim(), formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-lightest via-bg-primary to-bg-secondary flex items-center justify-center pt-20">
      <div className="container max-w-md">
        <div className="card shadow-xl">
          {/* Header */}
          <div className="card-header text-center space-y-4">
            <div className="w-16 h-16 rounded-xl bg-primary-lightest flex items-center justify-center mx-auto">
              <LogIn className="text-primary" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Connexion</h1>
              <p className="text-text-tertiary mt-2">Accédez à votre compte LocaPlus</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="card-body bg-error-light border-l-4 border-error rounded p-4">
              <p className="text-error font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Email Field */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="block text-sm font-semibold text-text-primary">
                  <Mail size={16} className="inline mr-2 text-primary" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm text-sm outline-none block ${fieldErrors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <span className="text-xs text-error font-medium">{fieldErrors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="block text-sm font-semibold text-text-primary">
                  <Lock size={16} className="inline mr-2 text-primary" />
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  className={`w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm text-sm outline-none block ${fieldErrors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                {fieldErrors.password && (
                  <span className="text-xs text-error font-medium">{fieldErrors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block btn-lg mt-8"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="card-footer text-center">
            <p className="text-sm text-text-tertiary">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-primary font-semibold hover:text-primary-light transition-colors">
                Créer un compte
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

export default Login;