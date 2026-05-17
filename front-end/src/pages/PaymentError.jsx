import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Une erreur est survenue lors du paiement.');

  const reference = searchParams.get('reference');
  const errorCode = searchParams.get('message');

  useEffect(() => {
    if (errorCode === 'payment_failed') {
      setMessage('Le paiement a échoué. Veuillez réessayer ou contacter le support.');
      return;
    }

    if (errorCode === 'invalid_payment') {
      setMessage('Données de paiement invalides. Vérifiez les informations et recommencez.');
      return;
    }
  }, [errorCode]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="44" cy="44" r="44" fill="#ef4444" />
            <path d="M30 30L58 58" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M58 30L30 58" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#111827' }}>Paiement interrompu</h1>

        <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '1rem' }}>
          {message}
        </p>

        {reference && (
          <p style={{ marginBottom: '18px', color: '#6b7280', fontSize: '0.95rem' }}>
            Référence de transaction : <strong>{reference}</strong>
          </p>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          <button
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '12px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/announcements')}
          >
            Retour aux annonces
          </button>

          <button
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              color: '#111827',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;
