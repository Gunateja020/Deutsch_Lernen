import React, { useState, useRef, useEffect } from 'react';

import { RobotIcon, UserIcon, SpeakerIcon } from '../constants';
import { ChatMessage } from '../types';
import { getTutorResponse } from '../services/geminiService';
import { MarkdownRenderer } from './LessonRenderer';

// Browser TTS function
function browserSpeak(text, lang) {
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}

const LearnSection: React.FC = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
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
    <div>
      {messages.map((msg, index) => (
        <div key={index} className="flex items-start gap-3 py-2">
          {msg.sender === 'ai' && <RobotIcon />}
          {msg.sender === 'user' && <UserIcon />}
          <div className="flex flex-col gap-1">
            <MarkdownRenderer>{msg.content}</MarkdownRenderer>
            {msg.sender === 'ai' && (
              <button
                onClick={() => browserSpeak(msg.content, 'de-DE')}
                className="ml-1 p-1"
                aria-label="Hear German pronunciation"
              >
                <SpeakerIcon />
              </button>
            )}
          </div>
        </div>
      ))}
      <div ref={chatEndRef}></div>
      {isLoading && messages.length > 0 && <div className="p-2">Thinking...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {messages.length <= 1 && !isLoading && (
        <div className="flex gap-2 my-4 flex-wrap">
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
      <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 mt-4">
        <input
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Ask your AI tutor anything..."
          className="flex-grow p-3 border rounded-full dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold">Send</button>
      </form>
    </div>
  );
};

export default LearnSection;
