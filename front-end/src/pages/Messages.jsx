// filepath: front-end/src/pages/Messages.jsx
import { useState, useEffect } from 'react';
import { MessageCircle, Send, Search } from 'lucide-react';

const Messages = () => {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: 'Alice Martin',
      lastMessage: 'Bonjour, est-ce que le bien est toujours disponible ?',
      timestamp: '5 min',
      unread: true,
      avatar: 'AM',
    },
    {
      id: 2,
      name: 'Bernard Dupont',
      lastMessage: 'Merci pour votre réponse rapide',
      timestamp: '2 heures',
      unread: true,
      avatar: 'BD',
    },
    {
      id: 3,
      name: 'Carole Leclerc',
      lastMessage: 'À quelle heure peut-on visiter ?',
      timestamp: '1 jour',
      unread: false,
      avatar: 'CL',
    },
  ]);

  const [selectedConv, setSelectedConv] = useState(conversations[0]);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'other', text: 'Bonjour, est-ce que le bien est toujours disponible ?', time: '14:30' },
    { id: 2, sender: 'me', text: 'Oui, absolutement ! Vous êtes intéressé ?', time: '14:45' },
    { id: 3, sender: 'other', text: 'Oui, j\'aimerais bien le voir en personne', time: '15:10' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      const nextId = (messages?.length || 0) + 1;
    setMessages([...(messages || []), { id: nextId, sender: 'me', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setNewMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex gap-4 p-4 md:p-6">
      {/* Desktop: Conversations List */}
      <div className="hidden md:flex flex-col w-80 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg mb-3">Messages</h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`p-3 cursor-pointer border-b border-gray-100 transition-colors ${
                selectedConv.id === conv.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  conv.unread ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{conv.name}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full md:flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {selectedConv.avatar}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{selectedConv.name}</h3>
              <p className="text-xs text-gray-500">Actif maintenant</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageCircle size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.sender === 'me'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            title="Envoyer"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Mobile: List View Only */}
      <div className="md:hidden w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-lg mb-3">Vos conversations</h2>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  conv.unread ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{conv.name}</p>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                  <p className="text-xs text-gray-400 mt-1">{conv.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
