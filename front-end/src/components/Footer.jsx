// filepath: front-end/src/components/Footer.jsx
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-sky-400 to-blue-600 text-white py-4 md:py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto px-4 md:px-8">
        <div>
          <h4 className="text-sm font-semibold mb-1.5">LocaPlus</h4>
          <p className="text-xs hidden md:block opacity-80">La plateforme multi-services qui met en relation les professionnels avec les clients.</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1.5">Liens Rapides</h4>
          <ul className="flex flex-col space-y-1">
            <li><Link to="/" className="text-xs opacity-80 hover:opacity-100 transition">Accueil</Link></li>
            <li><Link to="/announcements" className="text-xs opacity-80 hover:opacity-100 transition">Annonces</Link></li>
            <li><Link to="/create" className="text-xs opacity-80 hover:opacity-100 transition">Publier</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1.5">Catégories</h4>
          <ul className="flex flex-col space-y-1">
            <li><Link to="/announcements?category=immobilier" className="text-xs opacity-80 hover:opacity-100 transition">Immobilier</Link></li>
            <li><Link to="/announcements?category=vehicule" className="text-xs opacity-80 hover:opacity-100 transition">Véhicules</Link></li>
            <li><Link to="/announcements?category=materiaux" className="text-xs opacity-80 hover:opacity-100 transition">Matériaux</Link></li>
            <li><Link to="/announcements?category=technicien" className="text-xs opacity-80 hover:opacity-100 transition">Techniciens</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1.5">Support</h4>
          <ul className="flex flex-col space-y-1">
            <li><Link to="/help" className="text-xs opacity-80 hover:opacity-100 transition">Aide</Link></li>
            <li><Link to="/faq" className="text-xs opacity-80 hover:opacity-100 transition">FAQ</Link></li>
            <li><Link to="/contact" className="text-xs opacity-80 hover:opacity-100 transition">Contact</Link></li>
            <li><Link to="/legal" className="text-xs opacity-80 hover:opacity-100 transition">Légal</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-white border-opacity-20 py-2 mt-4 md:mt-6">
        <p className="text-xs text-center opacity-70">© {new Date().getFullYear()} LocaPlus. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;