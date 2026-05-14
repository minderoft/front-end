import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(3);

  const reference = searchParams.get('reference');
  const status = searchParams.get('status');

  useEffect(() => {
    if (status !== 'success') {
      navigate('/');
      return;
    }

    // Countdown pour redirection automatique
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
    return null; // Sera redirigé
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#10B981"/>
            <path d="M26 40L36 50L54 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="success-title">Paiement réussi !</h1>

        <div className="success-content">
          <p className="success-message">
            Votre annonce a été publiée avec succès sur LocaPlus.
          </p>

          {reference && (
            <p className="success-reference">
              Référence de paiement : <strong>{reference}</strong>
            </p>
          )}

          <div className="success-info">
            <p>🎉 Votre annonce est maintenant visible par tous les utilisateurs !</p>
            <p>📍 Elle apparaîtra dans les résultats de recherche et sur la carte.</p>
          </div>

          <div className="success-actions">
            <p className="redirect-message">
              Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </p>

            <div className="success-buttons">
              <button
                className="btn btn-primary"
                onClick={() => navigate(user ? '/dashboard' : '/announcements')}
              >
                {user ? 'Voir mes annonces' : 'Voir les annonces'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .success-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .success-container {
          background: white;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }

        .success-icon {
          margin-bottom: 24px;
        }

        .success-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .success-content {
          color: #6b7280;
        }

        .success-message {
          font-size: 1.125rem;
          margin-bottom: 12px;
          color: #374151;
        }

        .success-reference {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .success-info {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          text-align: left;
        }

        .success-info p {
          margin: 8px 0;
          font-size: 0.875rem;
        }

        .success-actions {
          margin-top: 24px;
        }

        .redirect-message {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .success-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .success-container {
            padding: 24px;
          }

          .success-title {
            font-size: 1.5rem;
          }

          .success-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Success;