import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, FileText, Zap, DollarSign, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsSidebarOpen(false);
  };

  const closeMenu = () => {
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <>
      {/* Premium Minimalist Header */}
      <header className="navbar-header">
        <div className="navbar-header-content">
          {/* Logo */}
          <Link to="/" className="navbar-brand">
            <span className="navbar-brand-icon">🏠</span>
            <span className="navbar-brand-text">LocaPlus</span>
          </Link>

          {/* Burger Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="navbar-burger"
            aria-label="Toggle menu"
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Sliding Sidebar Drawer */}
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="navbar-backdrop"
            onClick={closeMenu}
            role="presentation"
          />

          {/* Sidebar Menu */}
          <nav className="navbar-sidebar">
            <div className="navbar-sidebar-content">
              {/* Main Navigation Items */}
              <Link
                to="/"
                className="navbar-sidebar-item"
                onClick={closeMenu}
              >
                <Home size={20} />
                <span>Accueil</span>
              </Link>

              <Link
                to="/announcements"
                className="navbar-sidebar-item"
                onClick={closeMenu}
              >
                <FileText size={20} />
                <span>Déposer une Annonce</span>
              </Link>

              <Link
                to="/create-ad"
                className="navbar-sidebar-item"
                onClick={closeMenu}
              >
                <Zap size={20} />
                <span>Créer une Publicité</span>
              </Link>

              <Link
                to="/tarifs"
                className="navbar-sidebar-item"
                onClick={closeMenu}
              >
                <DollarSign size={20} />
                <span>Tarifs</span>
              </Link>

              {/* Divider */}
              <div className="navbar-sidebar-divider" />

              {/* User-Specific Items */}
              {user ? (
                <>
                  <Link
                    to="/messages"
                    className="navbar-sidebar-item"
                    onClick={closeMenu}
                  >
                    <MessageCircle size={20} />
                    <span>Messages</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    className="navbar-sidebar-item"
                    onClick={closeMenu}
                  >
                    <User size={20} />
                    <span>Mon Compte</span>
                  </Link>

                  <div className="navbar-sidebar-divider" />

                  <button
                    onClick={handleLogout}
                    className="navbar-sidebar-item navbar-sidebar-logout"
                  >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="navbar-sidebar-divider" />
                  <Link
                    to="/login"
                    className="navbar-sidebar-item"
                    onClick={closeMenu}
                  >
                    <span>Connexion</span>
                  </Link>
                  <Link
                    to="/register"
                    className="navbar-sidebar-item navbar-sidebar-primary"
                    onClick={closeMenu}
                  >
                    <span>Inscription</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default Navbar;
