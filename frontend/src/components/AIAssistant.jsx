import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Film, Calendar, HelpCircle } from 'lucide-react';
import { api } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: 'assistant', text: 'Hi! I am your CinePlex AI Assistant. 🍿 Ask me about movie recommendations, current showtimes, or how to book a ticket!' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userText = message;
    const userMsgId = Date.now();
    setChatHistory(prev => [...prev, { id: userMsgId, sender: 'user', text: userText }]);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/chatbot/message', { message: userText });
      const assistantText = response.data.reply;
      
      setChatHistory(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'assistant', 
        text: assistantText 
      }]);
    } catch {
      setChatHistory(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'assistant', 
        text: 'Sorry, I am having trouble connecting to my theater databases right now. Please try again shortly!' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (text) => {
    setMessage(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-brand-red text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-brand-red/90 transition-all cursor-pointer glow-on-hover"
        whileTap={{ scale: 0.95 }}
        aria-label="CinePlex Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 h-[480px] glass rounded-xl shadow-2xl flex flex-col border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-red/90 to-brand-red/70 px-4 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-white tracking-wide text-sm">CinePlex Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {chatHistory.map((chat) => (
                <div 
                  key={chat.id} 
                  className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs md:text-sm shadow-md whitespace-pre-line leading-relaxed ${chat.sender === 'user' ? 'bg-brand-red text-white rounded-tr-none' : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'}`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-gray-100 rounded-lg rounded-tl-none px-3 py-2 border border-white/5 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-white/5 flex gap-1 overflow-x-auto scrollbar-none bg-black/20">
              <button 
                onClick={() => handleQuickQuestion('Showtime schedules')}
                className="flex-none flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-1 rounded-full border border-white/5"
              >
                <Calendar className="w-2.5 h-2.5 text-brand-red" />
                Schedules
              </button>
              <button 
                onClick={() => handleQuickQuestion('Recommend a movie')}
                className="flex-none flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-1 rounded-full border border-white/5"
              >
                <Film className="w-2.5 h-2.5 text-brand-red" />
                Recommend
              </button>
              <button 
                onClick={() => handleQuickQuestion('How to book tickets?')}
                className="flex-none flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-1 rounded-full border border-white/5"
              >
                <HelpCircle className="w-2.5 h-2.5 text-brand-red" />
                Booking Info
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/15 flex gap-2 bg-brand-black">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask assistant..."
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:border-brand-red/50 text-white"
              />
              <button 
                type="submit" 
                className="bg-brand-red text-white p-2 rounded-md hover:bg-brand-red/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading || !message.trim()}
                aria-label="Send assistant message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistant;
