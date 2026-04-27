// filepath: backend/routes/contact.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Envoyer un message de contact
router.post('/', validate('contact'), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const id = uuidv4();
    await query(
      `INSERT INTO contact_messages (id, name, email, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, subject || null, message]
    );

    const result = await query('SELECT * FROM contact_messages WHERE id = ?', [id]);

    res.status(201).json({
      message: 'Message envoyé avec succès. Nous vous répondrons sous 24-48h.',
      contactMessage: result[0],
    });
  } catch (error) {
    console.error('Erreur contact:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'envoi du message' });
  }
});

// Obtenir tous les messages (admin uniquement)
router.get('/', async (req, res) => {
  try {
    // Note: En production, ajouter l'authentification admin
    const result = await query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 50'
    );

    res.json({ messages: result });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;