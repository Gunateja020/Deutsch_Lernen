// FIX: Import ReactElement to resolve JSX type error.
import type { ReactElement } from 'react';

export interface QuizQuestion {
  question: string;
  answer: string;
}

export interface Lesson {
  title: string;
  // FIX: Use ReactElement instead of JSX.Element.
  content: ReactElement;
  quiz?: QuizQuestion[];
}

export interface AIGeneratedLesson {
  title: string;
  content: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
}

export interface ConversationMessage {
  sender: 'user' | 'ai';
  content: string;
}

export interface StoryPart {
    author: 'user' | 'ai';
    text: string;
}

export interface Flashcard {
  german: string;
  english: string;
  originDeck?: string; // To track the source deck for SRS keys
  isReversed?: boolean; //
}

export interface DailyLesson {
  topic: string;
  explanation: string;
  vocabulary: Flashcard[];
}

export interface FlashcardDeck {
  name: string;
  cards: Flashcard[];
  difficulty: string;
}

// --- Spaced Repetition System (SRS) Types ---

export type CardStatus = 'new' | 'learning' | 'review';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardSrsData {
  status: CardStatus;
  dueDate: string; // ISO string
  interval: number; // in days
  easeFactor: number; // multiplier for interval
  lapses: number;
  lastRating?: ReviewRating;
  consecutiveEasyCount?: number;
}

// A map where the key is a unique card identifier (e.g., "DeckName::GermanWord")
export type SrsData = Record<string, CardSrsData>;

// --- Review History Types ---
export interface ReviewLog {
  date: string; // ISO string
  cardId: string;
  rating: ReviewRating;
}

export type ReviewHistory = ReviewLog[];

// --- Challenge Performance ---
export interface ChallengeStats {
    conversation: number;
    image: number;
    story: number;
}

// --- User Progress Data ---
export type UserProgressData = Partial<{
    userDecks: FlashcardDeck[];
    dailyDecks: FlashcardDeck[];
    srsData: SrsData;
    reviewHistory: ReviewHistory;
    userLevel: string;
    challengeStats: ChallengeStats;
}>;
