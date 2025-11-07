import React, { useState } from 'react';
import ConversationPractice from './ConversationPractice';
import ImageDescription from './ImageDescription';
import StoryBuilder from './StoryBuilder';
import { ChatBubbleIcon, CameraIcon, BookOpenIcon } from '../constants';
import { ChallengeStats } from '../types';

type Challenge = 'conversation' | 'image' | 'story';

interface ChallengesSectionProps {
    userLevel: string;
    onChallengeCompleted: (challengeType: keyof ChallengeStats) => void;
}

const ChallengeCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onStart: () => void;
}> = ({ icon, title, description, onStart }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
        <div className="text-blue-500 dark:text-blue-400 mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 flex-grow">{description}</p>
        <button 
            onClick={onStart} 
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
            Start Challenge
        </button>
    </div>
);


const ChallengesSection: React.FC<ChallengesSectionProps> = ({ userLevel, onChallengeCompleted }) => {
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

    if (activeChallenge === 'conversation') {
        return <ConversationPractice onBack={() => setActiveChallenge(null)} userLevel={userLevel} onComplete={() => onChallengeCompleted('conversation')} />;
    }
    if (activeChallenge === 'image') {
        return <ImageDescription onBack={() => setActiveChallenge(null)} userLevel={userLevel} onComplete={() => onChallengeCompleted('image')} />;
    }
    if (activeChallenge === 'story') {
        return <StoryBuilder onBack={() => setActiveChallenge(null)} userLevel={userLevel} onComplete={() => onChallengeCompleted('story')} />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                 <div className="flex justify-center items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">AI Practice Challenges</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Go beyond flashcards. Use German in creative and practical ways with these AI-powered exercises designed to test your skills in different contexts.
                        </p>
                    </div>
                     <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">Your Level</p>
                        <p className="text-3xl font-bold">{userLevel}</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ChallengeCard
                    icon={<ChatBubbleIcon />}
                    title="AI Conversation Practice"
                    description="Engage in a role-playing chat with an AI. Practice real-world scenarios like ordering coffee or asking for directions."
                    onStart={() => setActiveChallenge('conversation')}
                />
                <ChallengeCard
                    icon={<CameraIcon />}
                    title="Describe the Image"
                    description="The AI will generate a unique image. Your task is to describe what you see in German and get instant feedback."
                    onStart={() => setActiveChallenge('image')}
                />
                <ChallengeCard
                    icon={<BookOpenIcon />}
                    title="Collaborative Story"
                    description="You and the AI take turns writing a story in German, one sentence at a time. A fun way to practice sentence structure."
                    onStart={() => setActiveChallenge('story')}
                />
            </div>
        </div>
    );
};

export default ChallengesSection;
