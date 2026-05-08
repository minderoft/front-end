// filepath: backend/routes/pricing.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const pricing = require('../config/pricing');
const { query } = require('../config/db');
const router = express.Router();

// Obtenir tous les tarifs
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const allPricing = await pricing.getAllPricing();
    
    if (!allPricing || allPricing.length === 0) {
      console.warn('⚠️ Aucun tarif trouvé en base de données');
      return res.status(500).json({ error: 'Tarifs non initialisés en base de données' });
    }

    const categories = allPricing.filter((item) => item.type === 'publication');
    const boost = allPricing.filter((item) => item.type === 'boost');

    const elapsed = Date.now() - startTime;
    console.log(`✅ Tarifs récupérés en ${elapsed}ms (${allPricing.length} items)`);

    res.json({
      categories,
      boost,
      options: [],
      durations: pricing.durations,
      paymentMethods: pricing.paymentMethods,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ Erreur récupération tarifs (${elapsed}ms):`, error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des tarifs', details: error.message });
  }
});

// Obtenir le prix d'une catégorie spécifique
router.get('/category/:categoryId', async (req, res) => {
  try {
    const category = await pricing.getPricingByCategory(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({
      id: category.category,
      name: category.name,
      description: category.description,
      price: category.price,
      features: category.features,
      type: category.type,
      durations: pricing.durations,
    });
  } catch (error) {
    console.error('Erreur récupération catégorie tarif:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du tarif' });
  }
});

// Obtenir les options supplémentaires
router.get('/options', async (req, res) => {
  res.json({ options: [] });
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { price, name, description, active } = req.body;

    const existing = await query('SELECT id FROM pricing WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tarif introuvable' });
    }

    await query(
      `UPDATE pricing SET price = ?, name = ?, description = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [price, name, description, active, id]
    );

    const updated = await query('SELECT id, type, category, name, description, price, features, active FROM pricing WHERE id = ?', [id]);
    res.json({ pricing: updated[0] });
  } catch (error) {
    console.error('Erreur mise à jour tarif:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du tarif' });
  }
});

module.exports = router;