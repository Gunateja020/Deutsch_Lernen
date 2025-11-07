import React, { useState, useEffect } from 'react';
import { DailyLesson, FlashcardDeck } from '../types';
import { generateDailyLesson } from '../services/geminiService';
import { MarkdownRenderer } from './LessonRenderer';
import { SpinnerIcon, SpeakerIcon } from '../constants';

// Browser TTS function
function browserSpeak(text, lang) {
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}

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
    <div className="w-full max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-2">Lesson of the Day</h2>
      <p className="text-gray-500 mb-2">A new AI-generated lesson tailored to your level.</p>
      <div className="mb-2">Current Level: <span className="font-bold">{userLevel}</span></div>
      {isLoading && <div className="flex items-center gap-2"><SpinnerIcon /> Preparing your lesson for today...</div>}
      {error && <div className="text-red-600">Oh no!<br/>{error}</div>}
      {lesson && !isLoading && !error && (
        <>
          <h3 className="text-lg mt-3 font-semibold">{lesson.topic}</h3>
          <button
            onClick={() => browserSpeak(lesson.topic, 'de-DE')}
            className="ml-2 p-2"
            aria-label="Hear German pronunciation"
          >
            <SpeakerIcon />
          </button>
          <div className="mb-2">
            <MarkdownRenderer>{lesson.content}</MarkdownRenderer>
            <button
              onClick={() => browserSpeak(lesson.content, 'de-DE')}
              className="ml-2 p-2"
              aria-label="Hear German pronunciation"
            >
              <SpeakerIcon />
            </button>
          </div>
          <h4 className="font-semibold mt-2">Vocabulary:</h4>
          <div className="flex flex-wrap gap-3">
            {lesson.vocabulary.map((word, i) => (
              <div key={i} className="flex items-center gap-1 border p-2 rounded">
                <span>{word.german}</span>
                <button
                  onClick={() => browserSpeak(word.german, 'de-DE')}
                  className="p-1"
                  aria-label="Hear German pronunciation"
                >
                  <SpeakerIcon />
                </button>
                <span className="ml-2">{word.english}</span>
                <button
                  onClick={() => browserSpeak(word.english, 'en-US')}
                  className="p-1"
                  aria-label="Hear English pronunciation"
                >
                  <SpeakerIcon />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            {isLessonAlreadyAdded ? (
              <span className="font-semibold text-green-700">This lesson's flashcards have been added to your Practice decks!</span>
            ) : (
              <button
                onClick={handleAddToPractice}
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                Add {lesson.vocabulary.length} Flashcards to Practice
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeachingsSection;
