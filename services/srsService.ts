import { FlashcardDeck, SrsData, CardSrsData, ReviewRating, Flashcard, ReviewHistory } from '../types';

// --- Default SRS Settings ---
const STARTING_EASE_FACTOR = 2.5;
const AGAIN_INTERVAL = 0; // Will be shown again in the same session
const GOOD_INTERVAL_NEW_CARD = 1; // 1 day
const EASY_INTERVAL_NEW_CARD = 4; // 4 days
const MATURE_INTERVAL = 21; // Days until a card is considered "mature"

// --- Date Handling ---
// Returns a new Date object for the start of the current day in UTC.
const getStartOfTodayUTC = (): Date => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};


// Unique identifier for a card
export const getCardId = (deckName: string, germanWord: string) => `${deckName}::${germanWord}`;

// --- Data Persistence ---

export const loadSrsData = (): SrsData => {
  try {
    const savedData = localStorage.getItem('srsData');
    return savedData ? JSON.parse(savedData) : {};
  } catch (error) {
    console.error("Error loading SRS data:", error);
    return {};
  }
};

export const saveSrsData = (data: SrsData) => {
  try {
    localStorage.setItem('srsData', JSON.stringify(data));
  } catch (error) {
    console.error("Error saving SRS data:", error);
  }
};

export const loadReviewHistory = (): ReviewHistory => {
  try {
    const savedData = localStorage.getItem('reviewHistory');
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error("Error loading review history:", error);
    return [];
  }
};

export const saveReviewHistory = (data: ReviewHistory) => {
  try {
    localStorage.setItem('reviewHistory', JSON.stringify(data));
  } catch (error) {
    console.error("Error saving review history:", error);
  }
};


// --- Initialization ---

export const initializeSrsData = (allDecks: FlashcardDeck[], existingData: SrsData): SrsData => {
  let updatedData: SrsData | null = null;
  
  allDecks.forEach(deck => {
    deck.cards.forEach(card => {
      const cardId = getCardId(deck.name, card.german);
      if (!existingData[cardId] && (!updatedData || !updatedData[cardId])) {
        if (!updatedData) {
            updatedData = { ...existingData };
        }
        updatedData[cardId] = {
          status: 'new',
          dueDate: new Date().toISOString(),
          interval: 0,
          easeFactor: STARTING_EASE_FACTOR,
          lapses: 0,
          consecutiveEasyCount: 0,
        };
      }
    });
  });

  if (updatedData) {
    // Note: Saving is now handled by the caller in App.tsx to ensure the username is used
    return updatedData;
  }

  return existingData;
};


// --- Deck Statistics ---

export const getDeckStats = (deck: FlashcardDeck, srsData: SrsData) => {
  const now = new Date();

  let newCount = 0;
  let dueCount = 0;
  let learningCount = 0;

  deck.cards.forEach(card => {
    const cardId = getCardId(deck.name, card.german);
    const data = srsData[cardId];
    if (data) {
      if (data.status === 'new') {
        newCount++;
      }
      
      const dueDate = new Date(data.dueDate);
      if (dueDate <= now) {
         if (data.status === 'review') {
           dueCount++;
         } else if (data.status === 'learning') {
           learningCount++;
         }
      }
    } else {
        newCount++;
    }
  });

  return { newCount, dueCount, learningCount };
};

// --- Statistics Page Calculations ---

export const calculateAnkiStats = (history: ReviewHistory, srsData: SrsData) => {
    const stats = {
        reviewsToday: 0,
        reviewsPast7Days: 0,
        reviewsPast30Days: 0,
        // FIX: Explicitly type answerCounts to ensure its values are inferred as numbers, not unknown.
        answerCounts: { again: 0, hard: 0, good: 0, easy: 0 } as Record<ReviewRating, number>,
        activityMap: new Map<string, number>(),
        matureCount: 0,
        learningCount: 0,
        newCount: 0,
        totalCards: 0
    };

    const srsCardIds = Object.keys(srsData);
    stats.totalCards = srsCardIds.length;
    
    // Calculate card breakdown from current SRS data
    srsCardIds.forEach(cardId => {
        const cardData = srsData[cardId];
        if (cardData.status === 'new') {
            stats.newCount++;
        } else if (cardData.status === 'review' && cardData.interval >= MATURE_INTERVAL && (cardData.consecutiveEasyCount || 0) >= 21) {
            stats.matureCount++;
        } else {
            // This covers 'learning' status and 'review' status for non-mature cards
            stats.learningCount++;
        }
    });


    const today = new Date();
    const todayUTCStart = getStartOfTodayUTC().getTime();
    const sevenDaysAgo = todayUTCStart - 6 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayUTCStart - 29 * 24 * 60 * 60 * 1000;

    for (const log of history) {
        const logDate = new Date(log.date);
        
        // THE FIX: Create a robust, timezone-independent UTC date key (YYYY-MM-DD).
        const year = logDate.getUTCFullYear();
        const month = String(logDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(logDate.getUTCDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        stats.activityMap.set(dateKey, (stats.activityMap.get(dateKey) || 0) + 1);

        // Count Answer Buttons
        stats.answerCounts[log.rating]++;

        // Count Reviews
        // FIX: Use Date.UTC to create a timezone-independent timestamp for the log date.
        const logDateUTCStart = Date.UTC(logDate.getUTCFullYear(), logDate.getUTCMonth(), logDate.getUTCDate());
        if (logDateUTCStart === todayUTCStart) {
            stats.reviewsToday++;
        }
        if (logDateUTCStart >= sevenDaysAgo) {
            stats.reviewsPast7Days++;
        }
        if (logDateUTCStart >= thirtyDaysAgo) {
            stats.reviewsPast30Days++;
        }
    }
    
    return stats;
}

// --- SRS Algorithm ---

export const calculateNextReview = (cardData: CardSrsData, rating: ReviewRating): CardSrsData => {
  const newData = { ...cardData };

  const addDays = (days: number): string => {
    const date = getStartOfTodayUTC();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString();
  };

  if (rating === 'again') {
    newData.status = 'learning';
    newData.interval = AGAIN_INTERVAL; // Will be re-queued in the current session
    newData.lapses += 1;
    newData.easeFactor = Math.max(1.3, newData.easeFactor - 0.2);
    newData.dueDate = new Date().toISOString(); // Due immediately
  } else {
    if (newData.status === 'new' || newData.status === 'learning') {
      newData.status = 'review';
      if (rating === 'good') {
        newData.interval = GOOD_INTERVAL_NEW_CARD;
      } else if (rating === 'easy') {
        newData.interval = EASY_INTERVAL_NEW_CARD;
      } else { // 'hard'
        newData.interval = 1; 
      }
    } else { // Card is in review status
      let newInterval;
      if (rating === 'hard') {
        newInterval = Math.round(newData.interval * 1.2);
        newData.easeFactor = Math.max(1.3, newData.easeFactor - 0.15);
      } else if (rating === 'good') {
        newInterval = Math.round(newData.interval * newData.easeFactor);
      } else { // 'easy'
        newInterval = Math.round(newData.interval * newData.easeFactor * 1.3);
        newData.easeFactor += 0.15;
      }
      // Ensure interval is at least 1 day if it's not a lapse
      newData.interval = Math.max(1, newInterval);
    }
    newData.dueDate = addDays(newData.interval);
  }

  if (rating === 'easy') {
    newData.consecutiveEasyCount = (newData.consecutiveEasyCount || 0) + 1;
  } else {
    newData.consecutiveEasyCount = 0;
  }

  newData.lastRating = rating;
  return newData;
};