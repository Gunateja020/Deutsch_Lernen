import React, { useState, useMemo, useEffect } from 'react';
import { Flashcard, SrsData, ReviewRating } from '../types';
import { SpeakerIcon, EditIcon, DeleteIcon, ArrowLeftIcon } from '../constants';

interface FlashcardsProps {
  queue: Flashcard[];
  onCardRated: (card: Flashcard, rating: ReviewRating) => void;
  onBack: () => void;
  isFreePractice: boolean;
  isReverse?: boolean;
  onEditCard: (oldCard: Flashcard, newCard: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
}

type SessionStats = {
  [key in ReviewRating]: number;
};

// BROWSER-NATIVE TEXT-TO-SPEECH FOR UNLIMITED USAGE
function browserSpeak(text: string, lang: string) {
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = lang; // 'de-DE' for German, 'en-US' for English
  window.speechSynthesis.speak(utter);
}

const Flashcards: React.FC<FlashcardsProps> = ({ queue, onCardRated, onBack, isFreePractice, isReverse = false, onEditCard, onDeleteCard }) => {
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 });

  const [isEditing, setIsEditing] = useState(false);
  const [editGerman, setEditGerman] = useState('');
  const [editEnglish, setEditEnglish] = useState('');

  useEffect(() => {
    setReviewQueue([...queue]);
    setCurrentIndex(0);
    setIsAnswerShown(false);
    setSessionComplete(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setIsEditing(false);
  }, [queue]);

  const currentCard = useMemo(
    () => reviewQueue.length === 0 ? null : reviewQueue[currentIndex],
    [reviewQueue, currentIndex]
  );

  const handleStartEdit = () => {
    if (currentCard) {
      setEditGerman(currentCard.german);
      setEditEnglish(currentCard.english);
      setIsEditing(true);
      setIsAnswerShown(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (currentCard && onEditCard) {
      const newCard: Flashcard = {
        ...currentCard,
        german: editGerman.trim(),
        english: editEnglish.trim(),
      };
      
      onEditCard(currentCard, newCard);
      
      const updatedQueue = reviewQueue.map((card, index) => 
        index === currentIndex ? newCard : card
      );
      setReviewQueue(updatedQueue);

      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (currentCard && onDeleteCard && confirm(`Are you sure you want to delete the card: "${currentCard.german}"?`)) {
        onDeleteCard(currentCard);
        

        const updatedQueue = reviewQueue.filter((_, index) => index !== currentIndex);
        
        if (updatedQueue.length === 0) {
        
            setSessionComplete(true);
        } else if (currentIndex >= updatedQueue.length) {
      
            setCurrentIndex(0);
        } else {
          
        }
        
        setReviewQueue(updatedQueue);
        setIsAnswerShown(false);
        setIsEditing(false);
    }
  };


  const handleShowAnswer = () => {
    if (!currentCard) return;
    setIsAnswerShown(true);
    
    const cardIsReversed = currentCard?.isReversed ?? isReverse;
    const backText = cardIsReversed ? currentCard?.german : currentCard?.english;
    const backLang = cardIsReversed ? 'de-DE' : 'en-US';
    
    browserSpeak(backText!, backLang);
  };

  const handleRate = (rating: ReviewRating) => {
    if (!currentCard) return;

    if (!isFreePractice) {
        onCardRated(currentCard, rating);
    }

    setSessionStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }));

    let newQueue = [...reviewQueue];
    let cardToReAdd: Flashcard | null = null;
    
    if (rating === 'again' || rating === 'hard') {
        cardToReAdd = newQueue.splice(currentIndex, 1)[0];
    } else {
        newQueue.splice(currentIndex, 1);
    }

    if (cardToReAdd) {
        newQueue.push(cardToReAdd);
    }

    if (newQueue.length === 0) {
        setSessionComplete(true);
    } else {
        let newIndex = (currentIndex >= newQueue.length) ? 0 : currentIndex;
        
        setCurrentIndex(newIndex);
        setReviewQueue(newQueue);
        setIsAnswerShown(false);
    }
  };
  
  const cardIsReversed = currentCard?.isReversed ?? isReverse;
  const frontText = currentCard ? (cardIsReversed ? currentCard.english : currentCard.german) : '';
  const backText = currentCard ? (cardIsReversed ? currentCard.german : currentCard.english) : '';
  const frontLang = cardIsReversed ? 'en-US' : 'de-DE';
  const backLang = cardIsReversed ? 'de-DE' : 'en-US';

  if (sessionComplete) {
    return (
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">Session Complete! 🎉</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">You've finished the review for now.</p>

            <h3 className="text-xl font-semibold mb-3">Your Performance</h3>
            <div className="grid grid-cols-4 gap-4 text-white font-bold mb-8">
                <div className="bg-red-500 p-3 rounded-lg">Again: {sessionStats.again}</div>
                <div className="bg-orange-400 p-3 rounded-lg">Hard: {sessionStats.hard}</div>
                <div className="bg-green-500 p-3 rounded-lg">Good: {sessionStats.good}</div>
                <div className="bg-blue-500 p-3 rounded-lg">Easy: {sessionStats.easy}</div>
            </div>

            <button onClick={onBack} className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
                Back to Practice
            </button>
        </div>
    );
  }

  if (!currentCard) {
    return (
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-4">No cards in this deck or review queue.</h2>
            <button onClick={onBack} className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors">
                <ArrowLeftIcon /> Back to Practice
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-lg mb-6 flex justify-between items-center">
        <button onClick={onBack} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors flex items-center gap-1">
          <ArrowLeftIcon /> Back
        </button>
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Card {reviewQueue.length > 0 ? (currentIndex % reviewQueue.length) + 1 : 0} / {reviewQueue.length}
        </div>
        {/* --- ADDED Edit and Delete Buttons --- */}
        {(currentCard.originDeck && !currentCard.originDeck.startsWith('Greetings') && !currentCard.originDeck.startsWith('Numbers') && !currentCard.originDeck.startsWith('Common')) ? (
            <div className='flex gap-2'>
                <button onClick={handleStartEdit} className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label="Edit card">
                    <EditIcon />
                </button>
                <button onClick={handleDelete} className="p-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" aria-label="Delete card">
                    <DeleteIcon />
                </button>
            </div>
        ) : <div className="w-16"></div> /* Placeholder for alignment */ }
      </div>

      {/* --- Main Card Body --- */}
      <div 
        className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-lg min-h-60 flex flex-col items-center justify-center text-center"
      >
        {isEditing ? (
            <div className="w-full space-y-4 p-4">
                <h3 className="text-xl font-bold mb-4">Edit Flashcard</h3>
                <div>
                    <label className="block text-left text-sm font-medium mb-1">German Word</label>
                    <input
                        type="text"
                        value={editGerman}
                        onChange={(e) => setEditGerman(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-left text-sm font-medium mb-1">English Translation</label>
                    <input
                        type="text"
                        value={editEnglish}
                        onChange={(e) => setEditEnglish(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancel</button>
                    <button onClick={handleSaveEdit} disabled={!editGerman.trim() || !editEnglish.trim()} className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-green-400">Save</button>
                </div>
            </div>
        ) : isAnswerShown ? (
            <>
              <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {cardIsReversed ? 'German Word' : 'English Translation'}
              </p>
              <button
                  onClick={() => browserSpeak(backText!, backLang)}
                  className="p-2"
                  aria-label={`Hear ${cardIsReversed ? 'German' : 'English'} pronunciation`}
                >
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mt-2 mb-4 break-words">
                    {backText}
                </span>
                <SpeakerIcon />
              </button>
              <p className="text-md text-gray-600 dark:text-gray-300 mt-2">
                (Front was: {frontText})
              </p>
            </>
          ) : (
            <>
              <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {cardIsReversed ? 'English Translation' : 'German Word'}
              </p>
               <button
                  onClick={() => browserSpeak(frontText!, frontLang)}
                  className="p-2"
                  aria-label={`Hear ${cardIsReversed ? 'English' : 'German'} pronunciation`}
                >
                <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mt-2 mb-4 break-words">
                    {frontText}
                </span>
                <SpeakerIcon />
              </button>
            </>
          )}

        {/* --- Buttons --- */}
        <div className="w-full max-w-lg mt-8">
          {isEditing ? (
             null // Hide rating buttons while editing
          ) : isAnswerShown ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => handleRate('again')} className="p-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Again</button>
              <button onClick={() => handleRate('hard')} className="p-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">Hard</button>
              <button onClick={() => handleRate('good')} className="p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">Good</button>
              <button onClick={() => handleRate('easy')} className="p-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">Easy</button>
            </div>
          ) : (
            <button onClick={handleShowAnswer} className="w-full p-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-colors">
              Show Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
