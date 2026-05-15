// filepath: front-end/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé avec un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Restaurer la session au chargement de la page
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token) {
          // On a un token, essayer de vérifier auprès du serveur
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          
          // Valider le token avec le serveur
          try {
            const res = await authService.getProfile();
            if (res.data.user) {
              setUser(res.data.user);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              console.log('✅ [AuthContext] Session restaurée avec succès');
            }
          } catch (error) {
            // Token invalide ou expiré
            console.warn('⚠️ [AuthContext] Token invalide ou expiré, déconnexion');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ [AuthContext] Erreur restauration session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return response.data;
  };

  const register = async (data) => {
    const response = await authService.register(data);
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};