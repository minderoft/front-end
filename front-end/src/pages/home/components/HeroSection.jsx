import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Layers,
  ShieldCheck,
  BarChart3,
  Users,
  Globe,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="w-full px-4 md:px-8 lg:px-12 pt-28 md:pt-32 pb-8 md:pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="order-1">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-500 mb-4">
              Fintech + Sécurité
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              LocaPlus, la marketplace sécurisée pour vos services.
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
              Immobilier, véhicules, BTP, techniciens — vendeurs vérifiés, paiement Paystack/Djamo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/announcements"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Explorer les annonces
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold border-2 border-primary-600 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Publier une annonce
              </Link>
            </div>
          </div>
          {/* Right: Metrics Panel */}
          <div className="order-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </span>
                <strong className="text-sm font-semibold text-gray-900">
                  2 annonces actives
                </strong>
              </div>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <strong className="text-sm font-semibold text-gray-900 block">
                      4 catégories
                    </strong>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Immobilier, Véhicules, BTP, Techniciens
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <strong className="text-sm font-semibold text-gray-900 block">
                      100% sécurisé
                    </strong>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Paiement Paystack/Djamo
                    </p>
                  </div>
                </div>
              </div>
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BarChart3 className="w-4 h-4 text-primary-600 mr-1" />
                    <strong className="text-lg font-bold text-gray-900">12</strong>
                  </div>
                  <p className="text-xs text-gray-500">
                    annonces actives ce mois
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 text-primary-600 mr-1" />
                    <strong className="text-lg font-bold text-gray-900">1,200+</strong>
                  </div>
                  <p className="text-xs text-gray-500">
                    utilisateurs actifs
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Globe className="w-4 h-4 text-primary-600 mr-1" />
                    <strong className="text-lg font-bold text-gray-900">8</strong>
                  </div>
                  <p className="text-xs text-gray-500">
                    pays couvert par la plateforme
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
