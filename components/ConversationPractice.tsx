import React, { useState, useEffect, useRef } from 'react';
import { ConversationMessage } from '../types';
import { getConversationResponse } from '../services/geminiService';
import { RobotIcon, UserIcon } from '../constants';
import { MarkdownRenderer } from './LessonRenderer';

interface ConversationPracticeProps {
    onBack: () => void;
    userLevel: string;
    onComplete: () => void;
}

const SCENARIOS = {
    'cafe': {
        title: "At a Café",
        prompt: "You are at a café in Berlin. You want to order a coffee and a croissant. The AI is the barista.",
        initialMessage: "Guten Tag! Was kann ich für Sie tun?",
    },
    'directions': {
        title: "Asking for Directions",
        prompt: "You are a tourist in Munich, and you are lost. You need to ask for directions to the train station (der Bahnhof). The AI is a helpful local.",
        initialMessage: "Entschuldigung, kann ich Ihnen helfen?",
    },
    'market': {
        title: "At the Market",
        prompt: "You are at a farmers' market. You want to buy some apples (Äpfel) and cheese (Käse). The AI is the vendor.",
        initialMessage: "Hallo! Suchen Sie etwas Bestimmtes?",
    }
};

type ScenarioKey = keyof typeof SCENARIOS;

const ConversationPractice: React.FC<ConversationPracticeProps> = ({ onBack, userLevel, onComplete }) => {
    const [scenario, setScenario] = useState<ScenarioKey | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const startScenario = (key: ScenarioKey) => {
        setScenario(key);
        setMessages([{ sender: 'ai', content: SCENARIOS[key].initialMessage }]);
    };
    
    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading || !scenario) return;

        const userMessage: ConversationMessage = { sender: 'user', content: userInput.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            const aiResponse = await getConversationResponse(SCENARIOS[scenario].prompt, newMessages, userLevel);
            const aiMessage: ConversationMessage = { sender: 'ai', content: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setMessages(prev => prev.slice(0, -1)); // Remove user message on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBack = () => {
        // A meaningful interaction is at least one back-and-forth (AI -> User -> AI)
        // So if there are more than 2 messages, the user has interacted.
        if (messages.length > 1) {
            onComplete();
        }
        onBack();
    };

    if (!scenario) {
        return (
            <div>
                 <button onClick={onBack} className="mb-6 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">&larr; Back to Challenges</button>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-2">Conversation Practice</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Choose a scenario to start a role-playing conversation with the AI.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.keys(SCENARIOS).map(key => (
                            <button key={key} onClick={() => startScenario(key as ScenarioKey)} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                                <h3 className="font-semibold text-lg">{SCENARIOS[key as ScenarioKey].title}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
         <div className="max-w-3xl mx-auto">
            <button onClick={handleBack} className="mb-4 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">&larr; Back to Challenges</button>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col h-[calc(100vh-14rem)]">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-center">{SCENARIOS[scenario].title}</h3>
                    <p className="text-sm text-gray-500 text-center">{SCENARIOS[scenario].prompt}</p>
                </div>
                 <div className="flex-grow overflow-y-auto pr-4 space-y-6">
                    {messages.map((msg, index) => {
                        const [mainContent, hint] = msg.content.split('--- HINT ---');
                        return (
                            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><RobotIcon /></div>}
                                <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-600 text-white'}`}>
                                    <p>{mainContent}</p>
                                    {hint && <p className="text-xs italic mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">{hint}</p>}
                                </div>
                                {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white"><UserIcon /></div>}
                            </div>
                        )
                    })}
                    {isLoading && <div className="flex items-start gap-3">...</div>}
                    <div ref={chatEndRef} />
                 </div>
                 <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                     {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Type your response in German..."
                            className="flex-grow p-3 border rounded-full dark:bg-gray-700 dark:border-gray-600"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-400">Send</button>
                    </form>
                 </div>
            </div>
        </div>
    );
};

export default ConversationPractice;
