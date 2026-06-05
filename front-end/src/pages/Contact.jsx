// filepath: front-end/src/pages/Contact.jsx
import { useState } from 'react';
import { contactService } from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await contactService.send(formData);
      setSuccess('Message envoyé avec succès ! Nous vous répondrons sous 24-48h.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page" style={{ maxWidth: '600px' }}>
      <h1 className="mb-4">Contactez-nous</h1>
      
      <p className="text-muted mb-4">
        Vous avez une question ou besoin d'aide ? N'hésitez pas à nous contacter.
        Notre équipe vous répondra dans les plus brefs délais.
      </p>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="form-label">Nom complet *</label>
            <input
              type="text"
              name="name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm text-sm outline-none block"
              placeholder="Votre nom"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm text-sm outline-none block"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="form-label">Sujet *</label>
            <select
              name="subject"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm text-sm outline-none block"
              value={formData.subject}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un sujet</option>
              <option value="support">Support technique</option>
              <option value="commercial">Question commerciale</option>
              <option value="partnership">Partenariat</option>
              <option value="bug">Signaler un problème</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="form-label">Message *</label>
            <textarea
              name="message"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-sm text-sm outline-none block min-h-[120px]"
              placeholder="Décrivez votre demande en détail..."
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer le message'}
          </button>
        </div>
      </form>

      <div className="contact-info mt-4">
        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 className="mb-3">Autres moyens de nous contacter</h3>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-center gap-2">
              <span style={{ fontSize: '1.25rem' }}>📧</span>
              <span>Email: locaplus3@gmail.com</span>
            </div>
            <div className="d-flex align-center gap-2">
              <span style={{ fontSize: '1.25rem' }}>📱</span>
              <span>Téléphone: +225 05 85 78 98 81</span>
            </div>
            <div className="d-flex align-center gap-2">
              <span style={{ fontSize: '1.25rem' }}>🕐</span>
              <span>Disponibilité: 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;