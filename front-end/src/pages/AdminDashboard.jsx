import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, securityService, settingsService } from '../services/api';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [pricingRules, setPricingRules] = useState({});
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSecurity, setLoadingSecurity] = useState(true);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    setStatusMessage('');

    try {
      const [statsRes, announcementsRes, alertsRes, logsRes, maintenanceRes, pricingRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAnnouncements(),
        securityService.getAlerts({ limit: 6 }),
        securityService.getAuditLogs({ limit: 6 }),
        settingsService.getMaintenance(),
        settingsService.getPricing(),
      ]);

      setStats(statsRes.data.stats || {});
      setAnnouncements(announcementsRes.data.announcements || []);
      setSecurityAlerts(alertsRes.data.alerts || []);
      setActivityLogs(logsRes.data.logs || []);
      setMaintenanceMode(Boolean(maintenanceRes.data.isMaintenanceMode));
      setPricingRules(pricingRes.data.pricing || {});
    } catch (error) {
      console.error('Erreur chargement admin dashboard :', error);
      setStatusMessage('Impossible de charger le tableau de bord. Veuillez réessayer.');
    } finally {
      setLoadingDashboard(false);
      setLoadingSecurity(false);
    }
  };

  const refreshSecurity = async () => {
    setLoadingSecurity(true);
    try {
      const [alertsRes, logsRes] = await Promise.all([
        securityService.getAlerts({ limit: 6 }),
        securityService.getAuditLogs({ limit: 6 }),
      ]);
      setSecurityAlerts(alertsRes.data.alerts || []);
      setActivityLogs(logsRes.data.logs || []);
    } catch (error) {
      console.error('Erreur rafraîchissement sécurité :', error);
      setStatusMessage('Impossible de rafraîchir les données de sécurité.');
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    setSavingMaintenance(true);
    setStatusMessage('');
    try {
      const enabled = !maintenanceMode;
      const response = await settingsService.setMaintenance(enabled, maintenanceMessage);
      setMaintenanceMode(response.data.isMaintenanceMode);
      setStatusMessage(`Mode maintenance ${enabled ? 'activé' : 'désactivé'} avec succès.`);
    } catch (error) {
      console.error('Erreur mise à jour mode maintenance :', error);
      setStatusMessage('Impossible de mettre à jour le mode maintenance.');
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handlePricingChange = (key, value) => {
    setPricingRules(prev => ({
      ...prev,
      [key]: value === '' ? '' : Number(value),
    }));
  };

  const savePricingRules = async () => {
    setSavingPricing(true);
    setStatusMessage('');
    try {
      await settingsService.updatePricing({ settings: pricingRules });
      setStatusMessage('Règles de tarification mises à jour.');
    } catch (error) {
      console.error('Erreur mise à jour pricing :', error);
      setStatusMessage('Impossible de sauvegarder les règles de tarification.');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleBanUser = async (alert) => {
    if (!alert.user_id) {
      setStatusMessage('Aucun utilisateur lié à cette alerte pour bannir.');
      return;
    }

    setBanTarget(alert.id);
    setStatusMessage('');

    try {
      await securityService.updateUserStatus(alert.user_id, 'banned', 'Blocage de menace détectée');
      setStatusMessage(`Utilisateur ${alert.user_email || alert.user_id} banni avec succès.`);
      refreshSecurity();
    } catch (error) {
      console.error('Erreur bannissement utilisateur :', error);
      setStatusMessage('Impossible de bannir l’utilisateur pour le moment.');
    } finally {
      setBanTarget(null);
    }
  };

  const monitorEvents = useMemo(() => {
    const alerts = securityAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      type: 'blocked_threat',
      label: alert.threat_type || 'Menace',
      user: alert.user_email || alert.user_name || 'Invité',
      ip: alert.ip_address || '—',
      details: alert.threat_details || alert.request_path || 'Aucune information',
      status: alert.severity === 'high' ? 'BLOQUÉ' : 'ALERTE',
      created_at: alert.created_at,
      userId: alert.user_id,
      alert,
    }));

    const logs = activityLogs.map((log) => ({
      id: `log-${log.id}`,
      type: log.action_type || 'Action',
      label: log.action_type === 'Login' ? 'CONNEXION' : log.action_type === 'Logout' ? 'DECONNEXION' : log.action_type,
      user: log.user_email || log.user_name || 'Utilisateur inconnu',
      ip: log.ip_address || '—',
      details: JSON.stringify(log.details || {}),
      status: log.status === 'success' ? 'OK' : 'ÉCHEC',
      created_at: log.created_at,
      userId: log.user_id,
      alert: null,
    }));

    return [...alerts, ...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [activityLogs, securityAlerts]);

  const renderBadge = (event) => {
    if (event.type === 'blocked_threat') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-sm animate-pulse">
          Bannir
        </span>
      );
    }
    if (event.label === 'CONNEXION') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Connexion
        </span>
      );
    }
    if (event.label === 'DECONNEXION') {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Déconnexion
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        {event.label}
      </span>
    );
  };

  if (!user || loading || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="px-4 py-8 max-w-[1400px] mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Administration</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Tableau de bord Administrateur</h1>
          <p className="mt-2 text-sm text-slate-600">Moniteur de sécurité, trafic et règles en temps réel pour LocaPlus.</p>
        </div>

        <button
          onClick={loadDashboard}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Rafraîchir les données
        </button>
      </div>

      {statusMessage && (
        <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700 shadow-sm">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Utilisateurs</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.total_users ?? '—'}</p>
          <p className="mt-2 text-sm text-slate-500">Total des comptes inscrits</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Annonces</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.total_active_announcements ?? '—'}</p>
          <p className="mt-2 text-sm text-slate-500">Annonces actives en ligne</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Alertes</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{securityAlerts.length}</p>
          <p className="mt-2 text-sm text-slate-500">Menaces bloquées récentes</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Maintenance</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{maintenanceMode ? 'Activé' : 'Désactivé'}</p>
          <p className="mt-2 text-sm text-slate-500">Mode maintenance en cours</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Moniteur de Sécurité & Trafic</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Vue d'ensemble</h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {monitorEvents.length} événements
            </span>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-1">
            <table className="min-w-[1000px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-white text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-semibold">IP</th>
                  <th className="px-4 py-3 text-left font-semibold">Détails</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loadingSecurity ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chargement des événements...</td>
                  </tr>
                ) : monitorEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Aucun événement de sécurité trouvé.</td>
                  </tr>
                ) : monitorEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-4 align-top text-slate-800">
                      <div className="flex items-center gap-2">
                        {renderBadge(event)}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-700">{event.user}</td>
                    <td className="px-4 py-4 align-top text-slate-700">{event.ip}</td>
                    <td className="px-4 py-4 align-top text-slate-600 max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap">{event.details}</td>
                    <td className="px-4 py-4 align-top text-slate-700">{event.status}</td>
                    <td className="px-4 py-4 align-top">
                      {event.type === 'blocked_threat' ? (
                        <button
                          onClick={() => handleBanUser(event.alert)}
                          disabled={banTarget === event.id}
                          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {banTarget === event.id ? 'Bannir...' : 'Bannir'}
                        </button>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Aucune</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Maintenance</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">Mode maintenance</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${maintenanceMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {maintenanceMode ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">Message d'entretien (facultatif)</label>
            <textarea
              value={maintenanceMessage}
              onChange={(event) => setMaintenanceMessage(event.target.value)}
              placeholder="Ajouter une note de maintenance"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
              rows={4}
            />

            <button
              onClick={handleMaintenanceToggle}
              disabled={savingMaintenance}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {savingMaintenance ? 'Sauvegarde...' : maintenanceMode ? 'Désactiver le mode maintenance' : 'Activer le mode maintenance'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Tarification</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Règles publicitaires</h3>
            </div>

            <div className="space-y-4">
              {Object.keys(pricingRules).length === 0 ? (
                <p className="text-sm text-slate-500">Aucune règle de pricing disponible.</p>
              ) : (
                Object.entries(pricingRules).map(([key, value]) => (
                  <div key={key}>
                    <label className="mb-2 block text-sm font-medium text-slate-700">{key}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(event) => handlePricingChange(key, event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))
              )}
            </div>

            <button
              onClick={savePricingRules}
              disabled={savingPricing || Object.keys(pricingRules).length === 0}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {savingPricing ? 'Enregistrement...' : 'Mettre à jour les règles'}
            </button>
          </div>
        </aside>
      </div>

      <footer className="mt-8 border-t border-slate-200 py-3 text-xs text-slate-500">
        © {new Date().getFullYear()} LocaPlus — Centre d'administration sécurisé.
      </footer>
    </div>
  );
};

export default AdminDashboard;
