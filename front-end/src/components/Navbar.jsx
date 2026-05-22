// filepath: front-end/src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, MessageCircle, Bell, HelpCircle, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(2); // Mock data
  const [notificationCount, setNotificationCount] = useState(3); // Mock data

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Top Header Bar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 w-full max-w-screen-xl mx-auto">
          {/* Logo */}
          <Link to="/" className="navbar-brand flex items-center gap-2 font-bold text-lg md:text-xl">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#1E3A5F"/>
              <rect x="4" y="4" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.9"/>
              <path d="M11.5 9L8 12V16H15V12L11.5 9Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="14" r="0.8" fill="white"/>
              <rect x="21" y="4" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.75"/>
              <path d="M24 11H32V13H24V11Z" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <circle cx="26" cy="14.5" r="1.2" fill="white"/>
              <circle cx="30" cy="14.5" r="1.2" fill="white"/>
              <rect x="4" y="21" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.85"/>
              <path d="M8 28L12 24M12 24L14 26M14 26L10 30" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="28" r="1.2" fill="white"/>
              <rect x="21" y="21" width="15" height="15" rx="2" fill="#FF6B35" opacity="0.8"/>
              <rect x="23" y="23" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="28" y="23" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="33" y="23" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="23" y="28" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="28" y="28" width="3" height="3" fill="white" rx="0.3"/>
              <rect x="33" y="28" width="3" height="3" fill="white" rx="0.3"/>
            </svg>
            <span className="hidden md:inline">LocaPlus</span>
          </Link>

          {/* Desktop Navigation Icons */}
          <div className="hidden md:flex items-center gap-6 text-gray-500">
            <Link
              to="/announcements"
              className={`flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                isActive('/announcements') ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-700'
              }`}
              title="Annonces"
            >
              <Home className="w-6 h-6 flex-shrink-0" />
            </Link>
            <Link
              to="/messages"
              className={`relative flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                isActive('/messages') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              title="Messages"
            >
              <MessageCircle className="w-6 h-6 flex-shrink-0" />
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/notifications"
              className={`relative flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                isActive('/notifications') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              title="Notifications"
            >
              <Bell className="w-6 h-6 flex-shrink-0" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`relative flex items-center gap-1 pb-1 border-b-2 transition-colors ${
                isUserMenuOpen ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              title="Menu"
              aria-expanded={isUserMenuOpen}
            >
              <HelpCircle className="w-6 h-6 flex-shrink-0" />
            </button>
          </div>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Menu utilisateur"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
                    >
                      Mon Dashboard
                    </Link>
                    <Link
                      to="/create"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-blue-600"
                    >
                      + Publier une annonce
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors flex items-center gap-2 border-t border-gray-200"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMenuOpen}
            aria-controls="navbar-mobile-menu"
          >
            {isMenuOpen ? (
              <X size={24} className="text-gray-700" />
            ) : (
              <Menu size={24} className="text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div id="navbar-mobile-menu" className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/announcements"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/announcements') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home size={20} />
                <span>Annonces</span>
              </Link>
              <Link
                to="/messages"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${
                  isActive('/messages') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageCircle size={20} />
                <span>Messages</span>
                {unreadMessages > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                to="/notifications"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${
                  isActive('/notifications') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell size={20} />
                <span>Notifications</span>
                {notificationCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Link>
              <Link
                to="/help"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/help') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HelpCircle size={20} />
                <span>Aide</span>
              </Link>
              <Link
                to="/faq"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/faq') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HelpCircle size={20} />
                <span>FAQ</span>
              </Link>
              <Link
                to="/contact"
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/contact') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageCircle size={20} />
                <span>Contact</span>
              </Link>

              <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Mon Dashboard
                    </Link>
                    <Link
                      to="/create"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
                    >
                      + Publier une annonce
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut size={20} />
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogIn size={20} />
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      onClick={handleNavClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <UserPlus size={20} />
                      Inscription
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* More Options Dropdown (Desktop) */}
      {isUserMenuOpen && location.pathname !== '/help' && location.pathname !== '/faq' && location.pathname !== '/contact' && (
        <div className="hidden md:block fixed top-16 right-6 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <Link
            to="/help"
            onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/help');
            }}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
          >
            Aide
          </Link>
          <Link
            to="/faq"
            onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/faq');
            }}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            FAQ
          </Link>
          <Link
            to="/contact"
            onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/contact');
            }}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
          >
            Contact
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;