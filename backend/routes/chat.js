const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Liste les conversations de l'utilisateur connecté
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await query(
      `SELECT
        c.id,
        c.client_id,
        c.provider_id,
        c.service_id,
        a.title AS service_title,
        a.category AS service_category,
        u.name AS contact_name,
        u.phone AS contact_phone,
        u.email AS contact_email,
        COALESCE(
          (SELECT m.text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
          ''
        ) AS last_message,
        COALESCE(
          (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
          c.created_at
        ) AS last_message_at
      FROM conversations c
      JOIN announcements a ON a.id = c.service_id
      JOIN users u ON u.id = IF(c.client_id = ?, c.provider_id, c.client_id)
      WHERE c.client_id = ? OR c.provider_id = ?
      ORDER BY last_message_at DESC,
               c.created_at DESC`,
      [userId, userId, userId]
    );

    res.json({ conversations });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des conversations' });
  }
});

// Récupère les messages d'une conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    if (!conversation.length) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    const conv = conversation[0];
    if (conv.client_id !== userId && conv.provider_id !== userId) {
      return res.status(403).json({ error: 'Accès refusé à cette conversation' });
    }

    const messages = await query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.text, m.created_at,
              u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    res.json({ messages, conversation: conv });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des messages' });
  }
});

// Crée ou récupère une conversation entre client et prestataire
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.id;
    const { serviceId, providerId } = req.body;

    if (!serviceId || !providerId) {
      return res.status(400).json({ error: 'Le service et le prestataire sont requis' });
    }

    if (clientId === providerId) {
      return res.status(400).json({ error: 'Impossible de démarrer une conversation avec vous-même' });
    }

    const announcement = await query('SELECT id, user_id FROM announcements WHERE id = ?', [serviceId]);
    if (!announcement.length || announcement[0].user_id !== providerId) {
      return res.status(400).json({ error: 'Annonce ou prestataire invalide' });
    }

    const existing = await query(
      'SELECT * FROM conversations WHERE client_id = ? AND provider_id = ? AND service_id = ? LIMIT 1',
      [clientId, providerId, serviceId]
    );

    if (existing.length) {
      return res.json({ conversation: existing[0] });
    }

    const id = uuidv4();
    await query(
      'INSERT INTO conversations (id, client_id, provider_id, service_id) VALUES (?, ?, ?, ?)',
      [id, clientId, providerId, serviceId]
    );

    res.status(201).json({ conversation: { id, client_id: clientId, provider_id: providerId, service_id: serviceId } });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la conversation' });
  }
});

// Envoie un message dans une conversation existante
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.user.id;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ error: 'La conversation et le contenu du message sont requis' });
    }

    const conversation = await query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    if (!conversation.length) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    const conv = conversation[0];
    if (conv.client_id !== senderId && conv.provider_id !== senderId) {
      return res.status(403).json({ error: 'Vous ne pouvez pas envoyer un message dans cette conversation' });
    }

    const id = uuidv4();
    await query(
      'INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)',
      [id, conversationId, senderId, text.trim()]
    );

    const result = await query(
      'SELECT m.id, m.conversation_id, m.sender_id, m.text, m.created_at, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?',
      [id]
    );

    res.status(201).json({ message: result[0] });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l envoi du message' });
  }
});

// ============================================
// Routes simplifées pour messagerie directe
// ============================================

// GET: Récupère les messages avec un utilisateur spécifique
router.get('/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (currentUserId === otherUserId) {
      return res.status(400).json({ error: 'Impossible de discuter avec vous-même' });
    }

    // Récupérer toutes les conversations entre ces deux utilisateurs
    const conversations = await query(
      `SELECT id FROM conversations 
       WHERE (client_id = ? AND provider_id = ?) 
          OR (client_id = ? AND provider_id = ?)`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    if (conversations.length === 0) {
      return res.json({ messages: [] });
    }

    const conversationIds = conversations.map(c => c.id);
    
    // Récupérer les messages de toutes ces conversations
    const messages = await query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.text, m.created_at, u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id IN (${conversationIds.map(() => '?').join(',')})
       ORDER BY m.created_at ASC`,
      conversationIds
    );

    res.json({ messages });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST: Envoie un message direct à un utilisateur
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, text } = req.body;
    const senderId = req.user.id;

    if (!receiver_id || !text || !text.trim()) {
      return res.status(400).json({ error: 'Le destinataire et le message sont requis' });
    }

    if (senderId === receiver_id) {
      return res.status(400).json({ error: 'Impossible de vous envoyer un message' });
    }

    // Chercher une conversation existante
    let conversation = await query(
      `SELECT id FROM conversations 
       WHERE (client_id = ? AND provider_id = ?) 
          OR (client_id = ? AND provider_id = ?)
       LIMIT 1`,
      [senderId, receiver_id, receiver_id, senderId]
    );

    let conversationId;

    if (conversation.length === 0) {
      // Créer une nouvelle conversation sans service_id
      conversationId = uuidv4();
      
      // Déterminer qui est client et qui est provider (arbitraire)
      await query(
        'INSERT INTO conversations (id, client_id, provider_id, service_id) VALUES (?, ?, ?, ?)',
        [conversationId, senderId, receiver_id, uuidv4()] // service_id fictif
      );
    } else {
      conversationId = conversation[0].id;
    }

    // Insérer le message
    const messageId = uuidv4();
    await query(
      'INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)',
      [messageId, conversationId, senderId, text.trim()]
    );

    const result = await query(
      'SELECT m.id, m.conversation_id, m.sender_id, m.text, m.created_at, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?',
      [messageId]
    );

    res.status(201).json({ message: result[0] });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
