import React, { useState, useRef, useEffect } from 'react';
import { Bot, Brain, Zap, Sparkles, Send, List, BookOpen, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customChatbotService } from '../services/customChatbotService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Helper function to format message content
const formatMessageContent = (content: string) => {
  if (!content) return '';
  
  // Replace **text** with styled spans
  content = content.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-purple-200">$1</span>');
  
  // Convert numbered lists
  const lines = content.split('\n');
  let formattedLines = lines.map(line => {
    // Check for section headers (e.g., "Technical Skills:", "Business Skills:")
    if (line.match(/^[A-Za-z\s]+:$/)) {
      return `<h3 class="text-lg font-semibold text-purple-300 mt-3 mb-2">${line}</h3>`;
    }
    // Check for numbered list items (e.g., "1.", "2.", etc.)
    if (/^\d+\.\s/.test(line)) {
      const number = line.match(/^\d+/)?.[0] || '';
      return `<div class="flex items-start space-x-2 mb-2">
                <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-600 rounded-full text-sm">${number}</span>
                <span class="flex-1">${line.replace(/^\d+\.\s/, '')}</span>
              </div>`;
    }
    // Check for bullet points
    if (line.startsWith('• ')) {
      return `<div class="flex items-start space-x-2 mb-2">
                <span class="flex-shrink-0 w-2 h-2 mt-2 bg-purple-400 rounded-full"></span>
                <span class="flex-1">${line.substring(2)}</span>
              </div>`;
    }
    // Add spacing between paragraphs
    if (line === '') {
      return '<div class="h-2"></div>';
    }
    return `<p class="mb-2">${line}</p>`;
  });

  return formattedLines.join('\n');
};

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  links?: { text: string; url: string }[];
  category?: 'skills' | 'education' | 'career' | 'general';
}

const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    type: 'bot',
    content: 'Hi there! I\'m CareerBot, your AI career advisor. How can I help you today?',
    timestamp: new Date(),
    suggestions: [
      "Tell me about career paths",
      "What skills should I develop?",
      "Help me with my resume",
      "Career change advice"
    ]
  }]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <Sparkles className="h-12 w-12 text-purple-300" />,
      title: "Smart Insights",
      description: "Get personalized career advice based on your skills and interests."
    },
    {
      icon: <Brain className="h-12 w-12 text-purple-300" />,
      title: "Career Guidance",
      description: "Expert advice on career paths, skills, and job market trends."
    },
    {
      icon: <Zap className="h-12 w-12 text-purple-300" />,
      title: "Real-time Support",
      description: "Instant responses to your career-related questions."
    }
  ];

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'skills':
        return <Target className="h-5 w-5 text-purple-300" />;
      case 'education':
        return <BookOpen className="h-5 w-5 text-purple-300" />;
      case 'career':
        return <List className="h-5 w-5 text-purple-300" />;
      default:
        return null;
    }
  };

  const handleSendMessage = async (text: string): Promise<void> => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await customChatbotService.handleUserInput(text);
      const category = text.toLowerCase().includes('skill') ? 'skills' 
                    : text.toLowerCase().includes('education') ? 'education'
                    : text.toLowerCase().includes('career') ? 'career'
                    : 'general';
                    
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        category,
        suggestions: [
          "Tell me more",
          "What about other options?",
          "How do I get started?",
          "What skills do I need?"
        ]
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      toast.error("I'm having trouble processing your request. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleLinkClick = (url: string) => {
    navigate(url);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white">
      {/* Hero Section */}
      <div className="pt-16 pb-12 text-center">
        <Bot className="h-24 w-24 mx-auto mb-6 text-purple-300" />
        <h1 className="text-5xl font-bold mb-4">Meet CareerBot</h1>
        <p className="text-xl text-purple-200 max-w-2xl mx-auto">
          Your career guidance companion, available 24/7 to help you navigate your professional journey.
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-purple-800/50 backdrop-blur-sm rounded-2xl p-6 transform hover:scale-105 transition-all">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-purple-200">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-purple-800/30 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-purple-700/30">
          {/* Chat Messages */}
          <div className="h-[500px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.type === 'bot' ? 'flex items-start space-x-3' : ''}`}>
                    {message.type === 'bot' && message.category && (
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-700/50 rounded-full flex items-center justify-center">
                        {getCategoryIcon(message.category)}
                      </div>
                    )}
                    <div>
                      <div
                        className={`p-4 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-800/50 border border-purple-700/50'
                        }`}
                      >
                        <div 
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: message.type === 'bot' 
                              ? formatMessageContent(message.content)
                              : message.content 
                          }}
                        />
                        <p className="text-xs mt-2 text-purple-300">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Suggestions */}
                      {message.type === 'bot' && message.suggestions && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-sm bg-purple-700/50 hover:bg-purple-600/50 px-3 py-1.5 rounded-full transition-colors border border-purple-600/50 hover:border-purple-500/50"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-700/50 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="bg-purple-800/50 p-4 rounded-2xl border border-purple-700/50">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleFormSubmit} className="p-4 bg-purple-700/30 border-t border-purple-600/30">
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask CareerBot anything..."
                className="flex-1 bg-purple-800/50 text-white placeholder-purple-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-600/50"
              />
              <button
                type="submit"
                className="bg-purple-600 p-3 rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                disabled={isTyping}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-purple-300 mt-6">
          CareerBot is here to help you make informed career decisions.
        </p>
      </div>
    </div>
  );
};

export default ChatbotPage;