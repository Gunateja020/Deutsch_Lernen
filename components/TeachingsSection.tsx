import React, { useState, useEffect } from 'react';
import { DailyLesson, FlashcardDeck } from '../types';
import { generateDailyLesson } from '../services/geminiService';
import { MarkdownRenderer } from './LessonRenderer';
import { SpinnerIcon } from '../constants';

interface TeachingsSectionProps {
    dailyDecks: FlashcardDeck[];
    onAddDailyDeck: (deck: FlashcardDeck) => void;
    userLevel: string;
}

interface DailyLessonStorage {
    date: string; // YYYY-MM-DD
    lesson: DailyLesson;
}

const TeachingsSection: React.FC<TeachingsSectionProps> = ({ dailyDecks, onAddDailyDeck, userLevel }) => {
    const [lesson, setLesson] = useState<DailyLesson | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const todayStr = new Date().toISOString().slice(0, 10);
    const STORAGE_KEY = 'dailyLesson';

    const isLessonAlreadyAdded = lesson ? dailyDecks.some(deck => deck.name === `Lesson: ${lesson.topic}`) : false;
    
    useEffect(() => {
        const fetchLesson = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Check local storage first
                const storedData = localStorage.getItem(STORAGE_KEY);
                if (storedData) {
                    const parsed: DailyLessonStorage = JSON.parse(storedData);
                    if (parsed.date === todayStr) {
                        setLesson(parsed.lesson);
                        setIsLoading(false);
                        return;
                    }
                }

                // If not in storage or from a previous day, fetch a new one
                const previousTopics = dailyDecks.map(deck => deck.name.replace('Lesson: ', ''));
                const newLesson = await generateDailyLesson(previousTopics, userLevel);
                setLesson(newLesson);

                // Save to local storage
                const dataToStore: DailyLessonStorage = { date: todayStr, lesson: newLesson };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));

            } catch (err: any) {
                setError(err.message || 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLesson();
    }, [todayStr, dailyDecks, userLevel, STORAGE_KEY]);

    const handleAddToPractice = () => {
        if (!lesson || isLessonAlreadyAdded) return;
        
        const newDeck: FlashcardDeck = {
            name: `Lesson: ${lesson.topic}`,
            difficulty: 'Daily Lesson',
            cards: lesson.vocabulary,
        };
        onAddDailyDeck(newDeck);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Lesson of the Day</h2>
                        <p className="text-gray-600 dark:text-gray-300">A new AI-generated lesson tailored to your level.</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">Current Level</p>
                        <p className="text-2xl font-bold">{userLevel}</p>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <SpinnerIcon />
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Preparing your lesson for today...</p>
                </div>
            )}

            {error && (
                <div className="p-6 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 rounded-md">
                    <p className="font-bold">Oh no!</p>
                    <p>{error}</p>
                </div>
            )}

            {lesson && !isLoading && !error && (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">{lesson.topic}</h3>
                    <div className="prose dark:prose-invert max-w-none">
                         <MarkdownRenderer content={lesson.explanation} />
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {isLessonAlreadyAdded ? (
                            <p className="text-center font-semibold text-green-600 dark:text-green-400">
                                This lesson's flashcards have been added to your Practice decks!
                            </p>
                        ) : (
                            <button
                                onClick={handleAddToPractice}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                            >
                                Add {lesson.vocabulary.length} Flashcards to Practice
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeachingsSection;