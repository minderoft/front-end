import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  useEffect(() => {
    document.title = 'À propos - LocaPlus';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = 'À propos de LocaPlus : marketplace multi-services pour l immobilier, véhicules, BTP et techniciens, sécurisé et professionnel.';
  }, []);

  return (
    <div className="content-section">
      <section className="page-section">
        <h1>À propos de LocaPlus</h1>
        <p>LocaPlus est une plateforme multi-services dédiée à la mise en relation entre acheteurs, vendeurs et prestataires dans l'immobilier, les véhicules, le BTP et les services techniques.</p>
        <p>Notre mission : offrir un espace sécurisé, professionnel et facile d'utilisation pour publier, rechercher et contacter des annonces fiables.</p>
        <h2>Pourquoi choisir LocaPlus ?</h2>
        <ul>
          <li>Professionnels vérifiés et annonceurs de confiance</li>
          <li>Interface claire et navigation rapide</li>
          <li>Statut RSI expliqué pour renforcer la crédibilité</li>
          <li>Support client disponible via la page de contact</li>
        </ul>
        <p>Vous pouvez consulter nos conditions légales et notre politique de confidentialité via le lien ci-dessous :</p>
        <Link to="/legal" className="btn btn-primary">Voir les mentions légales</Link>
      </section>
    </div>
  );
};

export default About;
