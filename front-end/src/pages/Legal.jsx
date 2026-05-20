import { useEffect } from 'react';

const Legal = () => {
  useEffect(() => {
    document.title = 'Mentions légales & CGU - LocaPlus';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = 'Mentions légales, conditions générales d utilisation et politique de confidentialité de la marketplace LocaPlus.';
  }, []);

  return (
    <div className="content-section">
      <section className="page-section">
        <h1>Mentions légales et CGU</h1>
        <p>LocaPlus est une plateforme de mise en relation professionnelle. En utilisant LocaPlus, vous acceptez nos conditions générales et nos règles de confidentialité.</p>
        <h2>Conditions Générales d'Utilisation</h2>
        <p>Les annonces publiées sont proposées par des utilisateurs professionnels ou particuliers. LocaPlus n intervient pas dans la transaction entre annonceur et acheteur.</p>
        <h2>Politique de confidentialité</h2>
        <p>Nous collectons uniquement les données nécessaires à la création de compte, la publication d annonces et le contact entre utilisateurs. Les paiements sont sécurisés et protégés via des partenaires de confiance.</p>
        <h2>Responsabilité</h2>
        <p>Les informations sur les annonces sont fournies par les annonceurs. LocaPlus ne peut garantir l exactitude des contenus publiés. Nous encourageons la vérification des informations avant toute transaction.</p>
      </section>
    </div>
  );
};

export default Legal;
