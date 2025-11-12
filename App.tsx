import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import LearnSection from './components/LearnSection';
import PracticeSection from './components/PracticeSection';
import Footer from './components/Footer';
import ProgressSection from './components/StatisticsSection';
import TeachingsSection from './components/TeachingsSection';
import ChallengesSection from './components/ChallengesSection';
import { FlashcardDeck, SrsData, ReviewHistory, ReviewLog, Flashcard, ReviewRating, UserProgressData, ChallengeStats } from './types';
import { FLASHCARD_DECKS } from './constants';
import { initializeSrsData, loadSrsData, saveSrsData, loadReviewHistory, saveReviewHistory, calculateNextReview, getCardId } from './services/srsService';


type View = 'learn' | 'practice' | 'progress' | 'teachings' | 'challenges';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('practice');
  
  const [userDecks, setUserDecks] = useState<FlashcardDeck[]>(() => {
    const saved = localStorage.getItem('userDecks');
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyDecks, setDailyDecks] = useState<FlashcardDeck[]>(() => {
    const saved = localStorage.getItem('dailyDecks');
    return saved ? JSON.parse(saved) : [];
  });
  const [srsData, setSrsData] = useState<SrsData>(() => loadSrsData());
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory>(() => loadReviewHistory());
  const [userLevel, setUserLevel] = useState<string>(() => localStorage.getItem('userLevel') || 'A1.1');
  const [challengeStats, setChallengeStats] = useState<ChallengeStats>(() => {
    const saved = localStorage.getItem('challengeStats');
    return saved ? JSON.parse(saved) : { conversation: 0, image: 0, story: 0 };
  });

  const allDecks = useMemo(() => [...FLASHCARD_DECKS, ...userDecks, ...dailyDecks], [userDecks, dailyDecks]);
  const allWords = useMemo(() => new Set(allDecks.flatMap(d => d.cards.map(c => c.german.toLowerCase()))), [allDecks]);

  useEffect(() => {
    localStorage.setItem('userLevel', userLevel);
  }, [userLevel]);
  
  useEffect(() => {
    localStorage.setItem('challengeStats', JSON.stringify(challengeStats));
  }, [challengeStats]);
  
  useEffect(() => {
    const newSrsData = initializeSrsData(allDecks, srsData);
    if (newSrsData !== srsData) {
        setSrsData(newSrsData);
        saveSrsData(newSrsData);
    }
  }, [allDecks, srsData]);

  const handleSaveDeck = (newDeck: FlashcardDeck) => {
    const uniqueCards = newDeck.cards.filter(card => !allWords.has(card.german.toLowerCase()));
    
    if (uniqueCards.length < newDeck.cards.length) {
        const skippedCount = newDeck.cards.length - uniqueCards.length;
        alert(`${skippedCount} duplicate card(s) were found and have been skipped.`);
    }

    if (uniqueCards.length === 0) {
        if (newDeck.cards.length > 0) {
           alert("No new cards were added because they already exist in your collection.");
        }
        return;
    }
    
    const deckToAdd = { ...newDeck, cards: uniqueCards };
    const updatedUserDecks = [...userDecks, deckToAdd];
    setUserDecks(updatedUserDecks);
    localStorage.setItem('userDecks', JSON.stringify(updatedUserDecks));
  };
  
  const handleAddDailyDeck = (newDeck: FlashcardDeck) => {
    const uniqueCards = newDeck.cards.filter(card => !allWords.has(card.german.toLowerCase()));

    if (uniqueCards.length < newDeck.cards.length) {
        const skippedCount = newDeck.cards.length - uniqueCards.length;
        console.log(`Skipped ${skippedCount} duplicate cards from a lesson/AI deck.`);
        if (newDeck.name.startsWith("AI Suggestions")) {
            alert(`${skippedCount} suggested card(s) were skipped because they already exist in your collection.`);
        }
    }

    if (uniqueCards.length === 0) {
        console.log("AI/Lesson deck not added as all cards were duplicates.");
         if (newDeck.name.startsWith("AI Suggestions")) {
            alert("No new cards were added because all suggestions already exist in your collection.");
        }
        return;
    }

    const deckToAdd = { ...newDeck, cards: uniqueCards };
    const updatedDailyDecks = [...dailyDecks, deckToAdd];
    setDailyDecks(updatedDailyDecks);
    localStorage.setItem('dailyDecks', JSON.stringify(updatedDailyDecks));
  };

  const handleCardRated = (card: Flashcard, rating: ReviewRating) => {
    if (!card.originDeck) return;
    const cardId = getCardId(card.originDeck, card.german);
    const currentCardData = srsData[cardId];
    const newSrsCardData = calculateNextReview(currentCardData, rating);
    const updatedSrsData = { ...srsData, [cardId]: newSrsCardData };
    setSrsData(updatedSrsData);
    saveSrsData(updatedSrsData);
    
    const newLog: ReviewLog = { date: new Date().toISOString(), cardId, rating };
    const updatedHistory = [...reviewHistory, newLog];
    setReviewHistory(updatedHistory);
    saveReviewHistory(updatedHistory);
  };
  
  const handleImportData = (importedData: UserProgressData) => {
    const dataToImport: Required<UserProgressData> = {
        userDecks: importedData.userDecks || [],
        dailyDecks: importedData.dailyDecks || [],
        srsData: importedData.srsData || {},
        reviewHistory: importedData.reviewHistory || [],
        userLevel: importedData.userLevel || 'A1.1',
        challengeStats: importedData.challengeStats || { conversation: 0, image: 0, story: 0 }
    };
    
    setUserDecks(dataToImport.userDecks);
    setDailyDecks(dataToImport.dailyDecks);
    setSrsData(dataToImport.srsData);
    setReviewHistory(dataToImport.reviewHistory);
    setUserLevel(dataToImport.userLevel);
    setChallengeStats(dataToImport.challengeStats);
    
    localStorage.setItem('userDecks', JSON.stringify(dataToImport.userDecks));
    localStorage.setItem('dailyDecks', JSON.stringify(dataToImport.dailyDecks));
    saveSrsData(dataToImport.srsData);
    saveReviewHistory(dataToImport.reviewHistory);
    localStorage.setItem('userLevel', dataToImport.userLevel);
    localStorage.setItem('challengeStats', JSON.stringify(dataToImport.challengeStats));
    
    alert("Progress imported successfully! The page will now reload.");
    window.location.reload();
  };

  const handleSetLevel = (newLevel: string) => {
    setUserLevel(newLevel);
  };
  
  const handleChallengeCompleted = (challengeType: keyof ChallengeStats) => {
    setChallengeStats(prevStats => {
        const newStats = {
            ...prevStats,
            [challengeType]: prevStats[challengeType] + 1
        };
        return newStats;
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {currentView === 'learn' && <LearnSection />}
        {currentView === 'teachings' && (
            <TeachingsSection
                dailyDecks={dailyDecks}
                onAddDailyDeck={handleAddDailyDeck}
                userLevel={userLevel}
            />
        )}
        {currentView === 'practice' && (
            <PracticeSection 
                allDecks={allDecks}
                userDecks={userDecks}
                dailyDecks={dailyDecks}
                srsData={srsData}
                reviewHistory={reviewHistory}
                onSaveDeck={handleSaveDeck}
                onAddDailyDeck={handleAddDailyDeck}
                onCardRated={handleCardRated}
                userLevel={userLevel}
                allWords={allWords}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
            />
        )}
        {currentView === 'challenges' && <ChallengesSection userLevel={userLevel} onChallengeCompleted={handleChallengeCompleted} />}
        {currentView === 'progress' && (
            <ProgressSection 
                reviewHistory={reviewHistory}
                srsData={srsData}
                userDecks={userDecks}
                dailyDecks={dailyDecks}
                userLevel={userLevel}
                challengeStats={challengeStats}
                onImport={handleImportData}
                onSetLevel={handleSetLevel}
            />
        )}
      </main>
      <Footer designerName="Gunateja Pothula" />
    </div>
  );
};

export default App;
