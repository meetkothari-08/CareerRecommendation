import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load the chatbot script
    const script = document.createElement('script');
    script.src = 'https://app.thinkstack.ai/bot/thinkstackai-loader.min.js';
    script.async = true;
    script.setAttribute('chatbot_id', '67a19cd76caeb99c8295bbdd');
    script.setAttribute('data-type', 'default');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? 'hidden' : 'flex'
        } items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
      >
        <MessageCircle className="h-6 w-6" />
        <span>Chat with CareerBot</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-0 right-0 mb-4 mr-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-white" />
              <h3 className="text-white font-semibold">CareerBot</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="h-[calc(100%-4rem)]">
            <div id="thinkstack-ai-bot" className="w-full h-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;