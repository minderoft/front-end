// filepath: backend/middleware/validation.js
const xss = require('xss');

// Nettoyer les entrées pour prévenir XSS
const sanitize = (input) => {
  if (typeof input === 'string') {
    return xss(input.trim());
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitize(input[key]);
    }
    return sanitized;
  }
  return input;
};

// Middleware de sanitization
const sanitizeInput = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
};

// Schémas de validation
const schemas = {
  register: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, minLength: 6 },
    name: { type: 'string', required: true, minLength: 2 },
    phone: { type: 'string', required: false },
  },
  login: {
    email: { type: 'email', required: true },
    password: { type: 'string', required: true },
  },
  announcement: {
    category: { type: 'enum', required: true, values: ['immobilier', 'vehicule', 'materiaux', 'technicien'] },
    type: { type: 'enum', required: false, values: ['vente', 'location'] },
    title: { type: 'string', required: true, minLength: 3, maxLength: 255 },
    description: { type: 'string', required: false, maxLength: 5000 },
    price: { type: 'number', required: false, min: 0 },
    location: { type: 'string', required: true, minLength: 2 },
  },
  payment: {
    announcementId: { type: 'uuid', required: true },
    method: { type: 'enum', required: true, values: ['wave', 'orange_money', 'mtn', 'moov', 'card'] },
    amount: { type: 'number', required: true, min: 1 },
  },
  contact: {
    name: { type: 'string', required: true, minLength: 2 },
    email: { type: 'email', required: true },
    subject: { type: 'string', required: false },
    message: { type: 'string', required: true, minLength: 10 },
  },
};

// Valider les données selon le schéma
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Schéma de validation non trouvé' });
    }

    const errors = [];

    for (const field in schema) {
      const rules = schema[field];
      const value = req.body[field];

      // Vérification requise
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Le champ "${field}" est requis`);
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Validation du type email
      if (rules.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Le champ "${field}" doit être un email valide`);
        }
      }

      // Validation de type string
      if (rules.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`Le champ "${field}" doit être une chaîne de caractères`);
        } else {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Le champ "${field}" doit contenir au moins ${rules.minLength} caractères`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Le champ "${field}" doit contenir au maximum ${rules.maxLength} caractères`);
          }
        }
      }

      // Validation de type number
      if (rules.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`Le champ "${field}" doit être un nombre`);
        } else {
          if (rules.min !== undefined && numValue < rules.min) {
            errors.push(`Le champ "${field}" doit être au minimum ${rules.min}`);
          }
        }
      }

      // Validation enum
      if (rules.type === 'enum' && rules.values) {
        if (!rules.values.includes(value)) {
          errors.push(`Le champ "${field}" doit être une des valeurs: ${rules.values.join(', ')}`);
        }
      }

      // Validation UUID
      if (rules.type === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          errors.push(`Le champ "${field}" doit être un UUID valide`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation échouée', details: errors });
    }

    next();
  };
};

module.exports = {
  sanitize,
  sanitizeInput,
  validate,
  schemas,
};