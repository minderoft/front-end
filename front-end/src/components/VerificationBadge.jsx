// filepath: front-end/src/components/VerificationBadge.jsx
// Composant pour afficher le badge de vérification RSI

import React from 'react';
import '../styles/VerificationBadge.css';

const VerificationBadge = ({ isVerified, size = 'default', showTooltip = true }) => {
  if (!isVerified) return null;

  return (
    <div className={`verification-badge ${size}`} title={showTooltip ? 'Vendeur vérifié' : ''}>
      <span className="checkmark">✓</span>
    </div>
  );
};

export default VerificationBadge;
