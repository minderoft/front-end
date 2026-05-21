// filepath: front-end/src/components/Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>LocaPlus</h4>
          <p>La plateforme multi-services qui met en relation les professionnels avec les clients.</p>
        </div>
        
        <div className="footer-section">
          <h4>Liens Rapides</h4>
          <Link to="/">Accueil</Link>
          <Link to="/announcements">Annonces</Link>
          <Link to="/create">Publier une annonce</Link>
        </div>
        
        <div className="footer-section">
          <h4>Catégories</h4>
          <ul className="footer-links">
            <li><Link to="/announcements?category=immobilier">Immobilier</Link></li>
            <li><Link to="/announcements?category=vehicule">Véhicules</Link></li>
            <li><Link to="/announcements?category=materiaux">Matériaux</Link></li>
            <li><Link to="/announcements?category=technicien">Techniciens</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Support</h4>
          <ul className="footer-links">
            <li><Link to="/help">Centre d'aide</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/contact">Contacter l'administration</Link></li>
            <li><Link to="/about">À propos</Link></li>
            <li><Link to="/legal">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LocaPlus. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;