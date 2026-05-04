import { Link } from 'react-router-dom';

const FAQ = () => {
  const faqs = [
    {
      question: "Comment publier une annonce ?",
      answer: "Créez un compte sur LocaPlus, connectez-vous, puis cliquez sur 'Publier une annonce'. Remplissez le formulaire avec les détails de votre bien ou service, ajoutez des photos et confirmez votre annonce.",
    },
    {
      question: "Quels sont les tarifs de publication ?",
      answer: "Les tarifs varient selon la catégorie : Immobilier 5000 FCFA/mois, Véhicules 4000 FCFA/mois, Matériaux 3000 FCFA/mois et Techniciens 2000 FCFA/mois. Le paiement couvre une publication valide pendant 30 jours.",
    },
    {
      question: "Quels moyens de paiement sont pris en charge ?",
      answer: "LocaPlus accepte Wave, Orange Money, MTN Mobile Money, Moov Money et les cartes bancaires. Le paiement est sécurisé et validé automatiquement.",
    },
    {
      question: "Comment modifier ou supprimer mon annonce ?",
      answer: "Accédez à votre Dashboard et ouvrez 'Mes annonces'. Vous pourrez modifier les informations ou supprimer l'annonce depuis cette interface.",
    },
    {
      question: "Combien de temps mon annonce reste-t-elle active ?",
      answer: "Chaque annonce reste active 30 jours après paiement. Vous pouvez la renouveler à tout moment depuis votre Dashboard.",
    },
    {
      question: "Comment contacter un vendeur ou un prestataire ?",
      answer: "Sur la page de détail de chaque annonce, les informations de contact sont disponibles. Vous pouvez appeler ou envoyer un message selon les données fournies.",
    },
    {
      question: "Que faire en cas de problème ?",
      answer: "Si vous avez un souci, utilisez la page 'Contact' pour nous écrire. Notre équipe répond généralement sous 24 à 48 heures.",
    },
  ];

  return (
    <div className="help-page">
      <h1 className="mb-4">FAQ - Questions fréquentes</h1>

      <div className="help-section">
        <p>Voici les réponses aux questions les plus courantes sur l'utilisation de LocaPlus. Si vous ne trouvez pas votre réponse, n'hésitez pas à nous contacter.</p>
      </div>

      <div className="help-section">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <div className="faq-question">{faq.question}</div>
            <div className="faq-answer">{faq.answer}</div>
          </div>
        ))}
      </div>

      <div className="help-section">
        <h3>Besoin d'aide supplémentaire ?</h3>
        <p>Nous sommes là pour vous aider si vous avez besoin de plus de détails ou de support personnalisé.</p>
        <Link to="/contact" className="btn btn-primary">
          Contacter le support
        </Link>
      </div>
    </div>
  );
};

export default FAQ;
