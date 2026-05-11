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
      await query(`UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE reference = ?`, [reference]);
      await query(`UPDATE announcements SET payment_status = 1, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [paymentRecord.announcement_id]);
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

// Callback Paystack - Redirection utilisateur (GET)
router.get('/callback', async (req, res) => {
  try {
    console.log('✅ [PAYSTACK REDIRECT] Requête GET reçue');
    console.log('   Query params:', JSON.stringify(req.query, null, 2));
    console.log('   URL complète:', req.originalUrl);
    
    const reference = req.query.trxref || req.query.reference;
    if (!reference) {
      console.error('❌ [PAYSTACK REDIRECT] Référence manquante dans query params');
      return res.redirect(`${process.env.FRONTEND_URL || 'https://zel-chi.vercel.app'}/?error=payment_reference_missing`);
    }

    console.log(`📊 [PAYSTACK REDIRECT] Vérification du paiement: ${reference}`);
    
    // Vérifier le paiement auprès de Paystack
    const paymentData = await verifyPayment(reference);
    console.log('   Statut Paystack:', paymentData.status);
    
    if (paymentData.status === 'success') {
      // Récupérer le paiement en base
      const paymentResult = await query('SELECT * FROM payments WHERE reference = ?', [reference]);
      
      if (paymentResult.length === 0) {
        console.error('❌ [PAYSTACK REDIRECT] Paiement non trouvé en base');
        return res.redirect(`${process.env.FRONTEND_URL || 'https://zel-chi.vercel.app'}/?error=payment_not_found`);
      }

      const payment = paymentResult[0];
      
      // Mettre à jour le paiement et l'annonce
      await query(`UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE reference = ?`, [reference]);
      await query(`UPDATE announcements SET payment_status = 1, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [payment.announcement_id]);
      
      console.log(`✅ [PAYSTACK REDIRECT] Paiement confirmé et annonce activée - ID: ${payment.announcement_id}`);
      
      // Rediriger vers la page de succès
      const successUrl = `${process.env.FRONTEND_URL || 'https://zel-chi.vercel.app'}/success?reference=${reference}&status=success`;
      console.log('   Redirection vers:', successUrl);
      return res.redirect(successUrl);
      
    } else {
      // Paiement échoué
      console.log(`❌ [PAYSTACK REDIRECT] Paiement échoué - Statut: ${paymentData.status}`);
      await query(`UPDATE payments SET status = 'failed' WHERE reference = ?`, [reference]);
      
      const errorUrl = `${process.env.FRONTEND_URL || 'https://zel-chi.vercel.app'}/?error=payment_failed&reference=${reference}`;
      return res.redirect(errorUrl);
    }
    
  } catch (error) {
    console.error('❌ [PAYSTACK REDIRECT] Erreur:', error.message);
    console.error('   Stack:', error.stack);
    
    const errorUrl = `${process.env.FRONTEND_URL || 'https://zel-chi.vercel.app'}/?error=payment_error&message=${encodeURIComponent(error.message)}`;
    return res.redirect(errorUrl);
  }
});

// Callback Paystack (webhook)
router.post('/callback', async (req, res) => {
  try {
    console.log('✅ [PAYSTACK CALLBACK] Requête reçue');
    console.log('   Path:', req.path);
    console.log('   URL:', req.originalUrl);
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    
    const reference = getPaymentReference(req.body);
    if (!reference) {
      console.error('❌ [PAYSTACK CALLBACK] Référence manquante dans le body');
      return res.status(400).json({ error: 'Référence manquante' });
    }

    console.log(`📊 [PAYSTACK CALLBACK] Traitement de la référence: ${reference}`);
    const result = await processPaymentUpdate(reference);
    console.log(`✅ [PAYSTACK CALLBACK] Succès - Statut:`, result.status);
    res.json(result);
  } catch (error) {
    console.error('❌ [PAYSTACK CALLBACK] Erreur:', error.message);
    console.error('   Stack:', error.stack);
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
    console.log('✅ [PAYSTACK WEBHOOK] Requête reçue');
    console.log('   Path:', req.path);
    console.log('   URL:', req.originalUrl);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    
    if (!verifyWebhookSignature(req)) {
      console.error('❌ [PAYSTACK WEBHOOK] Signature invalide');
      return res.status(401).json({ error: 'Signature webhook invalide' });
    }

    const payload = JSON.parse(req.body.toString());
    console.log('   Payload:', JSON.stringify(payload, null, 2));
    
    const reference = getPaymentReference(payload);
    if (!reference) {
      console.error('❌ [PAYSTACK WEBHOOK] Référence manquante');
      return res.status(400).json({ error: 'Référence manquante' });
    }

    console.log(`📊 [PAYSTACK WEBHOOK] Traitement de la référence: ${reference}`);
    const result = await processPaymentUpdate(reference);
    console.log(`✅ [PAYSTACK WEBHOOK] Succès - Statut:`, result.status);
    res.json(result);
  } catch (error) {
    console.error('❌ [PAYSTACK WEBHOOK] Erreur:', error.message);
    console.error('   Stack:', error.stack);
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