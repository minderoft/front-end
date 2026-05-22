import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Mail, AlertCircle, Send, Users } from 'lucide-react';

const BACKEND_URL = 'https://backend-ovbc.onrender.com';
const POLL_INTERVAL = 5000;
const ADMIN_CONVERSATION_ID = 'admin-locaplus';
const ADMIN_EMAIL = 'support@locaplus.fr';

const adminConversationSeed = {
  id: ADMIN_CONVERSATION_ID,
  name: 'Administration LOCAPLUS',
  subtitle: 'Support Officiel',
  avatar: 'AL',
  isAdmin: true,
};

const Chat = () => {
  const { user } = useAuth();
  const { userId: receiverId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(receiverId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('Bug technique');
  const [reportText, setReportText] = useState('');
  const [reportStatus, setReportStatus] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(receiverId));
  const [isMobile, setIsMobile] = useState(false);

  const scrollRef = useRef(null);

  const displayedConversations = useMemo(() => {
    const list = [adminConversationSeed];
    const ids = new Set([ADMIN_CONVERSATION_ID]);

    conversations.forEach((conv) => {
      const conversationUserId = conv.provider_id === user?.id ? conv.client_id : conv.provider_id;
      if (!conversationUserId || ids.has(conversationUserId)) return;

      ids.add(conversationUserId);
      list.push({
        id: conversationUserId,
        name: conv.provider_id === user?.id ? conv.client_name || 'Utilisateur' : conv.provider_name || 'Utilisateur',
        subtitle: conv.service_title || 'Conversation en cours',
        avatar: conv.provider_name?.charAt(0).toUpperCase() || conv.client_name?.charAt(0).toUpperCase() || 'U',
        isAdmin: false,
      });
    });

    return list;
  }, [conversations, user]);

  const selectedConversation = useMemo(
    () => displayedConversations.find((conv) => conv.id === activeConversationId) || displayedConversations[0],
    [displayedConversations, activeConversationId]
  );

  const isAdminChat = selectedConversation?.id === ADMIN_CONVERSATION_ID;

  const adminIntroMessages = useMemo(
    () => [
      {
        id: 'admin-welcome',
        sender: 'admin',
        text: 'Bienvenue sur le support LOCAPLUS. Tapez votre message et nous vous répondrons rapidement.',
        created_at: new Date().toISOString(),
      },
    ],
    []
  );

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!activeConversationId && displayedConversations.length > 0) {
      setActiveConversationId(displayedConversations[0].id);
    }
  }, [user, displayedConversations, activeConversationId]);

  const loadConversations = useCallback(async () => {
    try {
      if (!user) return;

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      const response = await axios.get(`${BACKEND_URL}/api/conversations`, config);
      setConversations(response.data.conversations || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMessages = useCallback(
    async (otherUserId) => {
      try {
        if (!user || !otherUserId) return;

        if (otherUserId === ADMIN_CONVERSATION_ID) {
          setMessages([]);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        };

        const response = await axios.get(`${BACKEND_URL}/api/messages/${otherUserId}`, config);
        setMessages(response.data.messages || []);
        setError(null);
      } catch (err) {
        console.error('Erreur chargement messages:', err);
        setMessages([]);
        setError('Impossible de charger les messages');
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (!user || !activeConversationId) return;
    setLoading(true);
    loadMessages(activeConversationId);
  }, [user, activeConversationId, loadMessages]);

  useEffect(() => {
    if (!activeConversationId || activeConversationId === ADMIN_CONVERSATION_ID) return;

    const interval = setInterval(() => {
      loadMessages(activeConversationId);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || !selectedConversation) return;

    if (selectedConversation.id === ADMIN_CONVERSATION_ID) {
      const subject = encodeURIComponent('Demande support LOCAPLUS');
      const body = encodeURIComponent(`${messageText.trim()}

Utilisateur: ${user?.name || 'Anonyme'}
Email: ${user?.email || 'non renseigné'}`);
      setMessageText('');
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
      return;
    }

    try {
      setSending(true);
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      };

      await axios.post(
        `${BACKEND_URL}/api/messages`,
        {
          receiver_id: selectedConversation.id,
          text: messageText.trim(),
        },
        config
      );

      setMessageText('');
      await loadMessages(selectedConversation.id);
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    if (isMobile) {
      setMobileChatOpen(true);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportText.trim()) {
      setReportStatus('Décrivez votre signalement avant envoi.');
      return;
    }

    try {
      setReportStatus('Envoi du signalement...');
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      };

      await axios.post(
        `${BACKEND_URL}/api/reports`,
        {
          type: reportType,
          message: reportText.trim(),
          conversation: selectedConversation.id,
          user_id: user?.id,
        },
        config
      );

      setReportStatus('Signalement envoyé. Merci.');
      setReportText('');
      setTimeout(() => {
        setReportOpen(false);
        setReportStatus(null);
      }, 1800);
    } catch (err) {
      console.error('Erreur signalement:', err);
      setReportStatus('Impossible d\'envoyer le signalement pour le moment.');
    }
  };

  const currentMessages = isAdminChat && messages.length === 0 ? adminIntroMessages : messages;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      <div className="sm:flex h-full">
        <aside
          className={`relative bg-white border-r border-slate-200 h-full sm:w-1/3 ${isMobile && mobileChatOpen ? 'hidden' : 'flex'} flex-col`}
        >
          <div className="px-5 py-4 border-b border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Vos conversations</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">Messagerie LOCAPLUS</h1>
              </div>
              <div className="hidden sm:flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 text-slate-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectConversation(ADMIN_CONVERSATION_ID)}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
            >
              <Mail className="w-5 h-5" />
              Contacter l'administration LOCAPLUS
            </button>
          </div>

          <div className="px-5 py-4 border-b border-slate-200">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Sélectionnez un échange pour voir le fil, ou utilisez le bouton pour contacter l’administration.
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
            {loading && conversations.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">Chargement des conversations...</div>
            ) : (
              displayedConversations.map((conversation) => {
                const isActive = conversation.id === selectedConversation?.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      isActive ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
                        {conversation.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{conversation.name}</p>
                        <p className="mt-1 text-xs text-slate-500 truncate">{conversation.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <main className={`relative flex-1 h-full flex flex-col bg-white ${isMobile && !mobileChatOpen ? 'hidden' : 'flex'}`}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileChatOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}

            <div className="min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Conversation</span>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 truncate">{selectedConversation?.name}</h2>
              <p className="mt-1 text-sm text-slate-500 truncate">{selectedConversation?.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              {selectedConversation?.isAdmin && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                >
                  <AlertCircle className="w-4 h-4" />
                  Signaler
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50">
            <div className="h-full overflow-y-auto px-5 py-5 space-y-4">
              {loading ? (
                <div className="flex h-full items-center justify-center rounded-3xl bg-white text-sm text-slate-500">Chargement du fil de discussion...</div>
              ) : currentMessages.length === 0 ? (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-3xl bg-white text-center text-sm text-slate-500">
                  Aucune discussion disponible. Lancez un message à l'administration ou sélectionnez une autre conversation.
                </div>
              ) : (
                currentMessages.map((message) => {
                  const isMine = message.sender_id === user?.id || message.sender === 'me';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 ${isMine ? 'bg-orange-600 text-white' : 'bg-white text-slate-900 shadow-sm'}`}>
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        <span className={`mt-2 block text-[11px] ${isMine ? 'text-orange-100' : 'text-slate-400'}`}>
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAdminChat ? 'Écrivez votre message pour l’administration LOCAPLUS...' : 'Écrivez votre réponse...'}
                className="min-h-[54px] max-h-28 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || !messageText.trim()}
                className="inline-flex h-14 w-full items-center justify-center rounded-3xl bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                <Send className="w-5 h-5" />
                <span className="ml-2">Envoyer</span>
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {isAdminChat
                ? 'Votre message s’ouvrira dans votre client mail natif. Il sera envoyé directement à l’administration LOCAPLUS.'
                : 'Appuyez sur Entrée pour envoyer. Messages synchronisés avec le fil de conversation.'}
            </p>
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </main>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Signalement</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Signaler un problème</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Envoyez un signalement à l’administration LOCAPLUS pour un bug, une annonce frauduleuse ou un problème technique.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-full border border-slate-200 bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                Type de signalement
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option>Bug technique</option>
                  <option>Annonces frauduleuses</option>
                  <option>Problème de transaction</option>
                  <option>Autre</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                Conversation concernée
                <input
                  value={selectedConversation?.name || ''}
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm text-slate-700">
              Description du problème
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="Expliquez le bug, la fraude ou le problème technique..."
              />
            </label>

            {reportStatus && (
              <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{reportStatus}</div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                className="rounded-3xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Envoyer le signalement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
