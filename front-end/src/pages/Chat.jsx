import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = 'https://backend-ovbc.onrender.com';
const POLL_INTERVAL = 5000; // 5 secondes

const Chat = () => {
  const { user } = useAuth();
  const { userId: receiverId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(receiverId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    try {
      if (!user) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      const response = await axios.get(`${BACKEND_URL}/api/conversations`, config);
      const list = response.data.conversations || [];
      setConversations(list);
      
      // Si on a un receiverId, chercher cette conversation
      if (receiverId && (list?.length || 0) === 0) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
      setError('Impossible de charger les conversations');
    }
  }, [user, receiverId]);

  // Charger les messages
  const loadMessages = useCallback(async (otherUserId) => {
    try {
      if (!user || !otherUserId) return;

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
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialiser
  useEffect(() => {
    if (user) {
      loadConversations();
      if (activeConversation) {
        loadMessages(activeConversation);
      } else {
        setLoading(false);
      }
    }
  }, [user, loadConversations, activeConversation, loadMessages]);

  // Polling pour les nouveaux messages
  useEffect(() => {
    if (!activeConversation) return;

    const interval = setInterval(() => {
      loadMessages(activeConversation);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeConversation, loadMessages]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversation || sending) {
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
          receiver_id: activeConversation,
          text: messageText.trim(),
        },
        config
      );

      setMessageText('');
      await loadMessages(activeConversation);
    } catch (err) {
      console.error('Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  // Gérer Enter pour envoyer
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Changer de conversation
  const handleSelectConversation = (conversationUserId) => {
    setActiveConversation(conversationUserId);
    setLoading(true);
    loadMessages(conversationUserId);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Colonne gauche - Conversations */}
      <div style={{
        width: '320px',
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        '@media (max-width: 768px)': {
          width: '100%',
          display: activeConversation ? 'none' : 'flex'
        }
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff'
        }}>
          <h2 style={{
            margin: '0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#000'
          }}>Messagerie</h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#999'
          }}>Vos conversations</p>
        </div>

        {/* Liste des conversations */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#fff'
        }}>
          {loading && (conversations?.length || 0) === 0 ? (
            <div style={{ padding: '16px', color: '#999', fontSize: '13px' }}>
              Chargement...
            </div>
          ) : (conversations?.length || 0) === 0 ? (
            <div style={{ padding: '16px', color: '#999', fontSize: '13px' }}>
              Aucune conversation
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.provider_id === user.id ? conv.client_id : conv.provider_id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: activeConversation === (conv.provider_id === user.id ? conv.client_id : conv.provider_id) ? '#f0f0f0' : '#fff',
                  borderBottom: '1px solid #f0f0f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = activeConversation === (conv.provider_id === user.id ? conv.client_id : conv.provider_id) ? '#f0f0f0' : '#fff'}
              >
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>
                  {conv.provider_name || conv.client_name || 'Utilisateur'}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.service_title || 'Conversation'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Colonne droite - Discussion active */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        '@media (max-width: 768px)': {
          display: activeConversation ? 'flex' : 'none'
        }
      }}>
        {activeConversation ? (
          <>
            {/* Header discussion */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#000' }}>
                  Conversation
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                  {activeConversation}
                </p>
              </div>
              <button
                onClick={() => setActiveConversation(null)}
                style={{
                  display: 'none',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999',
                  '@media (max-width: 768px)': {
                    display: 'block'
                  }
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: '#f5f5f5'
            }}>
              {(messages?.length || 0) === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999',
                  fontSize: '13px',
                  textAlign: 'center'
                }}>
                  Aucun message. Commencez la conversation !
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user.id;
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        marginBottom: '4px'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isMine ? '#ff6b00' : '#e5e5ea',
                          color: isMine ? '#fff' : '#000',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          wordWrap: 'break-word'
                        }}
                      >
                        <p style={{ margin: '0', marginBottom: '4px' }}>
                          {message.text}
                        </p>
                        <span style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          display: 'block',
                          textAlign: isMine ? 'right' : 'left'
                        }}>
                          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Champ d'envoi */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Écrivez votre message..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  maxHeight: '100px',
                  outline: 'none',
                  backgroundColor: '#f5f5f5'
                }}
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !messageText.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: messageText.trim() && !sending ? '#ff6b00' : '#ccc',
                  border: 'none',
                  color: '#fff',
                  fontSize: '18px',
                  cursor: messageText.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                ➤
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fee',
                color: '#c33',
                fontSize: '13px',
                borderTop: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: '15px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p>Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
