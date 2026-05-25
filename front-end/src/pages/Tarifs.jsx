import { useEffect } from 'react';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import './Tarifs.css';

const Tarifs = () => {
  useEffect(() => {
    document.title = 'LocaPlus - Tarifs et Pricing';
  }, []);

  const categoryListings = [
    {
      category: 'Immobilier',
      price: '2,500',
      period: 'F CFA / Mois',
    },
    {
      category: 'Véhicules',
      price: '2,000',
      period: 'F CFA / Mois',
    },
    {
      category: 'Matériaux de construction',
      price: '2,000',
      period: 'F CFA / Mois',
    },
    {
      category: 'Techniciens',
      price: '1,000',
      period: 'F CFA / Mois',
    },
  ];

  const advertisingSponsors = [
    {
      type: 'Campagne Image',
      price: '500',
      period: 'F CFA pour 2 Jours',
      icon: '🖼️',
    },
    {
      type: 'Campagne Vidéo',
      price: '1,500',
      period: 'F CFA pour 3 Jours',
      icon: '🎬',
    },
  ];

  return (
    <div className="tarifs-page">
      {/* Hero Section */}
      <section className="tarifs-hero">
        <div className="tarifs-hero-content">
          <h1 className="tarifs-hero-title">Nos Tarifs</h1>
          <p className="tarifs-hero-subtitle">
            Découvrez nos tarifs compétitifs pour lister vos annonces ou créer des campagnes publicitaires
          </p>
        </div>
      </section>

      {/* Main Pricing Section */}
      <section className="tarifs-content">
        <div className="tarifs-container">
          {/* Category Listings Section */}
          <div className="pricing-section">
            <div className="section-header">
              <DollarSign size={32} className="section-icon" />
              <div>
                <h2 className="section-title">Listes par Catégorie</h2>
                <p className="section-description">
                  Publiez vos annonces dans la catégorie de votre choix
                </p>
              </div>
            </div>

            <div className="pricing-grid">
              {categoryListings.map((item, index) => (
                <div key={index} className="pricing-card">
                  <div className="card-header">
                    <h3 className="card-title">{item.category}</h3>
                  </div>
                  <div className="card-price">
                    <span className="price-amount">{item.price}</span>
                    <span className="price-period">{item.period}</span>
                  </div>
                  <div className="card-features">
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Annonce visible 24h/24</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Jusqu'à 10 images</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Description complète</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Contact direct avec acheteurs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advertising Sponsorships Section */}
          <div className="pricing-section">
            <div className="section-header">
              <Clock size={32} className="section-icon" />
              <div>
                <h2 className="section-title">Parrainage Publicitaire</h2>
                <p className="section-description">
                  Mettez vos offres en avant avec nos campagnes sponsorisées
                </p>
              </div>
            </div>

            <div className="advertising-grid">
              {advertisingSponsors.map((sponsor, index) => (
                <div key={index} className="advertising-card">
                  <div className="ad-icon">{sponsor.icon}</div>
                  <div className="ad-header">
                    <h3 className="ad-title">{sponsor.type}</h3>
                  </div>
                  <div className="ad-price">
                    <span className="price-amount">{sponsor.price}</span>
                    <span className="price-period">{sponsor.period}</span>
                  </div>
                  <div className="ad-features">
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Visibilité prioritaire</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Placement premium</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircle size={18} className="feature-icon" />
                      <span>Statistiques de vue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="payment-section">
            <div className="payment-header">
              <h2 className="payment-title">Paiements Sécurisés</h2>
            </div>
            <div className="payment-badge">
              <CheckCircle size={24} className="badge-icon" />
              <span className="badge-text">
                Paiements sécurisés par Mobile Money (Orange, MTN, Wave, Moov)
              </span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2 className="faq-title">Questions Fréquentes</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3 className="faq-question">Puis-je modifier mon annonce après l'avoir publiée ?</h3>
                <p className="faq-answer">
                  Oui, vous pouvez modifier votre annonce à tout moment depuis votre tableau de bord.
                </p>
              </div>
              <div className="faq-item">
                <h3 className="faq-question">Comment renouveler mon annonce ?</h3>
                <p className="faq-answer">
                  Vous pouvez renouveler votre annonce mensuellement avec le même tarif.
                </p>
              </div>
              <div className="faq-item">
                <h3 className="faq-question">Les campagnes publicitaires incluent le design ?</h3>
                <p className="faq-answer">
                  Non, vous devez fournir votre image ou vidéo. Notre équipe peut vous aider si nécessaire.
                </p>
              </div>
              <div className="faq-item">
                <h3 className="faq-question">Puis-je obtenir une facture pour mes paiements ?</h3>
                <p className="faq-answer">
                  Oui, vous recevrez une facture électronique après chaque paiement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Tarifs;
