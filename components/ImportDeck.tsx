
import React, { useState } from 'react';
import { Flashcard, FlashcardDeck } from '../types';

interface ImportDeckProps {
  onSaveDeck: (deck: FlashcardDeck) => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['txt', 'csv'];

const ImportDeck: React.FC<ImportDeckProps> = ({ onSaveDeck, onCancel }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseFileContent = (content: string): Flashcard[] => {
    const lines = content.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) {
      throw new Error("The file is empty or contains no valid lines.");
    }
    
    const parsedCards = lines.map((line, index) => {
      const parts = line.split(/[,;\t]/); // Split by comma, semicolon, or tab
      if (parts.length < 2 || !parts[0]?.trim() || !parts[1]?.trim()) {
        console.warn(`Skipping invalid line #${index + 1}: "${line}"`);
        return null;
      }
      return {
        german: parts[0].trim(),
        english: parts[1].trim(),
      };
    }).filter((card): card is Flashcard => card !== null);

    if (parsedCards.length === 0) {
        throw new Error("Could not find any valid card pairs in the file. Ensure lines are formatted as 'German,English'.");
    }

    return parsedCards;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setCards([]);
    setFileName(null);
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';

    if (!file) {
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      setError(`Invalid file type. Please upload a .txt or .csv file.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. The maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedCards = parseFileContent(content);
        setCards(parsedCards);
        setFileName(file.name);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred while parsing the file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (cards.length === 0) {
      setError('No cards to save. Please import a valid file first.');
      return;
    }
    const newDeck: FlashcardDeck = {
      name: `Imported: ${fileName || new Date().toLocaleString()}`,
      difficulty: 'Custom',
      cards,
    };
    onSaveDeck(newDeck);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Import Cards from File</h2>
      
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">
          Upload a <code>.txt</code> or <code>.csv</code> file. Each line should contain a German word and its English translation, separated by a comma, semicolon, or tab.
        </p>
        
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".txt,.csv"
          onChange={handleFileChange}
        />
        <label
          htmlFor="file-upload"
          className="w-full cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-md inline-flex items-center justify-center transition-colors"
        >
          <span>Choose a file...</span>
        </label>
        
        {fileName && !error && (
            <p className="text-green-600 dark:text-green-400">Successfully loaded: <strong>{fileName}</strong></p>
        )}

        {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 rounded-md" role="alert">
                <p className="font-bold">Import Error</p>
                <p>{error}</p>
            </div>
        )}
      </div>

      {cards.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Preview: {cards.length} Card{cards.length > 1 ? 's' : ''} Found</h3>
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
            <ul className="space-y-2">
              {cards.slice(0, 10).map((card, index) => ( // Preview first 10 cards
                <li key={index} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                  <span><strong>{card.german}</strong></span>
                  <span>{card.english}</span>
                </li>
              ))}
              {cards.length > 10 && <li className="text-center text-sm text-gray-500 p-2">...and {cards.length - 10} more</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button 
            onClick={onCancel} 
            className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
            Cancel
        </button>
        <button 
          onClick={handleSave} 
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={cards.length === 0}
        >
            Save Imported Cards
        </button>
      </div>
    </div>
  );
};

export default ImportDeck;