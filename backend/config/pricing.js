// filepath: backend/config/pricing.js
/**
 * Catalogue des tarifs de publication LocaPlus
 * Tous les prix sont en Franc CFA (XOF)
 */

const pricing = {
  // Tarifs par catégorie
  categories: {
    immobilier: {
      name: 'Immobilier',
      price: 5000, // Prix par mois
      description: 'Location ou vente de biens immobiliers',
      features: [
        'Publication pour 30 jours',
        'Jusqu\'à 5 photos',
        'Affichage en priorité',
        'Support client dédié'
      ]
    },
    vehicule: {
      name: 'Véhicule',
      price: 4000,
      description: 'Location ou vente de véhicules',
      features: [
        'Publication pour 30 jours',
        'Jusqu\'à 8 photos',
        'Affichage en priorité',
        'Support client dédié'
      ]
    },
    materiaux: {
      name: 'Matériaux de construction',
      price: 3000,
      description: 'Vente de matériaux de construction',
      features: [
        'Publication pour 30 jours',
        'Jusqu\'à 5 photos',
        'Affichage en priorité',
        'Support client dédié'
      ]
    },
    technicien: {
      name: 'Technicien',
      price: 2000,
      description: 'Services techniques et artisanaux',
      features: [
        'Publication pour 30 jours',
        'Photo de profil',
        'Affichage en priorité',
        'Support client dédié'
      ]
    }
  },

  // Options supplémentaires
  options: {
    urgent: {
      name: 'Publication urgente',
      price: 2000,
      description: 'Votre annonce apparaît en haut de la liste pendant 7 jours'
    },
    spotlight: {
      name: 'Mise en avant',
      price: 5000,
      description: 'Votre annonce apparaît dans le carousel principal pendant 7 jours'
    },
    featured: {
      name: 'Annonce VIP',
      price: 10000,
      description: 'Annonce en évidence avec badge spécial pendant 30 jours'
    }
  },

  // Durée de publication
  durations: [
    { days: 7, label: '7 jours', discount: 0 },
    { days: 14, label: '14 jours', discount: 10 },
    { days: 30, label: '30 jours', discount: 20 },
    { days: 90, label: '90 jours', discount: 30 }
  ],

  // Méthodes de paiement acceptées
  paymentMethods: [
    { id: 'wave', name: 'Wave', type: 'mobile_money', logo: '💳' },
    { id: 'orange_money', name: 'Orange Money', type: 'mobile_money', logo: '🟠' },
    { id: 'mtn', name: 'MTN Mobile Money', type: 'mobile_money', logo: '🟡' },
    { id: 'moov', name: 'Moov Money', type: 'mobile_money', logo: '🔵' },
    { id: 'card', name: 'Carte bancaire', type: 'card', logo: '💳' }
  ],

  // Obtenir le prix d'une catégorie
  getCategoryPrice: (category) => {
    return pricing.categories[category]?.price || 0;
  },

  // Calculer le prix avec durée
  calculatePrice: (category, durationDays = 30) => {
    const basePrice = pricing.getCategoryPrice(category);
    const duration = pricing.durations.find(d => d.days === durationDays);
    const discount = duration?.discount || 0;
    
    return {
      base: basePrice,
      discount: discount,
      final: Math.round(basePrice * (1 - discount / 100))
    };
  }
};

module.exports = pricing;