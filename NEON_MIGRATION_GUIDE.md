# 🚀 Guide Migration MySQL → PostgreSQL (Neon.tech)

## 📋 Étapes de Configuration

### 1️⃣ Mise à jour des dépendances du backend

Remplace `mysql2` par `pg` dans `backend/package.json` :

```json
{
  "dependencies": {
    "pg": "^8.11.0"
  }
}
```

Puis exécute :
```bash
cd backend
npm install
```

---

### 2️⃣ Mise à jour du fichier `.env` dans le backend

**Ancien format (MySQL) :**
```
DATABASE_URL=mysql://user:password@host:3306/dbname
```

**Nouveau format (PostgreSQL/Neon) :**
```
DATABASE_URL=postgresql://neondb_owner:*PASSWORD*@ep-icy-truth-aluxmjbr.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

---

### 3️⃣ Mettre à jour la configuration du backend

**Remplace** `backend/config/db.js` par le nouveau contenu fourni dans `backend/config/db-postgresql.js`.

Copie le contenu de `db-postgresql.js` vers `db.js` :

```bash
cp backend/config/db-postgresql.js backend/config/db.js
```

---

### 4️⃣ Créer les tables dans Neon

Deux options :

#### Option A : Via le SQL Editor de Neon (Recommandé)
1. Connecte-toi à https://console.neon.tech
2. Ouvre le **SQL Editor** de ta base de données
3. Copie-colle le contenu de `backend/NEON_SETUP.sql`
4. Exécute le script complet

#### Option B : Via la CLI psql

```bash
psql "postgresql://neondb_owner:PASSWORD@ep-icy-truth-aluxmjbr.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require" < backend/NEON_SETUP.sql
```

---

### 5️⃣ Code React pour la Checkbox (Privacy Policy)

Voici le composant React complet à intégrer :

#### `front-end/src/components/PrivacyCheckbox.jsx`

```jsx
import React, { useState } from 'react';

const PrivacyCheckbox = ({ isRequired = true, onChange, value = false }) => {
  return (
    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
      <input
        type="checkbox"
        id="acceptPrivacy"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: '24px',
          height: '24px',
          minWidth: '24px',
          minHeight: '24px',
          cursor: 'pointer',
          marginTop: '2px'
        }}
        required={isRequired}
      />
      <label htmlFor="acceptPrivacy" style={{
        fontSize: '0.95rem',
        lineHeight: '1.5',
        cursor: 'pointer',
        userSelect: 'none',
        margin: 0
      }}>
        J'accepte la{' '}
        <a 
          href="/privacy-policy.html" 
          target="_blank" 
          rel="noreferrer"
          style={{ color: '#2563eb', textDecoration: 'none' }}
        >
          Politique de Confidentialité
        </a>
        {isRequired && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
    </div>
  );
};

export default PrivacyCheckbox;
```

---

### 6️⃣ Utilisation dans Register.jsx

```jsx
import PrivacyCheckbox from '../components/PrivacyCheckbox';

const Register = () => {
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  // ... autres états

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!acceptedPrivacy) {
      setError('Vous devez accepter la Politique de Confidentialité');
      return;
    }

    // ... validation reste du formulaire

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        accepted_policy: acceptedPrivacy,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... autres champs du formulaire ... */}

      <PrivacyCheckbox 
        value={acceptedPrivacy}
        onChange={setAcceptedPrivacy}
        isRequired={true}
      />

      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: '100%' }} 
        disabled={!acceptedPrivacy || loading}
      >
        {loading ? 'Inscription...' : 'Créer un compte'}
      </button>
    </form>
  );
};
```

---

### 7️⃣ Utilisation dans CreateAnnouncement.jsx

```jsx
import PrivacyCheckbox from '../components/PrivacyCheckbox';

const CreateAnnouncement = () => {
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  // ... autres états

  const handleCreateAnnouncement = async () => {
    if (!acceptedPrivacy) {
      setError('Vous devez accepter la Politique de Confidentialité');
      return;
    }

    // ... reste de la logique
  };

  return (
    <form>
      {/* ... autres champs du formulaire ... */}

      <PrivacyCheckbox 
        value={acceptedPrivacy}
        onChange={setAcceptedPrivacy}
        isRequired={true}
      />

      <button 
        type="submit" 
        disabled={!acceptedPrivacy || loading}
      >
        Créer l'annonce
      </button>
    </form>
  );
};
```

---

## 🔄 Vérification de la Migration

Après migration, vérifie que :

### ✅ La connexion fonctionne
```bash
cd backend
npm start
# Devrait afficher : ✅ PostgreSQL connexion établie
```

### ✅ Les tables sont créées
```bash
psql "postgresql://..." -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

### ✅ Paystack callback URL
- Vérifiée dans `backend/server.js`
- Utilise maintenant `https://loca-plus-hub.vercel.app` (à jour ✅)

### ✅ Privacy Policy Page
- Accès : `https://loca-plus-hub.vercel.app/privacy-policy.html`
- Bouton "Retour" : Positionné en bas-droit ✅
- Script scroll : Charge en haut de page ✅

### ✅ Formulaire Privacy Checkbox
- Obligatoire pour s'inscrire ✅
- Obligatoire pour créer une annonce ✅
- Lien vers `/privacy-policy.html` ✅

---

## 📝 Notes Importantes

1. **Pas de migration de données MySQL vers PostgreSQL** : Commence avec une BD vierge
2. **Les colonnes `accepted_policy` et `paid_at` sont déjà incluses** dans le script
3. **Les indexes PostgreSQL améliorent les perfs** par rapport à MySQL
4. **Neon gère automatiquement les backups et la scalabilité**

---

## 🐛 Dépannage

### Erreur : "DATABASE_URL manquant"
- Vérifie que `.env` contient la bonne variable
- Redémarre le serveur

### Erreur : "Connexion SSL échouée"
- Assure-toi que `sslmode=require` est dans l'URL
- Neon.tech demande SSL par défaut

### Erreur : "Relation does not exist"
- Les tables n'ont pas été créées
- Exécute le script SQL de Neon
