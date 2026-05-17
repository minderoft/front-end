import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(4);

  const reference = searchParams.get('reference');
  const status = searchParams.get('status');
  const announcementId = searchParams.get('announcementId');

  useEffect(() => {
    if (status !== 'success') {
      navigate('/payment-error');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate(user ? '/dashboard' : '/announcements');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate, user]);

  if (status !== 'success') {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '36px',
        textAlign: 'center',
        boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)',
        maxWidth: '520px',
        width: '100%',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="44" cy="44" r="44" fill="#10B981" />
            <path d="M28 45L39 57L60 35" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#111827' }}>Paiement réussi !</h1>

        <p style={{ marginBottom: '18px', color: '#4b5563', fontSize: '1rem' }}>
          Votre annonce est désormais active et visible sur LocaPlus.
        </p>

        {reference && (
          <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.95rem' }}>
            Référence de paiement : <strong>{reference}</strong>
          </p>
        )}

        <div style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'left',
          color: '#475569',
          fontSize: '0.96rem',
        }}>
          <p style={{ margin: '0 0 8px' }}>🎉 Votre annonce est en ligne et consultable par tous.</p>
          <p style={{ margin: 0 }}>🔎 Elle apparaîtra dans les recherches publiques et sur la page des annonces.</p>
        </div>

        <p style={{ margin: '0 0 24px', color: '#6b7280' }}>
          Redirection automatique dans <strong>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}...
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {announcementId && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/announcements/${announcementId}`)}
              style={{ width: '100%' }}
            >
              Voir l'annonce publiée
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => navigate(user ? '/dashboard' : '/announcements')}
            style={{ width: '100%' }}
          >
            {user ? 'Voir mon dashboard' : 'Explorer les annonces'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ width: '100%' }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;
