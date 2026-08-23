import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import api from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import { useSocketEvent } from '../../../hooks/useSocket';

export default function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/emergency/${sessionId}/chat`)
      .then(res => setMessages(res.data.data))
      .catch(console.error);
  }, [sessionId]);

  useSocketEvent('chat_message', (msg) => {
    setMessages(prev => [...prev, msg]);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    try {
      await api.post(`/emergency/${sessionId}/chat`, { message: input });
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-[400px] glass rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border-light bg-bg-elevated/50">
        <h3 className="font-bold text-text-primary">Emergency Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMine = msg.senderId === user?.id;
          return (
            <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className="text-xs text-text-muted mb-1">{msg.senderRole}</div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                isMine 
                  ? 'bg-accent-blue text-white rounded-tr-sm' 
                  : 'bg-bg-elevated text-text-primary rounded-tl-sm'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-bg-elevated/50 border-t border-border-light flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-bg-card border border-border-light rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full bg-accent-blue flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
