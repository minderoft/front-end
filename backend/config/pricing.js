// filepath: backend/config/pricing.js
const { query } = require('./db');

const durations = [
  { days: 7, label: '7 jours', discount: 0 },
  { days: 14, label: '14 jours', discount: 10 },
  { days: 30, label: '30 jours', discount: 20 },
  { days: 90, label: '90 jours', discount: 30 },
];

const paymentMethods = [
  { id: 'wave', name: 'Wave', type: 'mobile_money', logo: '💳' },
  { id: 'orange_money', name: 'Orange Money', type: 'mobile_money', logo: '🟠' },
  { id: 'mtn', name: 'MTN Mobile Money', type: 'mobile_money', logo: '🟡' },
  { id: 'moov', name: 'Moov Money', type: 'mobile_money', logo: '🔵' },
  { id: 'card', name: 'Carte bancaire', type: 'card', logo: '💳' },
];

const parseFeatures = (features) => {
  if (!features) return [];
  try {
    return JSON.parse(features);
  } catch (err) {
    console.error('Erreur parsing pricing features:', err.message, features);
    return [];
  }
};

const formatPricingRow = (row) => ({
  ...row,
  price: Number(row.price),
  features: parseFeatures(row.features),
});

const getAllPricing = async () => {
  const rows = await query(
    'SELECT id, type, category, name, description, price, features FROM pricing WHERE active = 1 ORDER BY type, category IS NULL ASC, category'
  );
  return rows.map(formatPricingRow);
};

const getPricingByCategory = async (category) => {
  if (!category) return null;
  const rows = await query(
    'SELECT id, type, category, name, description, price, features FROM pricing WHERE type = ? AND category = ? AND active = 1 LIMIT 1',
    ['publication', category.toString()]
  );
  return rows[0] ? formatPricingRow(rows[0]) : null;
};

const getPricingByType = async (type) => {
  const rows = await query(
    'SELECT id, type, category, name, description, price, features FROM pricing WHERE type = ? AND active = 1 ORDER BY category IS NULL ASC, category',
    [type]
  );
  return rows.map(formatPricingRow);
};

const getCategoryPrice = async (category) => {
  if (!category) return null;
  const pricingRow = await getPricingByCategory(category.toString());
  return pricingRow ? pricingRow.price : null;
};

const getBoostPrice = async () => {
  const rows = await getPricingByType('boost');
  return rows[0] || null;
};

module.exports = {
  durations,
  paymentMethods,
  getAllPricing,
  getPricingByCategory,
  getPricingByType,
  getCategoryPrice,
  getBoostPrice,
};