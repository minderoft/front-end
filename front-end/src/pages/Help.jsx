// filepath: front-end/src/pages/Help.jsx
import { Link } from 'react-router-dom';

const Help = () => {
  const faqs = [
    {
      question: "Comment publier une annonce ?",
      answer: "Pour publier une annonce, vous devez d'abord créer un compte sur LocaPlus. Ensuite, cliquez sur 'Publier une annonce' dans le menu, remplissez le formulaire avec les détails de votre bien ou service, et effectuez le paiement requis pour activer votre annonce."
    },
    {
      question: "Combien coûte la publication d'une annonce ?",
      answer: "Les tarifs varient selon la catégorie : Immobilier (5000FCFA/mois), Véhicules (4000FCFA/mois), Matériaux (3000FCFA/mois), Techniciens (2000FCFA/mois). Le paiement est valide pour 1 mois."
    },
    {
      question: "Quels modes de paiement sont acceptés ?",
      answer: "Nous acceptons Wave, Orange Money, MTN Mobile Money, Moov Money et les cartes bancaires. Le paiement est sécurisé et instantané."
    },
    {
      question: "Comment modifier ou supprimer mon annonce ?",
      answer: "Accédez à votre Dashboard depuis le menu, puis cliquez sur 'Mes annonces'. Vous trouverez les options pour modifier ou supprimer chaque annonce."
    },
    {
      question: "Combien de temps mon annonce reste-t-elle active ?",
      answer: "Votre annonce reste active pendant 1 mois à partir de la date de paiement. Vous pouvez la renouveler à tout moment depuis votre Dashboard."
    },
    {
      question: "Comment contacter un vendeur ?",
      answer: "Sur la page de détail de l'annonce, vous trouverez les informations de contact du vendeur (téléphone, email). Vous pouvez également utiliser le bouton 'Appeler maintenant'."
    },
    {
      question: "Que faire en cas de problème ?",
      answer: "Si vous rencontrez un problème, vous pouvez nous contacter via la page 'Contact' ou nous envoyer un email à support@locaplus.com. Notre équipe vous répondra sous 24-48h."
    },
  ];

  return (
    <div className="help-page">
      <h1 className="mb-4">Centre d'aide</h1>
      
      <div className="help-section">
        <h3>Bienvenue sur LocaPlus</h3>
        <p>
          LocaPlus est une plateforme multi-services qui met en relation les propriétaires, 
          vendeurs et techniciens avec des clients. Trouvez ce dont vous avez besoin 
          ou proposez vos services.
        </p>
      </div>

      <div className="help-section">
        <h3>Catégories disponibles</h3>
        <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
          <li><strong>Immobilier :</strong> Terrains, villas, appartements, bureaux, magasins à vendre ou à louer</li>
          <li><strong>Véhicules :</strong> Voitures, motos, trucks à vendre ou à louer</li>
          <li><strong>Matériaux de construction :</strong> Ciment, sable, gravier, fer, briques, bois, peinture</li>
          <li><strong>Techniciens :</strong> Plombiers, électriciens, maçons, peintres, carreleurs, mécaniciens</li>
        </ul>
      </div>

      <div className="help-section">
        <h3>Questions Fréquentes (FAQ)</h3>
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <div className="faq-question">{faq.question}</div>
            <div className="faq-answer">{faq.answer}</div>
          </div>
        ))}
      </div>

      <div className="help-section">
        <h3>Besoin d'aide supplémentaire ?</h3>
        <p>Notre équipe est disponible pour vous aider.</p>
        <Link to="/contact" className="btn btn-primary">
          Contacter l'administration
        </Link>
      </div>
    </div>
  );
};

export default Help;