const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { announcementId, reason } = req.body;

    if (!announcementId || !reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'announcementId et reason sont requis' });
    }

    const announcement = await query('SELECT id FROM announcements WHERE id = ?', [announcementId]);
    if (announcement.length === 0) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    const reportId = uuidv4();
    await query(
      'INSERT INTO reports (id, announcement_id, reporter_id, reason) VALUES (?, ?, ?, ?)',
      [reportId, announcementId, req.user.id, reason.trim()]
    );

    res.json({ message: 'Signalement envoyé et enregistré' });
  } catch (error) {
    console.error('Erreur création report:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reports = await query(
      `SELECT r.id, r.reason, r.created_at, r.updated_at,
              a.id as announcement_id, a.title as announcement_title,
              u.id as reporter_id, u.name as reporter_name
       FROM reports r
       JOIN announcements a ON r.announcement_id = a.id
       JOIN users u ON r.reporter_id = u.id
       ORDER BY r.created_at DESC`
    );

    res.json({ reports });
  } catch (error) {
    console.error('Erreur récupération reports:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
