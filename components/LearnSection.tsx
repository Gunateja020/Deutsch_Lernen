import React, { useState, useRef, useEffect } from 'react';
import { RobotIcon, UserIcon } from '../constants';
import { ChatMessage } from '../types';
import { getTutorResponse } from '../services/geminiService';
import { MarkdownRenderer } from './LessonRenderer';

const LearnSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    // Initial greeting from the AI tutor
    const initialMessage: ChatMessage = {
        sender: 'ai',
        content: "Hallo! I am your AI German tutor. What would you like to learn today? You can ask for a lesson on a specific topic (like 'greetings' or 'ordering food'), ask me to explain a grammar concept, or just say 'surprise me!' to get started."
    };
    setMessages([initialMessage]);
    setIsLoading(false);
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const text = (messageText || userInput).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const aiResponse = await getTutorResponse(newMessages);
      const aiMessage: ChatMessage = { sender: 'ai', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = ["Greetings", "Numbers 1-10", "Ordering Food", "Explain 'der, die, das'"];
  
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
        <div className="flex-grow overflow-y-auto pr-4 space-y-6">
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    {msg.sender === 'ai' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            <RobotIcon />
                        </div>
                    )}
                    <div className={`p-4 rounded-lg max-w-lg ${msg.sender === 'ai' ? 'bg-white dark:bg-gray-800 shadow-md' : 'bg-blue-600 text-white'}`}>
                        {msg.sender === 'ai' ? <MarkdownRenderer content={msg.content} /> : <p>{msg.content}</p>}
                    </div>
                     {msg.sender === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                            <UserIcon />
                        </div>
                    )}
                </div>
            ))}
            {isLoading && messages.length > 0 && (
                <div className="flex items-start gap-3">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        <RobotIcon />
                    </div>
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            )}
             {error && <p className="text-red-500 text-center">{error}</p>}
             <div ref={chatEndRef} />
        </div>
        
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            {messages.length <= 1 && !isLoading && (
                 <div className="flex flex-wrap gap-2 mb-4 justify-center">
                    {suggestionChips.map(chip => (
                        <button 
                            key={chip}
                            onClick={() => handleSendMessage(chip)}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask your AI tutor anything..."
                    className="flex-grow p-3 border rounded-full dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                    Send
                </button>
            </form>
        </div>
    </div>
  );
};

export default LearnSection;
