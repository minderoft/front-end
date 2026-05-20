-- ============================================
-- SCRIPT SQL POSTGRESQL POUR NEON.TECH
-- LocaPlus - Migration de MySQL à PostgreSQL
-- ============================================

-- 1. TABLE USERS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(60),
  role VARCHAR(50) DEFAULT 'user',
  accepted_policy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================

-- 2. TABLE ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  category VARCHAR(100),
  type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone VARCHAR(60),
  images TEXT,
  image_url TEXT,
  metadata TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status SMALLINT DEFAULT 0,
  -- Smart advertising / tracking fields
  is_sponsored BOOLEAN DEFAULT FALSE,
  ad_pack_type VARCHAR(50),
  ad_target_category VARCHAR(100),
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  whatsapp_clicks_count INTEGER DEFAULT 0,
  call_clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_announcements_user_id ON announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_sponsored ON announcements(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_announcements_ad_target_category ON announcements(ad_target_category);

-- ============================================

-- 3. TABLE PAYMENTS (avec paid_at)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  announcement_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255),
  reference VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

-- Index pour améliorer les recherches
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_announcement_id ON payments(announcement_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- ============================================

-- 4. TABLE CONTACT_MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- ============================================

-- 5. TABLE PRICING
CREATE TABLE IF NOT EXISTS pricing (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  features TEXT,
  active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================

-- 6. TABLE CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(provider_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(service_id) REFERENCES announcements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON conversations(provider_id);

-- ============================================

-- 7. TABLE MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
