import React from 'react';
import { Lesson, FlashcardDeck } from './types';

export const LESSONS: Lesson[] = [
  {
    title: "Grundlagen: Greetings",
    content: (
      <div>
        <p className="mb-4">Greetings are the first step to any conversation. Here are some essential German greetings:</p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Hallo</strong> - Hello (General use)</li>
          <li><strong>Guten Morgen</strong> - Good morning</li>
          <li><strong>Guten Tag</strong> - Good day / Good afternoon</li>
          <li><strong>Guten Abend</strong> - Good evening</li>
          <li><strong>Auf Wiedersehen</strong> - Goodbye (Formal)</li>
          <li><strong>Tschüss</strong> - Bye (Informal)</li>
          <li><strong>Wie geht es Ihnen?</strong> - How are you? (Formal)</li>
          <li><strong>Wie geht's?</strong> - How's it going? (Informal)</li>
        </ul>
      </div>
    ),
    quiz: [
      { question: "How do you say 'Good evening' in German?", answer: "Guten Abend" },
      { question: "What is the informal way to say 'Bye'?", answer: "Tschüss" },
      { question: "How do you ask 'How are you?' formally?", answer: "Wie geht es Ihnen?" },
    ]
  },
  {
    title: "Zahlen: Numbers 1-10",
    content: (
       <div>
        <p className="mb-4">Numbers are fundamental. Let's learn to count to ten in German.</p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>eins</strong> - one</li>
          <li><strong>zwei</strong> - two</li>
          <li><strong>drei</strong> - three</li>
          <li><strong>vier</strong> - four</li>
          <li><strong>fünf</strong> - five</li>
          <li><strong>sechs</strong> - six</li>
          <li><strong>sieben</strong> - seven</li>
          <li><strong>acht</strong> - eight</li>
          <li><strong>neun</strong> - nine</li>
          <li><strong>zehn</strong> - ten</li>
        </ul>
      </div>
    ),
    quiz: [
      { question: "What is 'eight' in German?", answer: "acht" },
      { question: "What number is 'three' in German?", answer: "drei" },
      { question: "How do you say 'ten' in German?", answer: "zehn" },
    ]
  },
    {
    title: "Wichtige Sätze: Common Phrases",
    content: (
       <div>
        <p className="mb-4">Here are some common phrases you'll use often.</p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Ja</strong> - Yes</li>
          <li><strong>Nein</strong> - No</li>
          <li><strong>Bitte</strong> - Please / You're welcome</li>
          <li><strong>Danke</strong> - Thank you</li>
          <li><strong>Entschuldigung</strong> - Excuse me / Sorry</li>
          <li><strong>Ich heiße...</strong> - My name is...</li>
          <li><strong>Ich komme aus...</strong> - I come from...</li>
          <li><strong>Ich verstehe nicht.</strong> - I don't understand.</li>
        </ul>
      </div>
    ),
    quiz: [
        { question: "How do you say 'Thank you' in German?", answer: "Danke" },
        { question: "What does 'Ich verstehe nicht' mean?", answer: "I don't understand" },
        { question: "How do you say 'Please'?", answer: "Bitte" },
    ]
  }
];

export const FLASHCARD_DECKS: FlashcardDeck[] = [
  {
    name: "Greetings",
    difficulty: "Beginner",
    cards: [
      { german: "Hallo", english: "Hello" },
      { german: "Guten Morgen", english: "Good morning" },
      { german: "Guten Tag", english: "Good day" },
      { german: "Guten Abend", english: "Good evening" },
      { german: "Auf Wiedersehen", english: "Goodbye" },
      { german: "Tschüss", english: "Bye" },
      { german: "Danke", english: "Thank you" },
      { german: "Bitte", english: "Please / You're welcome" },
    ]
  },
  {
    name: "Numbers 1-10",
    difficulty: "Beginner",
    cards: [
      { german: "eins", english: "one" },
      { german: "zwei", english: "two" },
      { german: "drei", english: "three" },
      { german: "vier", english: "four" },
      { german: "fünf", english: "five" },
      { german: "sechs", english: "six" },
      { german: "sieben", english: "seven" },
      { german: "acht", english: "eight" },
      { german: "neun", english: "nine" },
      { german: "zehn", english: "ten" },
    ]
  },
   {
    name: "Common Objects",
    difficulty: "Intermediate",
    cards: [
      { german: "das Haus", english: "the house" },
      { german: "der Tisch", english: "the table" },
      { german: "der Stuhl", english: "the chair" },
      { german: "das Auto", english: "the car" },
      { german: "das Buch", english: "the book" },
      { german: "die Tasse", english: "the cup" },
      { german: "der Baum", english: "the tree" },
      { german: "die Sonne", english: "the sun" },
    ]
  },
  {
    name: "Advanced Verbs & Idioms",
    difficulty: "Advanced",
    cards: [
      { german: "sich unterhalten", english: "to have a conversation" },
      { german: "etwas in Anspruch nehmen", english: "to make use of something" },
      { german: "zur Verfügung stehen", english: "to be available" },
      { german: "eine Entscheidung treffen", english: "to make a decision" },
      { german: "jemandem die Daumen drücken", english: "to keep one's fingers crossed for someone" },
      { german: "den Nagel auf den Kopf treffen", english: "to hit the nail on the head" },
      { german: "voraussetzen", english: "to presuppose / to assume" },
    ]
  }
];

export const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

export const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

export const SpinnerIcon = () => (
    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const RobotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M8.5,10A1.5,1.5 0 0,1 10,11.5A1.5,1.5 0 0,1 8.5,13A1.5,1.5 0 0,1 7,11.5A1.5,1.5 0 0,1 8.5,10M15.5,10A1.5,1.5 0 0,1 17,11.5A1.5,1.5 0 0,1 15.5,13A1.5,1.5 0 0,1 14,11.5A1.5,1.5 0 0,1 15.5,10M7.21,15C7.8,16.93 9.71,18.24 12,18.24C14.29,18.24 16.2,16.93 16.79,15H7.21Z" />
    </svg>
);

export const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,19.2C9.5,19.2 7.29,17.92 6,15.98C6.03,13.97 10,12.9 12,12.9C14,12.9 17.97,13.97 18,15.98C16.71,17.92 14.5,19.2 12,19.2Z" />
    </svg>
);

export const ChatBubbleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
export const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

export const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const PlusIcon = ({ className = 'h-6 w-6' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
