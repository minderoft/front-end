// filepath: front-end/src/components/Footer.jsx
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Heart,
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Produit',
      links: [
        { label: 'Accueil', to: '/' },
        { label: 'Annonces', to: '/announcements' },
        { label: 'Publier une annonce', to: '/register' },
        { label: 'Pricing', to: '#pricing' },
      ],
    },
    {
      title: 'Catégories',
      links: [
        { label: 'Immobilier', to: '/announcements?category=immobilier' },
        { label: 'Véhicules', to: '/announcements?category=vehicule' },
        { label: 'Matériaux BTP', to: '/announcements?category=materiaux' },
        { label: 'Techniciens', to: '/announcements?category=technicien' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Centre d\'aide', to: '/help' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Contact', to: '/contact' },
        { label: 'À propos', to: '/about' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Conditions d\'utilisation', to: '/legal' },
        { label: 'Politique de confidentialité', to: '/legal' },
        { label: 'Mentions légales', to: '/legal' },
        { label: 'Cookies', to: '/legal' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Mail, label: 'Email', href: 'mailto:info@locaplus.ci' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-100">
      {/* Main Footer Content */}
      <div className="container py-20 lg:py-24">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                LP
              </div>
              <span className="text-xl font-bold">LocaPlus</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              La marketplace sécurisée pour l'immobilier, les véhicules, les matériaux BTP et les services techniques.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    title={social.label}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-400 hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-t border-slate-800">
          <div className="flex items-start gap-3">
            <Phone className="text-primary flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Téléphone
              </p>
              <a href="tel:+225XXXXXXXXX" className="text-sm font-medium hover:text-primary transition-colors">
                +225 XX XX XX XX
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="text-primary flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Email
              </p>
              <a href="mailto:support@locaplus.ci" className="text-sm font-medium hover:text-primary transition-colors">
                support@locaplus.ci
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="text-primary flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Adresse
              </p>
              <p className="text-sm">Yopougon, Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-800 py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {currentYear} LocaPlus. Tous droits réservés.
            </p>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              Fait avec
              <Heart size={14} className="text-accent fill-accent" />
              pour la communauté
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;