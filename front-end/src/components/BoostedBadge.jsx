// filepath: front-end/src/components/BoostedBadge.jsx
// Composant pour afficher le badge Annonce sponsorisée/boostée

import React from 'react';
import '../styles/BoostedBadge.css';

const BoostedBadge = ({ isBoosted, boostExpiry }) => {
  if (!isBoosted) return null;

  const isActive = !boostExpiry || new Date(boostExpiry) > new Date();

  if (!isActive) return null;

  return (
    <div className="boosted-badge">
      <span className="rocket">🚀</span>
      <span>Sponsorisé</span>
    </div>
  );
};

export default BoostedBadge;
