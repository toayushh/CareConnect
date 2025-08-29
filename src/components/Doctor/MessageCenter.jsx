import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  InboxIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PhoneIcon,
  VideoCameraIcon,
  HeartIcon,
  BellAlertIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const MessageCenter = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, urgent, patients, providers
  const [urgentAlerts, setUrgentAlerts] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    loadConversations();
    loadUrgentAlerts();
    // Set up real-time messaging (WebSocket would be ideal)
    const interval = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/messages/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const res = await fetchWithAuth(`/api/messages/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadUrgentAlerts = async () => {
    try {
      const res = await fetchWithAuth('/api/messages/urgent-alerts');
      if (res.ok) {
        const data = await res.json();
        setUrgentAlerts(data);
      }
    } catch (error) {
      console.error('Error loading urgent alerts:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        conversation_id: selectedConversation.id,
        content: newMessage,
        type: 'text',
        attachments: attachments
      };

      const res = await fetchWithAuth('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (res.ok) {
        setNewMessage('');
        setAttachments([]);
        loadMessages(selectedConversation.id);
        loadConversations(); // Update conversation list with latest message
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      data: file
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const markAsUrgent = async (messageId) => {
    try {
      await fetchWithAuth(`/api/messages/${messageId}/urgent`, {
        method: 'POST'
      });
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error marking message as urgent:', error);
    }
  };

  const startVideoCall = (participantId) => {
    // Integration with telehealth platform
    window.open(`/telehealth/call/${participantId}`, '_blank');
  };

  const getConversationIcon = (conversation) => {
    if (conversation.type === 'urgent') {
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
    } else if (conversation.type === 'group') {
      return <UserGroupIcon className="w-5 h-5 text-blue-600" />;
    } else {
      return <InboxIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm && !conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    switch (filterType) {
      case 'urgent':
        return conv.has_urgent_messages;
      case 'patients':
        return conv.participant_type === 'patient';
      case 'providers':
        return conv.participant_type === 'provider';
      default:
        return true;
    }
  });

  const UrgentAlertsPanel = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-3">
        <BellAlertIcon className="w-5 h-5 text-red-600 mr-2" />
        <h3 className="text-lg font-semibold text-red-800">
          Urgent Alerts ({urgentAlerts.length})
        </h3>
      </div>
      
      {urgentAlerts.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {urgentAlerts.map(alert => (
            <div
              key={alert.id}
              className="bg-white rounded p-3 border border-red-200 cursor-pointer hover:bg-red-50"
              onClick={() => {
                const conversation = conversations.find(c => c.patient_id === alert.patient_id);
                if (conversation) {
                  setSelectedConversation(conversation);
                  loadMessages(conversation.id);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-red-900">{alert.patient_name}</p>
                  <p className="text-sm text-red-700">{alert.message}</p>
                </div>
                <span className="text-xs text-red-600">
                  {getMessageTime(alert.timestamp)}
                </span>
              </div>
              <div className="mt-2 flex items-center space-x-2">
                {alert.type === 'mood_crisis' && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                    <HeartIcon className="w-3 h-3 mr-1" />
                    Mood Crisis
                  </span>
                )}
                {alert.type === 'pain_flare' && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                    Pain Flare
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-red-700 text-sm">No urgent alerts at this time</p>
      )}
    </div>
  );

  return (
    <div className="h-[800px] bg-white rounded-lg border border-gray-200 flex">
      {/* Sidebar - Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex space-x-1">
              {['all', 'urgent', 'patients', 'providers'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Urgent Alerts */}
        {urgentAlerts.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <UrgentAlertsPanel />
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    loadMessages(conversation.id);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getConversationIcon(conversation)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participant_name}
                        </p>
                        <span className="text-xs text-gray-500">
                          {getMessageTime(conversation.last_message_time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          conversation.participant_type === 'patient'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {conversation.participant_type}
                        </span>
                        {conversation.unread_count > 0 && (
                          <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.participant_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.participant_type === 'patient' ? 'Patient' : 'Healthcare Provider'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startVideoCall(selectedConversation.participant_id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Start Video Call"
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    title="Phone Call"
                  >
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'doctor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'doctor'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <DocumentIcon className="w-4 h-4" />
                            <span className="text-xs underline cursor-pointer">
                              {attachment.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs opacity-75">
                        {getMessageTime(message.timestamp)}
                      </span>
                      {message.is_urgent && (
                        <ExclamationTriangleIcon className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-gray-100 rounded px-3 py-1">
                      <DocumentIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{attachment.name}</span>
                      <button
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer">
                    <PaperClipIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <InboxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
