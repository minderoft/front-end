// filepath: backend/config/paystack.js
const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const isConfigured = () => {
  return PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY.startsWith('sk_');
};

const getConfig = () => ({
  publicKey: PAYSTACK_PUBLIC_KEY,
  isConfigured: isConfigured(),
});

const initializePayment = async (
  email,
  amount,
  metadata = {},
  channels = ['mobile_money', 'card'],
  callbackUrl
) => {
  if (!isConfigured()) {
    throw new Error('PayStack n\'est pas configuré. Veuillez configurer les clés API dans le fichier .env');
  }

  try {
    const body = {
      email,
      amount: Math.round(Number(amount) * 100),
      currency: 'XOF',
      channels,
      metadata,
    };

    if (callbackUrl) {
      body.callback_url = callbackUrl;
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      body,
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
};

const verifyPayment = async (reference) => {
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
};

module.exports = {
  isConfigured,
  getConfig,
  initializePayment,
  verifyPayment,
};