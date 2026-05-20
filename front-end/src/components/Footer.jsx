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
          <Link to="/announcements?category=immobilier">Immobilier</Link>
          <Link to="/announcements?category=vehicule">Véhicules</Link>
          <Link to="/announcements?category=materiaux">Matériaux</Link>
          <Link to="/announcements?category=technicien">Techniciens</Link>
        </div>
        
        <div className="footer-section">
          <h4>Support</h4>
          <Link to="/help">Centre d'aide</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contacter l'administration</Link>
          <Link to="/about">À propos</Link>
          <Link to="/legal">Mentions légales</Link>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} LocaPlus. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;