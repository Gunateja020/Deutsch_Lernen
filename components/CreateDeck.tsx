import React, { useState } from 'react';
import { Flashcard, FlashcardDeck } from '../types';

interface CreateDeckProps {
  onSaveDeck: (deck: FlashcardDeck) => void;
  onCancel: () => void;
  allWords: Set<string>;
}

const CreateDeck: React.FC<CreateDeckProps> = ({ onSaveDeck, onCancel, allWords }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentGerman, setCurrentGerman] = useState('');
  const [currentEnglish, setCurrentEnglish] = useState('');
  const [error, setError] = useState('');
  const [germanError, setGermanError] = useState('');

  const handleGermanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGerman = e.target.value;
    setCurrentGerman(newGerman);
    const newGermanLower = newGerman.trim().toLowerCase();
    
    if (newGermanLower && allWords.has(newGermanLower)) {
        setGermanError("This word is already in your collection.");
    } else if (cards.some(card => card.german.toLowerCase() === newGermanLower)) {
        setGermanError("This word is already in the current list.");
    } else {
        setGermanError('');
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGerman.trim() || !currentEnglish.trim()) {
      setError('Both German and English words are required.');
      return;
    }
    if (germanError) {
        setError('Please fix the duplicate word error before adding.');
        return;
    }
    setCards([...cards, { german: currentGerman.trim(), english: currentEnglish.trim() }]);
    setCurrentGerman('');
    setCurrentEnglish('');
    setError('');
  };

  const handleSave = () => {
    if (cards.length === 0) {
      setError('You must add at least one card.');
      return;
    }
    const newDeck: FlashcardDeck = {
      name: `My Cards - ${new Date().toLocaleString()}`,
      difficulty: 'Custom',
      cards,
    };
    onSaveDeck(newDeck);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Add New Words</h2>
            
            <div>
                <h3 className="text-xl font-semibold mb-3">Add Words</h3>
                <form onSubmit={handleAddCard} className="flex flex-col sm:flex-row gap-2 items-start">
                    <div className="flex-grow w-full">
                        <label htmlFor="german-word" className="text-sm font-medium">German</label>
                         <input
                            id="german-word"
                            type="text"
                            value={currentGerman}
                            onChange={handleGermanChange}
                            placeholder="z.B. Apfel"
                            className={`w-full p-2 border rounded-md dark:bg-gray-700 focus:ring-2 ${germanError ? 'border-red-500 focus:ring-red-500' : 'dark:border-gray-600 focus:ring-blue-500'}`}
                        />
                        {germanError && <p className="text-red-500 text-xs mt-1">{germanError}</p>}
                    </div>
                     <div className="flex-grow w-full">
                        <label htmlFor="english-word" className="text-sm font-medium">English</label>
                        <input
                            id="english-word"
                            type="text"
                            value={currentEnglish}
                            onChange={(e) => setCurrentEnglish(e.target.value)}
                            placeholder="e.g. Apple"
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button type="submit" className="w-full sm:w-auto self-end bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors">
                        Add Word
                    </button>
                </form>
            </div>
        </div>

        {cards.length > 0 && (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-3">{cards.length} Card{cards.length > 1 ? 's' : ''} added</h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {cards.map((card, index) => (
                        <li key={index} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                            <span><strong>{card.german}</strong></span>
                            <span>{card.english}</span>
                        </li>
                    ))}
                </ul>
             </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <div className="flex justify-end gap-4 mt-4">
            <button onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors">
                Save Cards
            </button>
        </div>
    </div>
  );
};

export default CreateDeck;