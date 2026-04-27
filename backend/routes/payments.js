// filepath: backend/routes/payments.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { initializePayment, verifyPayment, getConfig, isConfigured } = require('../config/paystack');

const router = express.Router();

// Tarifs par catégorie (prix pour publier une annonce)
const PRICES = {
  immobilier: 5000,
  vehicule: 4000,
  materiaux: 3000,
  technicien: 2000,
};

// Obtenir les méthodes de paiement disponibles
router.get('/methods', (req, res) => {
  res.json({
    methods: [
      { id: 'wave', name: 'Wave', type: 'mobile_money' },
      { id: 'orange_money', name: 'Orange Money', type: 'mobile_money' },
      { id: 'mtn', name: 'MTN Mobile Money', type: 'mobile_money' },
      { id: 'moov', name: 'Moov Money', type: 'mobile_money' },
    ]
  });
});

// Obtenir les clés Paystack pour le frontend
router.get('/config', (req, res) => {
  const config = getConfig();
  res.json({
    publicKey: config.publicKey,
    isConfigured: config.isConfigured
  });
});

// Créer une demande de paiement avec Paystack
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { announcementId, method, amount } = req.body;

    // Vérifier si PayStack est configuré
    if (!isConfigured()) {
      return res.status(503).json({ 
        error: 'Service de paiement non disponible. Veuillez contacter l\'administrateur.' 
      });
    }

    // Validation de base
    if (!announcementId || !method || !amount) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    // Vérifier que l'annonce existe et appartient à l'utilisateur
    const announcementResult = await query(
      'SELECT * FROM announcements WHERE id = ? AND user_id = ?',
      [announcementId, req.user.id]
    );

    if (announcementResult.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée ou vous n\'êtes pas propriétaire' });
    }

    const announcement = announcementResult[0];

    // Vérifier le montant
    const expectedPrice = PRICES[announcement.category];
    if (amount !== expectedPrice) {
      return res.status(400).json({ 
        error: `Le montant doit être de ${expectedPrice} FCFA pour cette catégorie` 
      });
    }

    // Vérifier que le paiement n'a pas déjà été effectué
    if (announcement.payment_status) {
      return res.status(400).json({ error: 'Cette annonce a déjà été payée' });
    }

    // Générer un ID de transaction
    const transactionId = `TXN-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`;
    const paymentId = uuidv4();

    // Créer l'enregistrement de paiement
    await query(
      `INSERT INTO payments (id, user_id, announcement_id, amount, method, status, transaction_id)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [paymentId, req.user.id, announcementId, amount, method, transactionId]
    );

    // Initialiser le paiement Paystack
    const paymentData = await initializePayment(
      req.user.email,
      amount,
      {
        announcementId,
        paymentId,
        transactionId,
        method,
        userId: req.user.id,
        custom_fields: [
          {
            display_name: "Annonce",
            variable_name: "announcement_title",
            value: announcement.title
          },
          {
            display_name: "Méthode de paiement",
            variable_name: "payment_method",
            value: method
          }
        ]
      }
    );

    // Mettre à jour avec la référence Paystack
    await query(
      `UPDATE payments SET reference = ? WHERE id = ?`,
      [paymentData.reference, paymentId]
    );

    res.json({
      authorizationUrl: paymentData.authorization_url,
      reference: paymentData.reference,
      transactionId,
      amount: expectedPrice,
    });
  } catch (error) {
    console.error('Erreur paiement:', error);
    res.status(500).json({ error: 'Erreur serveur lors du paiement' });
  }
});

// Callback Paystack (webhook)
router.post('/callback', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante' });
    }

    // Vérifier le paiement avec Paystack
    const paymentData = await verifyPayment(reference);

    if (paymentData.status === 'success') {
      // Mettre à jour le paiement
      await query(
        `UPDATE payments SET status = 'completed', paid_at = NOW() WHERE reference = ?`,
        [reference]
      );

      // Trouver l'annonce associée
      const paymentResult = await query(
        'SELECT announcement_id FROM payments WHERE reference = ?',
        [reference]
      );

      if (paymentResult.length > 0) {
        const announcementId = paymentResult[0].announcement_id;
        
        // Activer l'annonce
        await query(
          `UPDATE announcements SET payment_status = true, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [announcementId]
        );
      }

      res.json({ status: 'success' });
    } else {
      await query(
        `UPDATE payments SET status = 'failed' WHERE reference = ?`,
        [reference]
      );
      res.json({ status: 'failed' });
    }
  } catch (error) {
    console.error('Erreur callback:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier un paiement par référence
router.get('/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    // Vérifier d'abord dans notre base de données
    const paymentResult = await query(
      'SELECT * FROM payments WHERE reference = ? AND user_id = ?',
      [reference, req.user.id]
    );

    if (paymentResult.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    const payment = paymentResult[0];

    // Si déjà complété, retourner directement
    if (payment.status === 'completed') {
      const announcementResult = await query(
        'SELECT * FROM announcements WHERE id = ?',
        [payment.announcement_id]
      );
      
      return res.json({
        status: 'completed',
        payment,
        announcement: announcementResult[0]
      });
    }

    // Vérifier avec Paystack
    try {
      const paymentData = await verifyPayment(reference);
      
      if (paymentData.status === 'success') {
        await query(
          `UPDATE payments SET status = 'completed', paid_at = NOW() WHERE id = ?`,
          [payment.id]
        );

        await query(
          `UPDATE announcements SET payment_status = true, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [payment.announcement_id]
        );

        const announcementResult = await query(
          'SELECT * FROM announcements WHERE id = ?',
          [payment.announcement_id]
        );

        res.json({
          status: 'completed',
          payment: { ...payment, status: 'completed' },
          announcement: announcementResult[0]
        });
      } else {
        res.json({ status: paymentData.status });
      }
    } catch (verifyError) {
      // En cas d'erreur de vérification Paystack, retourner le statut local
      res.json({ status: payment.status });
    }
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir l'historique des paiements
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, a.title as announcement_title, a.category
       FROM payments p
       JOIN announcements a ON p.announcement_id = a.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ payments: result });
  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;