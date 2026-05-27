// filepath: front-end/src/pages/Messages.jsx
import { useState, useEffect, useRef } from 'react';
import { Send, Search, ArrowLeft, MoreVertical, Phone, Video, Paperclip, Smile, Check, CheckCheck, X } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation selected
  useEffect(() => {
    if (selectedConv && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedConv]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await chatService.getConversations();
      const convs = response.data?.conversations || [];
      setConversations(convs.map(conv => ({
        id: conv._id || conv.id,
        name: conv.otherUser?.name || 'Utilisateur',
        avatar: conv.otherUser?.name?.charAt(0).toUpperCase() || 'U',
        lastMessage: conv.lastMessage?.content || 'Aucun message',
        timestamp: conv.lastMessage?.createdAt ? formatTimestamp(conv.lastMessage.createdAt) : '',
        unread: conv.unreadCount > 0,
        unreadCount: conv.unreadCount || 0,
        otherUserId: conv.otherUser?._id || conv.otherUser?.id,
      })));
    } catch (error) {
      console.error('Erreur fetch conversations:', error);
      // Mock data for demo
      setConversations([
        { id: 1, name: 'Alice Martin', avatar: 'AM', lastMessage: 'Bonjour, est-ce que le bien est toujours disponible ?', timestamp: '5 min', unread: true, unreadCount: 2 },
        { id: 2, name: 'Bernard Dupont', avatar: 'BD', lastMessage: 'Merci pour votre réponse rapide', timestamp: '2 heures', unread: true, unreadCount: 1 },
        { id: 3, name: 'Carole Leclerc', avatar: 'CL', lastMessage: 'À quelle heure peut-on visiter ?', timestamp: '1 jour', unread: false, unreadCount: 0 },
        { id: 4, name: 'David Kouassi', avatar: 'DK', lastMessage: 'Je suis intéressé par votre annonce', timestamp: '3 jours', unread: false, unreadCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} h`;
    if (days < 7) return `${days} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setShowMobileChat(true);

    // Mark as read
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, unread: false, unreadCount: 0 } : c
    ));

    // Fetch messages for this conversation
    try {
      const response = await chatService.getMessages(conv.id);
      const msgs = response.data?.messages || [];
      setMessages(msgs.map(msg => ({
        id: msg._id || msg.id,
        sender: msg.senderId === user?.id ? 'me' : 'other',
        text: msg.content,
        time: formatMessageTime(msg.createdAt),
        status: msg.status || 'delivered',
      })));
    } catch (error) {
      console.error('Erreur fetch messages:', error);
      // Mock messages for demo
      setMessages([
        { id: 1, sender: 'other', text: 'Bonjour, est-ce que le bien est toujours disponible ?', time: '14:30', status: 'read' },
        { id: 2, sender: 'me', text: 'Oui, absolument ! Vous êtes intéressé ?', time: '14:45', status: 'read' },
        { id: 3, sender: 'other', text: 'Oui, j\'aimerais bien le voir en personne', time: '15:10', status: 'read' },
      ]);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempId = Date.now();
    const newMsg = {
      id: tempId,
      sender: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };
    setMessages(prev => [...prev, newMsg]);

    try {
      await chatService.sendMessage({
        conversationId: selectedConv.id,
        content: messageText,
        receiverId: selectedConv.otherUserId,
      });

      // Update status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'sent' } : msg
      ));
    } catch (error) {
      console.error('Erreur envoi message:', error);
      // Update status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConv(null);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Left Sidebar - Conversations List */}
        <div className={`conversations-sidebar ${showMobileChat ? 'hidden-mobile' : ''}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Messages</h2>
            <button className="sidebar-action-btn" title="Nouveau message">
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Conversations List */}
          <div className="conversations-list">
            {loading ? (
              <div className="loading-conversations">
                <div className="loading-spinner"></div>
                <p>Chargement...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`conversation-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                >
                  <div className="conversation-avatar">
                    {conv.avatar}
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <span className="conversation-name">{conv.name}</span>
                      <span className="conversation-time">{conv.timestamp}</span>
                    </div>
                    <div className="conversation-footer">
                      <span className={`conversation-message ${conv.unread ? 'unread' : ''}`}>
                        {conv.lastMessage}
                      </span>
                      {conv.unread && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-conversations">
                <p>Aucune conversation trouvée</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className={`chat-area ${!showMobileChat ? 'hidden-desktop' : ''}`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-left">
                  <button onClick={handleBackToList} className="mobile-back-btn">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="chat-header-user">
                    <div className="chat-avatar">{selectedConv.avatar}</div>
                    <div className="chat-user-info">
                      <span className="chat-user-name">{selectedConv.name}</span>
                      <span className="chat-user-status">En ligne</span>
                    </div>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="header-action-btn" title="Appel vocal">
                    <Phone size={18} />
                  </button>
                  <button className="header-action-btn" title="Appel vidéo">
                    <Video size={18} />
                  </button>
                  <button className="header-action-btn" title="Plus d'options">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="messages-container-inner">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${msg.sender === 'me' ? 'message-me' : 'message-other'}`}
                  >
                    <div className={`message-bubble ${msg.sender === 'me' ? 'bubble-me' : 'bubble-other'}`}>
                      <p className="message-text">{msg.text}</p>
                      <div className="message-meta">
                        <span className="message-time">{msg.time}</span>
                        {msg.sender === 'me' && (
                          <span className={`message-status ${msg.status}`}>
                            {msg.status === 'sending' && <span className="status-dot"></span>}
                            {msg.status === 'sent' && <Check size={12} />}
                            {msg.status === 'delivered' && <CheckCheck size={12} />}
                            {msg.status === 'read' && <CheckCheck size={12} className="read" />}
                            {msg.status === 'failed' && <span className="status-failed">!</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="message-input-container">
                <button className="input-action-btn" title="Joindre un fichier">
                  <Paperclip size={20} />
                </button>
                <div className="input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="message-input"
                  />
                  <button className="input-emoji-btn" title="Émoji">
                    <Smile size={18} />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
                  title="Envoyer"
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="no-chat-icon">
                <Send size={48} />
              </div>
              <h3>Bienvenue sur LocaPlus Messages</h3>
              <p>Sélectionnez une conversation pour commencer à discuter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;