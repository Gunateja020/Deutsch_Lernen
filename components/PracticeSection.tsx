import React, { useState, useMemo, useEffect } from 'react';
import { Flashcard, FlashcardDeck, SrsData, ReviewRating, ReviewHistory } from '../types';
import Flashcards from './Flashcards';
import CreateDeck from './CreateDeck';
import ImportDeck from './ImportDeck';
import { getCardId } from '../services/srsService';
import { generatePracticeSession, generateDailyVocabulary } from '../services/geminiService';
import { SpinnerIcon } from '../constants';

interface PracticeSectionProps {
    allDecks: FlashcardDeck[];
    srsData: SrsData;
    reviewHistory: ReviewHistory;
    onSaveDeck: (deck: FlashcardDeck) => void;
    onAddDailyDeck: (deck: FlashcardDeck) => void;
    onCardRated: (card: Flashcard, rating: ReviewRating) => void;
    userLevel: string;
    allWords: Set<string>;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const PracticeSection: React.FC<PracticeSectionProps> = ({ allDecks, srsData, reviewHistory, onSaveDeck, onAddDailyDeck, onCardRated, userLevel, allWords }) => {
  const [practiceQueue, setPracticeQueue] = useState<Flashcard[] | null>(null);
  const [isFreePracticeSession, setIsFreePracticeSession] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const [dailySuggestions, setDailySuggestions] = useState<Flashcard[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionsAdded, setSuggestionsAdded] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastFetchedKey = 'dailySuggestionsLastFetched';
    const lastFetchedDate = localStorage.getItem(lastFetchedKey);

    if (lastFetchedDate === todayStr) {
      setSuggestionsAdded(true); // Assume they were added if we fetched today
      return;
    }

    const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setSuggestionError(null);
        try {
            const existingWordsArray = Array.from(allWords.values());
            const suggestions = await generateDailyVocabulary(userLevel, existingWordsArray);
            if (suggestions.length > 0) {
              setDailySuggestions(suggestions);
            } else {
              // If AI returns no words, mark as "done" for today to prevent re-fetching
              localStorage.setItem(lastFetchedKey, todayStr);
              setSuggestionsAdded(true);
            }
        } catch (err: any) {
            setSuggestionError(err.message);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    fetchSuggestions();
  }, [userLevel, allWords]);
  
  const handleAddSuggestions = () => {
    if (dailySuggestions.length === 0) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const newDeck: FlashcardDeck = {
        name: `AI Suggestions - ${todayStr}`,
        difficulty: 'Daily Suggestion',
        cards: dailySuggestions,
    };
    onAddDailyDeck(newDeck);
    setDailySuggestions([]);
    setSuggestionsAdded(true);
    localStorage.setItem('dailySuggestionsLastFetched', todayStr);
  };
  
  const handleSaveAndExitCreation = (newDeck: FlashcardDeck) => {
    onSaveDeck(newDeck);
    setIsCreating(false);
    setIsImporting(false);
  };
  
  const startFlashcardPractice = (cards: Flashcard[], isFreePractice: boolean) => {
    setPracticeQueue(cards);
    setIsFreePracticeSession(isFreePractice);
  };
  
  const { newCards, learningCards, dueCards, allCardsFlat } = useMemo(() => {
    const allC: Flashcard[] = allDecks.flatMap(deck => 
        deck.cards.map(card => ({ ...card, originDeck: deck.name }))
    );
    const todayUTCStart = new Date();
    todayUTCStart.setUTCHours(0, 0, 0, 0);

    const newC: Flashcard[] = [];
    const learningC: Flashcard[] = [];
    const dueC: Flashcard[] = [];
    
    allC.forEach(card => {
        const cardId = getCardId(card.originDeck!, card.german);
        const data = srsData[cardId];
        if (data) {
            const dueDate = new Date(data.dueDate);
            if (data.status === 'new') {
                newC.push(card);
            } else if (dueDate <= todayUTCStart) {
                if (data.status === 'learning') {
                    learningC.push(card);
                } else if (data.status === 'review') {
                    dueC.push(card);
                }
            }
        } else {
            newC.push(card);
        }
    });

    return { newCards: newC, learningCards: learningC, dueCards: dueC, allCardsFlat: allC };
  }, [allDecks, srsData]);

  const totalToReview = Math.min(newCards.length, 20) + learningCards.length + dueCards.length;

  const handleStartMasterPractice = () => {
    const practiceCards = shuffleArray([
        ...learningCards,
        ...dueCards,
        ...shuffleArray(newCards).slice(0, 20)
    ]).map(card => ({
        ...card,
        isReversed: Math.random() < 0.5 // 50% chance to be reversed
    }));
    startFlashcardPractice(practiceCards, false);
  };
  
  const handleStartFreePractice = async () => {
    setIsGeneratingPractice(true);
    setGenerationError(null);
    try {
      const practiceCardIds = await generatePracticeSession(allCardsFlat, srsData, reviewHistory);
      const cardMap = new Map(allCardsFlat.map(card => [getCardId(card.originDeck!, card.german), card]));
      const practiceCards = practiceCardIds.map(id => cardMap.get(id)).filter((c): c is Flashcard => c !== undefined);

      if (practiceCards.length === 0) {
        setGenerationError("The AI couldn't find any suitable cards for practice right now.");
      } else {
        startFlashcardPractice(practiceCards, true);
      }
    } catch (error: any) {
      console.error(error);
      setGenerationError(error.message || "An unknown error occurred while creating your session.");
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  if (practiceQueue) {
    return <Flashcards queue={practiceQueue} isFreePractice={isFreePracticeSession} onCardRated={onCardRated} onBack={() => setPracticeQueue(null)} />;
  }
  if (isCreating) {
    return <CreateDeck onSaveDeck={handleSaveAndExitCreation} onCancel={() => setIsCreating(false)} allWords={allWords} />;
  }
  if (isImporting) {
    return <ImportDeck onSaveDeck={handleSaveAndExitCreation} onCancel={() => setIsImporting(false)} />;
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold mb-2">Practice</h2>
            <p className="text-gray-600 dark:text-gray-300">Review due cards or start a free practice session.</p>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <button onClick={() => setIsImporting(true)} className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors">Import Cards</button>
            <button onClick={() => setIsCreating(true)} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors">Add New Cards</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
            <h3 className="text-xl font-bold mb-2 text-center">Daily Review</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 flex-grow text-center">Your daily scheduled review of new and due cards.</p>
            
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">New Words for You Today ({userLevel})</h4>
                {isLoadingSuggestions && <div className="flex justify-center items-center gap-2 p-2"><SpinnerIcon /><p>AI is finding words...</p></div>}
                {suggestionError && <p className="text-red-500 text-sm p-2">{suggestionError}</p>}
                
                {!isLoadingSuggestions && !suggestionError && suggestionsAdded && (
                    <p className="text-green-600 dark:text-green-400 font-semibold p-2">New words for today already added!</p>
                )}
                
                {!isLoadingSuggestions && !suggestionError && !suggestionsAdded && dailySuggestions.length > 0 && (
                    <div>
                        <ul className="text-sm text-left my-2 space-y-1 max-h-32 overflow-y-auto">
                            {dailySuggestions.map(card => (
                                <li key={card.german} className="grid grid-cols-2 gap-2 p-1 rounded bg-gray-100 dark:bg-gray-600">
                                    <span className="font-medium">{card.german}</span>
                                    <span className="text-gray-600 dark:text-gray-300">{card.english}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleAddSuggestions} className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors">
                            Add These Words to Practice
                        </button>
                    </div>
                )}

                 {!isLoadingSuggestions && !suggestionError && !suggestionsAdded && dailySuggestions.length === 0 && (
                     <p className="text-gray-500 p-2">No new suggestions for today. Check back tomorrow!</p>
                 )}
            </div>

            <button onClick={handleStartMasterPractice} disabled={totalToReview === 0} className="w-full mt-auto p-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed">
                {totalToReview > 0 ? `Start Practice (${totalToReview} cards due)` : 'All Done For Today!'}
            </button>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center text-center">
          <h3 className="text-xl font-bold mb-2">Free Practice</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 flex-grow">A casual flashcard session, intelligently curated by AI. This won't affect your review schedule.</p>
          <button 
            onClick={handleStartFreePractice} 
            disabled={isGeneratingPractice}
            className={`w-full p-4 font-semibold text-lg rounded-lg transition-colors flex items-center justify-center bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-wait`}
          >
             {isGeneratingPractice ? (
                <>
                    <SpinnerIcon /> 
                    <span className="ml-2">AI is building your session...</span>
                </>
            ) : 'Practice Any Card (AI Curated)'}
          </button>
        </div>
      </div>

      {generationError && <p className="text-red-500 mt-4 text-center text-sm">{generationError}</p>}

    </div>
  );
};

export default PracticeSection;
