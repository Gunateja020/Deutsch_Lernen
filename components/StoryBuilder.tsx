import React, { useState, useEffect, useRef } from 'react';
import { continueStory } from '../services/geminiService';
import { StoryPart } from '../types';
import { RobotIcon, UserIcon } from '../constants';

interface StoryBuilderProps {
    onBack: () => void;
    userLevel: string;
    onComplete: () => void;
}

const StoryBuilder: React.FC<StoryBuilderProps> = ({ onBack, userLevel, onComplete }) => {
    const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const storyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [storyParts]);

    const fetchFirstLine = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const firstLine = await continueStory([], userLevel);
            setStoryParts([{ author: 'ai', text: firstLine }]);
        } catch (err: any) {
            setError(err.message || "Failed to start the story.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchFirstLine();
    }, [userLevel]);

    const handleAddSentence = async () => {
        if (!userInput.trim() || isLoading) return;

        const userPart: StoryPart = { author: 'user', text: userInput.trim() };
        const newHistory = [...storyParts, userPart];
        setStoryParts(newHistory);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            const aiPartText = await continueStory(newHistory, userLevel);
            const aiPart: StoryPart = { author: 'ai', text: aiPartText };
            setStoryParts(prev => [...prev, aiPart]);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (storyParts.some(part => part.author === 'user')) {
            onComplete();
        }
        onBack();
    };
    
    return (
        <div className="max-w-3xl mx-auto">
            <button onClick={handleBack} className="mb-4 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">&larr; Back to Challenges</button>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col h-[calc(100vh-14rem)]">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4 text-center">
                    <h2 className="text-2xl font-bold">Collaborative Story</h2>
                    <p className="text-sm text-gray-500">The AI writes a sentence, then you write the next. Let's build a story together!</p>
                </div>

                <div className="flex-grow overflow-y-auto pr-4 space-y-4">
                    {storyParts.map((part, index) => (
                         <div key={index} className={`flex items-start gap-3 ${part.author === 'user' ? 'justify-end' : ''}`}>
                            {part.author === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><RobotIcon /></div>}
                            <div className={`p-3 rounded-lg ${part.author === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-600 text-white'}`}>
                                <p>{part.text}</p>
                            </div>
                            {part.author === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white"><UserIcon /></div>}
                        </div>
                    ))}
                     {isLoading && storyParts.length > 0 && <div className="text-center text-gray-500">AI is thinking...</div>}
                     <div ref={storyEndRef} />
                </div>
                 <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                     {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
                    <form onSubmit={(e) => { e.preventDefault(); handleAddSentence(); }} className="flex gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={isLoading ? "Wait for AI's turn..." : "Write the next sentence..."}
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

export default StoryBuilder;
