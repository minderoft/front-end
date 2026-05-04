// filepath: front-end/src/pages/Help.jsx
import { Link } from 'react-router-dom';

const Help = () => {
  return (
    <div className="help-page">
      <h1 className="mb-4">Centre d'aide</h1>
      
      <div className="help-section">
        <h3>Bienvenue sur LocaPlus</h3>
        <p>
          LocaPlus est une plateforme multi-services qui met en relation les propriétaires,
          vendeurs et techniciens avec des clients. Découvrez comment publier une annonce,
          naviguer dans les catégories et gérer votre compte.
        </p>
      </div>

      <div className="help-section">
        <h3>Comment ça marche ?</h3>
        <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
          <li><strong>Inscription :</strong> Créez un compte pour publier et gérer vos annonces.</li>
          <li><strong>Recherche :</strong> Parcourez les annonces par catégorie et utilisez les filtres pour trouver rapidement ce qu'il vous faut.</li>
          <li><strong>Publication :</strong> Publiez votre annonce en ajoutant des détails, un prix, des images et un contact.</li>
          <li><strong>Gestion :</strong> Suivez vos annonces et paiements depuis votre Dashboard.</li>
        </ul>
      </div>

      <div className="help-section">
        <h3>Besoin d'en savoir plus ?</h3>
        <p>Consultez notre FAQ pour obtenir des détails sur l'utilisation du site et nos services.</p>
        <Link to="/faq" className="btn btn-primary">
          Voir la FAQ
        </Link>
      </div>

      <div className="help-section">
        <h3>Contactez-nous</h3>
        <p>Pour toute question ou problème, notre équipe est à votre disposition.</p>
        <Link to="/contact" className="btn btn-secondary">
          Page Contact
        </Link>
      </div>
    </div>
  );
};

export default Help;