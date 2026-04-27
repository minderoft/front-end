// filepath: backend/config/paystack.js
const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Vérifier si les clés sont configurées
const isConfigured = () => {
  return PAYSTACK_SECRET_KEY && 
         PAYSTACK_SECRET_KEY !== 'sk_test_your_secret_key' &&
         PAYSTACK_SECRET_KEY.startsWith('sk_');
};

module.exports = {
  // Vérifier si PayStack est configuré
  isConfigured,
  
  // Obtenir les clés
  getConfig: () => ({
    secretKey: PAYSTACK_SECRET_KEY,
    publicKey: PAYSTACK_PUBLIC_KEY,
    isConfigured: isConfigured(),
  }),

  // Initialiser un paiement Paystack
  initializePayment: async (email, amount, metadata) => {
    // Vérifier si PayStack est configuré
    if (!isConfigured()) {
      throw new Error('PayStack n\'est pas configuré. Veuillez configurer les clés API dans le fichier .env');
    }

    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Paystack utilise les kobo (FCFA × 100)
          currency: 'XOF', // Franc CFA (West African)
          channels: ['mobile_money', 'card'],
          metadata: metadata || {},
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Erreur Paystack initialize:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Vérifier un paiement Paystack
  verifyPayment: async (reference) => {
    if (!isConfigured()) {
      throw new Error('PayStack n\'est pas configuré');
    }

    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Erreur Paystack verify:', error.response?.data || error.message);
      throw error;
    }
  },
};