// filepath: backend/routes/payments.js
const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { initializePayment, verifyPayment, getConfig, isConfigured } = require('../config/paystack');
const { getCategoryPrice, paymentMethods } = require('../config/pricing');

const router = express.Router();

const getPaymentReference = (body) => {
  if (!body) return null;
  if (body.reference) return body.reference;
  if (body.data && body.data.reference) return body.data.reference;
  return null;
};

const buildPaymentChannels = (method) => {
  if (method === 'card') {
    return ['card'];
  }
  return ['mobile_money'];
};

const verifyWebhookSignature = (req) => {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers['x-paystack-signature'];
  if (!signature) return false;

  const payload = req.body.toString();
  const expected = crypto.createHmac('sha512', secret).update(payload).digest('hex');
  return signature === expected;
};

const processPaymentUpdate = async (reference) => {
  const paymentData = await verifyPayment(reference);
  const paymentResult = await query('SELECT * FROM payments WHERE reference = ?', [reference]);

  if (paymentResult.length === 0) {
    throw new Error('Paiement introuvable en base');
  }

  const paymentRecord = paymentResult[0];

  if (paymentData.status === 'success') {
    await query(`UPDATE payments SET status = 'completed', paid_at = NOW() WHERE reference = ?`, [reference]);
    await query(`UPDATE announcements SET payment_status = true, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [paymentRecord.announcement_id]);
    return { status: 'success', payment: paymentData };
  }

  await query(`UPDATE payments SET status = 'failed' WHERE reference = ?`, [reference]);
  return { status: 'failed', payment: paymentData };
};

// Obtenir les méthodes de paiement disponibles
router.get('/methods', (req, res) => {
  res.json({ methods: paymentMethods });
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
    const { announcementId, method = 'card', amount } = req.body;

    if (!isConfigured()) {
      return res.status(503).json({ error: 'Service de paiement non disponible. Veuillez contacter l\'administrateur.' });
    }

    if (!announcementId || !amount) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const announcementResult = await query('SELECT * FROM announcements WHERE id = ? AND user_id = ?', [announcementId, req.user.id]);
    if (announcementResult.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée ou vous n\'êtes pas propriétaire' });
    }

    const announcement = announcementResult[0];
    const expectedPrice = await getCategoryPrice(announcement.category);
    if (expectedPrice === null) {
      return res.status(400).json({ error: 'Prix de publication introuvable pour cette catégorie' });
    }

    if (Number(amount) !== Number(expectedPrice)) {
      return res.status(400).json({
        error: `Le montant doit être de ${expectedPrice} FCFA pour cette catégorie`,
        expectedAmount: expectedPrice,
        category: announcement.category,
      });
    }

    if (announcement.payment_status) {
      return res.status(400).json({ error: 'Cette annonce a déjà été payée' });
    }

    const transactionId = `TXN-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`;
    const paymentId = uuidv4();
    const channels = buildPaymentChannels(method);
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || process.env.FRONTEND_URL || null;

    await query(
      `INSERT INTO payments (id, user_id, announcement_id, amount, method, status, transaction_id) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [paymentId, req.user.id, announcementId, expectedPrice, method, transactionId]
    );

    const paymentData = await initializePayment(
      req.user.email,
      expectedPrice,
      {
        announcementId,
        paymentId,
        transactionId,
        method,
        userId: req.user.id,
        custom_fields: [
          {
            display_name: 'Annonce',
            variable_name: 'announcement_title',
            value: announcement.title,
          },
          {
            display_name: 'Méthode de paiement',
            variable_name: 'payment_method',
            value: method,
          },
        ],
      },
      channels,
      callbackUrl
    );

    await query(`UPDATE payments SET reference = ? WHERE id = ?`, [paymentData.reference, paymentId]);

    res.json({
      authorizationUrl: paymentData.authorization_url,
      reference: paymentData.reference,
      transactionId,
      amount: expectedPrice,
    });
  } catch (error) {
    console.error('Erreur paiement:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Erreur serveur lors du paiement' });
  }
});

// Callback Paystack (webhook)
router.post('/callback', async (req, res) => {
  try {
    const reference = getPaymentReference(req.body);
    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante' });
    }

    const result = await processPaymentUpdate(reference);
    res.json(result);
  } catch (error) {
    console.error('Erreur callback:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const reference = req.body.reference || req.body.transactionId;
    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante' });
    }

    const paymentResult = await query('SELECT * FROM payments WHERE reference = ? AND user_id = ?', [reference, req.user.id]);
    if (paymentResult.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paymentResult[0].status === 'completed') {
      return res.json({ status: 'completed', payment: paymentResult[0] });
    }

    const result = await processPaymentUpdate(reference);
    res.json(result);
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification' });
  }
});

router.get('/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;
    const paymentResult = await query('SELECT * FROM payments WHERE reference = ? AND user_id = ?', [reference, req.user.id]);

    if (paymentResult.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paymentResult[0].status === 'completed') {
      return res.json({ status: 'completed', payment: paymentResult[0] });
    }

    const result = await processPaymentUpdate(reference);
    res.json(result);
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ error: 'Signature webhook invalide' });
    }

    const payload = JSON.parse(req.body.toString());
    const reference = getPaymentReference(payload);
    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante' });
    }

    const result = await processPaymentUpdate(reference);
    res.json(result);
  } catch (error) {
    console.error('Erreur webhook:', error);
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