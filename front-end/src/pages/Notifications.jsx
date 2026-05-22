// filepath: front-end/src/pages/Notifications.jsx
import { useState } from 'react';
import { Bell, MessageSquare, Heart, Home, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      title: 'Nouveau message',
      description: 'Alice Martin vous a envoyé un message',
      time: '5 minutes',
      read: false,
      avatar: 'AM',
      color: 'bg-blue-100',
    },
    {
      id: 2,
      type: 'favorite',
      title: 'Votre annonce a plu',
      description: 'Bernard Dupont a ajouté votre annonce à ses favoris',
      time: '2 heures',
      read: false,
      avatar: 'BD',
      color: 'bg-red-100',
    },
    {
      id: 3,
      type: 'view',
      title: 'Vue sur votre annonce',
      description: 'Carole Leclerc a consulté votre annonce',
      time: '1 jour',
      read: true,
      avatar: 'CL',
      color: 'bg-green-100',
    },
    {
      id: 4,
      type: 'system',
      title: 'Vérification de votre profil',
      description: 'Votre profil a été vérifié avec succès',
      time: '3 jours',
      read: true,
      avatar: null,
      color: 'bg-yellow-100',
    },
    {
      id: 5,
      type: 'message',
      title: 'Réponse à votre annonce',
      description: 'Quelqu\'un est intéressé par votre bien',
      time: '1 semaine',
      read: true,
      avatar: 'DM',
      color: 'bg-blue-100',
    },
  ]);

  const handleDelete = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={20} className="text-blue-600" />;
      case 'favorite':
        return <Heart size={20} className="text-red-600" />;
      case 'view':
        return <Home size={20} className="text-green-600" />;
      case 'system':
        return <CheckCircle size={20} className="text-yellow-600" />;
      default:
        return <AlertCircle size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Marquer tout comme lu
              </button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">
              Vous avez <span className="font-semibold text-blue-600">{unreadCount}</span> notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune notification</h3>
            <p className="text-gray-600">Vous êtes à jour avec tous vos notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg border transition-all ${
                  notif.read
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-blue-300 bg-blue-50 hover:border-blue-400'
                }`}
              >
                <div className="p-4 flex gap-4">
                  {/* Icon/Avatar */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${notif.color}`}>
                    {notif.avatar ? (
                      notif.avatar
                    ) : (
                      getIcon(notif.type)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`text-sm font-semibold ${notif.read ? 'text-gray-900' : 'text-gray-900 font-bold'}`}>
                          {notif.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{notif.description}</p>
                        <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                      </div>

                      {/* Unread Indicator */}
                      {!notif.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="text-xs font-medium text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
