import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api';

const templates = [
  'Est-ce que vous vous déplacez à Cocody ?',
  'Quel est votre tarif pour ce service ?',
  'Êtes-vous disponible demain ?',
];

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const providerId = searchParams.get('providerId');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      const list = response.data.conversations || [];
      setConversations(list);
      setActiveConversation((current) => {
        if (current) {
          return current;
        }
        return list.length ? list[0] : null;
      });
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Impossible de charger vos conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const response = await chatService.getMessages(conversationId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Erreur chargement messages:', err);
      setError('Impossible de charger la discussion.');
    }
  }, []);

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    await loadMessages(conversation.id);
  };

  const createConversationFromSearch = useCallback(async () => {
    if (!serviceId || !providerId || !user) {
      return;
    }

    try {
      const response = await chatService.createConversation({ serviceId, providerId });
      const conversation = response.data.conversation;
      if (conversation) {
        if (!conversations.find((item) => item.id === conversation.id)) {
          setConversations((prev) => [conversation, ...prev]);
        }
        setActiveConversation(conversation);
        await loadMessages(conversation.id);
      }
    } catch (err) {
      console.error('Erreur création conversation:', err);
      setError('Impossible de démarrer la conversation.');
    }
  }, [serviceId, providerId, user, conversations, loadMessages]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (serviceId && providerId && user) {
      createConversationFromSearch();
    }
  }, [serviceId, providerId, user, createConversationFromSearch]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversation) {
      return;
    }

    try {
      setSending(true);
      await chatService.sendMessage({ conversationId: activeConversation.id, text: messageText.trim() });
      setMessageText('');
      await loadMessages(activeConversation.id);
      await loadConversations();
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Impossible d envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  const handleTemplateClick = (template) => {
    setMessageText(template);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Messagerie</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Discutez avec les professionnels et suivez vos échanges dans un espace moderne et simple.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
          <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold">Conversations</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sélectionnez une conversation pour échanger.</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <div className="p-6 text-sm text-gray-500">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">Aucune conversation disponible.</div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${activeConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{conversation.contact_name || 'Professionnel'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{conversation.service_title || 'Annonce'}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleString('fr-FR') : ''}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-500 line-clamp-2">{conversation.last_message || 'Démarrer la conversation'}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold">Discussion active</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Échangez avec un prestataire ou créez une nouvelle conversation depuis une annonce.</p>
            </div>

            {activeConversation ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: '320px' }}>
                  {messages.length === 0 ? (
                    <div className="rounded-3xl bg-gray-50 dark:bg-gray-950 p-6 text-sm text-gray-500">Démarrez la conversation en envoyant votre premier message.</div>
                  ) : (
                    messages.map((message) => {
                      const isMine = message.sender_id === user.id;
                      return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-3xl p-4 ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                            <p className="text-sm leading-6">{message.text}</p>
                            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 text-right">{message.sender_name} · {new Date(message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-5">
                  <div className="grid gap-3 mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Modèles rapides</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {templates.map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => handleTemplateClick(template)}
                          className="rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      rows={4}
                      placeholder="Écrivez votre message..."
                      className="w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending}
                      className="self-end rounded-3xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold transition disabled:opacity-50"
                    >
                      {sending ? 'Envoi...' : 'Envoyer le message'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-600 dark:text-gray-400">
                <p className="mb-4">Sélectionnez une conversation à gauche ou démarrez une nouvelle discussion depuis une annonce.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
