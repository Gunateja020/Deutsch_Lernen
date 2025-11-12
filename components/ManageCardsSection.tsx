import React, { useState, useMemo } from 'react';
import { Flashcard, FlashcardDeck } from '../types';
import { EditIcon, DeleteIcon } from '../constants';

// Props this component will receive from App.tsx
interface ManageCardsSectionProps {
  userDecks: FlashcardDeck[];
  dailyDecks: FlashcardDeck[];
  onEditCard: (originalCard: Flashcard, newCard: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
}

// This component will hold the state for *which* card is being edited
const ManageCardsSection: React.FC<ManageCardsSectionProps> = ({ userDecks, dailyDecks, onEditCard, onDeleteCard }) => {
  // Combine all editable decks
  const allManageableDecks = useMemo(() => [...userDecks, ...dailyDecks], [userDecks, dailyDecks]);

  // State for the edit modal
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editGerman, setEditGerman] = useState('');
  const [editEnglish, setEditEnglish] = useState('');
  
  // State for search/filter
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all cards and add originDeck to each
  const allCards = useMemo(() => {
    return allManageableDecks.flatMap(deck => 
      deck.cards.map(card => ({
        ...card,
        originDeck: deck.name // Make sure originDeck is attached!
      }))
    );
  }, [allManageableDecks]);
  
  // Filtered cards based on search
  const filteredCards = useMemo(() => {
    if (!searchTerm) return allCards;
    const lowerSearch = searchTerm.toLowerCase();
    return allCards.filter(
      card => 
        card.german.toLowerCase().includes(lowerSearch) || 
        card.english.toLowerCase().includes(lowerSearch) ||
        card.originDeck?.toLowerCase().includes(lowerSearch)
    );
  }, [allCards, searchTerm]);

  // --- Edit Modal Handlers ---
  const handleStartEdit = (card: Flashcard) => {
    setEditingCard(card);
    setEditGerman(card.german);
    setEditEnglish(card.english);
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditGerman('');
    setEditEnglish('');
  };

  const handleSaveEdit = () => {
    if (!editingCard) return;

    // Check if the card info is different
    if (editingCard.german === editGerman.trim() && editingCard.english === editEnglish.trim()) {
        handleCancelEdit();
        return;
    }

    const newCard: Flashcard = {
      ...editingCard,
      german: editGerman.trim(),
      english: editEnglish.trim(),
    };
    
    // Call the prop function from App.tsx
    onEditCard(editingCard, newCard);
    
    // Close the modal
    handleCancelEdit();
  };
  
  // --- Delete Handler ---
  const handleDelete = (card: Flashcard) => {
     if (confirm(`Are you sure you want to delete the card: "${card.german}"?`)) {
        onDeleteCard(card);
     }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Manage Your Cards</h1>
      
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search all cards (by German, English, or Deck)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Card List Table */}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">German</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">English</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deck</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCards.length > 0 ? filteredCards.map((card, index) => (
              <tr key={`${card.originDeck}-${card.german}-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{card.german}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{card.english}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{card.originDeck}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                  <button onClick={() => handleStartEdit(card)} className="text-yellow-600 hover:text-yellow-800" aria-label="Edit card">
                    <EditIcon />
                  </button>
                  <button onClick={() => handleDelete(card)} className="text-red-600 hover:text-red-800" aria-label="Delete card">
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No cards match your search.' : 'You have not created any cards yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Flashcard</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">German Word</label>
                <input
                  type="text"
                  value={editGerman}
                  onChange={(e) => setEditGerman(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">English Translation</label>
                <input
                  type="text"
                  value={editEnglish}
                  onChange={(e) => setEditEnglish(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400">Cancel</button>
                <button onClick={handleSaveEdit} disabled={!editGerman.trim() || !editEnglish.trim()} className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-green-400 hover:bg-green-700">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCardsSection;
