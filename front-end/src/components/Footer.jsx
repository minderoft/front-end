// filepath: front-end/src/components/Footer.jsx
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const categories = [
    { label: 'Immobilier', to: '/announcements?category=immobilier' },
    { label: 'Véhicules', to: '/announcements?category=vehicule' },
    { label: 'Matériaux BTP', to: '/announcements?category=materiaux' },
    { label: 'Techniciens', to: '/announcements?category=technicien' },
    { label: 'Services', to: '/announcements?category=services' },
  ];

  const supportLinks = [
    { label: 'Centre d\'aide', to: '/help' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Contact', to: '/contact' },
    { label: 'À propos', to: '/about' },
  ];

  const legalLinks = [
    { label: 'Conditions d\'utilisation', to: '/legal' },
    { label: 'Politique de confidentialité', to: '/legal' },
    { label: 'Mentions légales', to: '/legal' },
    { label: 'Cookies', to: '/legal' },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Mail, label: 'Email', href: 'mailto:info@locaplus.ci' },
  ];

  const paymentMethods = [
    { name: 'Paystack', icon: '💳' },
    { name: 'Djamo', icon: '📱' },
    { name: 'Visa', icon: '💳' },
    { name: 'Mastercard', icon: '💳' },
    { name: 'Mobile Money', icon: '📱' },
  ];

  return (
    <footer className="footer">
      {/* Main Footer Content - 4 Columns */}
      <div className="footer-container">
        {/* Column 1: LocaPlus */}
        <div className="footer-section footer-section--brand">
          <div className="footer-logo">
            <div className="footer-logo-icon">🏠</div>
            <span className="footer-logo-text">LocaPlus</span>
          </div>
          <p className="footer-pitch">
            La marketplace sécurisée pour l'immobilier, les véhicules, les matériaux BTP et les services techniques.
          </p>
          <div className="footer-socials">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  title={social.label}
                  className="footer-social-link"
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Column 2: Catégories */}
        <div className="footer-section">
          <h3 className="footer-title">Catégories</h3>
          <ul className="footer-links">
            {categories.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="footer-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support */}
        <div className="footer-section">
          <h3 className="footer-title">Support</h3>
          <ul className="footer-links">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="footer-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Légal */}
        <div className="footer-section">
          <h3 className="footer-title">Légal</h3>
          <ul className="footer-links">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="footer-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="footer-divider"></div>

      {/* Bottom Section: Payment Methods + Copyright */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          {/* Left: Copyright */}
          <div className="footer-copyright">
            <p>© {currentYear} LocaPlus. Tous droits réservés.</p>
          </div>

          {/* Center: Payment Methods */}
          <div className="footer-payments">
            <span className="footer-payments-label">Moyens de paiement:</span>
            <div className="footer-payment-icons">
              {paymentMethods.map((method) => (
                <div key={method.name} className="footer-payment-icon" title={method.name}>
                  {method.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Empty for balance (can add more links later) */}
          <div className="footer-links-group"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;