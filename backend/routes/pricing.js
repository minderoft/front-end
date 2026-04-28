// filepath: backend/routes/pricing.js
const express = require('express');
const router = express.Router();
const pricing = require('../config/pricing');

// Obtenir tous les tarifs
router.get('/', (req, res) => {
  res.json({
    categories: Object.entries(pricing.categories).map(([key, cat]) => ({
      id: key,
      ...cat
    })),
    options: Object.entries(pricing.options).map(([key, opt]) => ({
      id: key,
      ...opt
    })),
    durations: pricing.durations,
    paymentMethods: pricing.paymentMethods,
    lastUpdated: new Date().toISOString()
  });
});

// Obtenir le prix d'une catégorie spécifique
router.get('/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const category = pricing.categories[categoryId];
  
  if (!category) {
    return res.status(404).json({ error: 'Catégorie non trouvée' });
  }
  
  res.json({
    id: categoryId,
    ...category,
    prices: pricing.durations.map(d => ({
      ...d,
      price: pricing.calculatePrice(categoryId, d.days).final
    }))
  });
});

// Obtenir les options supplémentaires
router.get('/options', (req, res) => {
  res.json({
    options: Object.entries(pricing.options).map(([key, opt]) => ({
      id: key,
      ...opt
    }))
  });
});

// Calculer un prix avec durée et options
router.post('/calculate', (req, res) => {
  const { categoryId, durationDays = 30, options = [] } = req.body;
  
  const category = pricing.categories[categoryId];
  if (!category) {
    return res.status(404).json({ error: 'Catégorie non trouvée' });
  }
  
  const basePrice = pricing.calculatePrice(categoryId, durationDays);
  let totalPrice = basePrice.final;
  const appliedOptions = [];
  
  // Ajouter les options
  for (const optId of options) {
    const opt = pricing.options[optId];
    if (opt) {
      totalPrice += opt.price;
      appliedOptions.push(opt);
    }
  }
  
  res.json({
    category: { id: categoryId, name: category.name },
    duration: pricing.durations.find(d => d.days === durationDays),
    basePrice: basePrice.base,
    discount: basePrice.discount,
    options: appliedOptions,
    total: totalPrice
  });
});

module.exports = router;