import React from 'react';
import { FlashcardDeck } from '../types';

interface CardManagementProps {
    userDecks: FlashcardDeck[];
    dailyDecks: FlashcardDeck[];
    onEditCard: (deckName: string, oldGerman: string) => void;
    onDeleteCard: (deckName: string, germanWord: string) => void;
}

const CardManagement: React.FC<CardManagementProps> = ({ userDecks, dailyDecks, onEditCard, onDeleteCard }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
            <h3 className="text-xl font-bold mb-4">Card Management</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
                Manage cards from your custom-added or AI-generated decks. (Note: Default app decks cannot be edited).
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {[...userDecks, ...dailyDecks].map((deck) => (
                    <details key={deck.name} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <summary className="font-semibold text-lg cursor-pointer">
                            {deck.name} <span className="text-sm text-gray-500">({deck.cards.length} cards)</span>
                        </summary>
                        <ul className="mt-4 space-y-2">
                            {deck.cards.length > 0 ? (
                                deck.cards.map((card) => (
                                    <li key={card.german} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-md">
                                        <div>
                                            <strong className="text-gray-900 dark:text-gray-100">{card.german}</strong>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{card.english}</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0 ml-2">
                                            <button
                                                onClick={() => onEditCard(deck.name, card.german)}
                                                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDeleteCard(deck.name, card.german)}
                                                className="text-sm font-semibold text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-500 italic">This deck is empty.</li>
                            )}
                        </ul>
                    </details>
                ))}
            </div>
        </div>
    );
};

export default CardManagement;
