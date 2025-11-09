import React, { useState, useMemo } from 'react';
import { Flashcard, SrsData, ReviewRating } from '../types';
import { SpeakerIcon } from '../constants';

interface FlashcardsProps {
  queue: Flashcard[];
  onCardRated: (card: Flashcard, rating: ReviewRating) => void;
  onBack: () => void;
  isFreePractice: boolean;
  isReverse?: boolean;
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

const Flashcards: React.FC<FlashcardsProps> = ({ queue, onCardRated, onBack, isFreePractice, isReverse = false }) => {
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>(queue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 });

  const currentCard = useMemo(
    () => reviewQueue.length === 0 ? null : reviewQueue[currentIndex],
    [reviewQueue, currentIndex]
  );

  // Check if the specific card has a reverse flag, otherwise use the session-wide prop
  const cardIsReversed = currentCard?.isReversed !== undefined ? currentCard.isReversed : isReverse;

  const frontText = cardIsReversed ? currentCard?.english : currentCard?.german;
  const backText = cardIsReversed ? currentCard?.german : currentCard?.english;

  const handleShowAnswer = () => setIsAnswerShown(true);

  const handleRate = (rating: ReviewRating) => {
    if (!currentCard) return;

    if (!isFreePractice) {
      onCardRated(currentCard, rating);
    }
    setSessionStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }));

    const nextQueue = [...reviewQueue];
    nextQueue.splice(currentIndex, 1);

    if (rating === "again") {
      const reinsertIndex = Math.min(currentIndex + 4, nextQueue.length);
      nextQueue.splice(reinsertIndex, 0, currentCard);
    }

    if (nextQueue.length === 0 || currentIndex >= nextQueue.length) {
      setSessionComplete(true);
    } else {
      setReviewQueue(nextQueue);
      setIsAnswerShown(false);
    }
  };

  if (sessionComplete) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold mb-4">{isFreePractice ? "Practice Complete!" : "Session Complete!"}</h2>
        <div className="w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            You reviewed {Object.values(sessionStats).reduce((a, b) => a + b, 0)} cards.
          </p>
          {isFreePractice && <p className="text-sm text-gray-500 mb-4">(Your SRS schedule was not updated)</p>}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <p>Again: {sessionStats.again}</p>
            <p>Hard: {sessionStats.hard}</p>
            <p>Good: {sessionStats.good}</p>
            <p>Easy: {sessionStats.easy}</p>
          </div>
          <button onClick={onBack} className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (reviewQueue.length === 0 && !sessionComplete) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold mb-4">All Done for Now!</h2>
        <div className="w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            There are no new cards or cards due for review today.
          </p>
          <button onClick={onBack} className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        &larr; Back to Dashboard
      </button>
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-center">Practice Session</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {reviewQueue.length} cards remaining
        </p>

        <div className="w-full max-w-lg min-h-[16rem] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col items-center justify-center p-6 text-center">
          {/* --- Use frontText and backText here --- */}
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            {frontText}
            <button
              onClick={() => browserSpeak(frontText, isReverse ? 'en-US' : 'de-DE')}
              className="ml-2 p-2"
              aria-label={`Hear ${isReverse ? 'English' : 'German'} pronunciation`}
            >
              <SpeakerIcon />
            </button>
          </p>
          {isAnswerShown && (
            <>
              <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-6"></div>
              <p className="text-3xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                {backText}
                <button
                  onClick={() => browserSpeak(backText, isReverse ? 'de-DE' : 'en-US')}
                  className="ml-2 p-2"
                  aria-label={`Hear ${isReverse ? 'German' : 'English'} pronunciation`}
                >
                  <SpeakerIcon />
                </button>
              </p>
            </>
          )}
        </div>

        <div className="w-full max-w-lg mt-8">
          {isAnswerShown ? (
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
