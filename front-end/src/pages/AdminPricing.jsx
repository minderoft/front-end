// filepath: front-end/src/pages/AdminPricing.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pricingService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pricing, setPricing] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Charger les tarifs
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await pricingService.getAll();
        setPricing(response.data.categories || []);
      } catch (error) {
        console.error('Erreur lors du chargement des tarifs:', error);
        setMessage('❌ Erreur lors du chargement des tarifs');
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const handleEditClick = (item) => {
    setEditing(item.id);
    setEditValue(item.price.toString());
    setMessage('');
  };

  const handleSave = async (id) => {
    if (!editValue || isNaN(editValue) || editValue < 0) {
      setMessage('❌ Veuillez entrer un prix valide');
      return;
    }

    setSaving(true);
    try {
      const response = await pricingService.updatePrice(id, {
        price: parseInt(editValue),
        active: 1
      });
      
      setPricing(prev => Array.isArray(prev) ? prev.map(p => p.id === id ? { ...p, price: parseInt(editValue) } : p) : prev);
      setEditing(null);
      setMessage('✅ Tarif mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setMessage('❌ Erreur : ' + (error.response?.data?.error || 'Erreur serveur'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
    setMessage('');
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', marginTop: '70px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--primary)' }}>
          📊 Gestion des Tarifs
        </h1>
        <p style={{ color: 'var(--text-light)' }}>
          Modifiez les prix de publication pour chaque catégorie. Les modifications s'appliquent immédiatement.
        </p>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: message.includes('✅') ? '#c6f6d5' : '#fed7d7',
          color: message.includes('✅') ? '#22543d' : '#742a2a',
          borderRadius: '6px',
          border: '1px solid ' + (message.includes('✅') ? '#9ae6b4' : '#fc8181')
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Chargement des tarifs...</p>
        </div>
      ) : pricing.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-light)' }}>Aucun tarif disponible</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Catégorie</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nom</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Prix FCFA</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((item, index) => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: index % 2 === 0 ? 'white' : 'var(--background)'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{item.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {editing === item.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '1rem',
                          border: '2px solid var(--primary)',
                          borderRadius: '4px',
                          width: '120px'
                        }}
                        autoFocus
                      />
                    ) : (
                      <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--accent)' }}>
                        {item.price.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {editing === item.id ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={saving}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#38A169',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1,
                            fontWeight: '600'
                          }}
                        >
                          {saving ? '⏳ Enregistrement...' : '✓ Sauvegarder'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#E53E3E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1,
                            fontWeight: '600'
                          }}
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(item)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ Modifier
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px', color: 'var(--primary)' }}>💡 Conseils</h3>
        <ul style={{ color: 'var(--text-light)', paddingLeft: '20px' }}>
          <li>Les modifications s'appliquent immédiatement sur le site en ligne</li>
          <li>Les utilisateurs verront les nouveaux tarifs à la prochaine visite ou actualisation de page</li>
          <li>Utilisez des montants en FCFA (CFA Francs)</li>
          <li>Vérifiez les tarifs sur le site public après modification</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPricing;
