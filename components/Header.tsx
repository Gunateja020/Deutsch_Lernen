import React from 'react';

type View = 'learn' | 'practice' | 'progress' | 'teachings' | 'challenges';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses = "bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-600";

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      {/* UPDATE 1: flex-col on mobile, flex-row on md+ */}
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Deutsch Lernen
        </h1>
        {/* UPDATE 2: flex-wrap on mobile, w-full, gap-2 for wrapping */}
        <nav className="flex flex-wrap w-full md:w-auto gap-2 bg-gray-200 dark:bg-gray-900 p-1 rounded-lg">
          <button
            onClick={() => setCurrentView('learn')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 ${currentView === 'learn' ? activeClasses : inactiveClasses}`}
          >
            Learn
          </button>
          <button
            onClick={() => setCurrentView('teachings')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 ${currentView === 'teachings' ? activeClasses : inactiveClasses}`}
          >
            Teachings
          </button>
          <button
            onClick={() => setCurrentView('practice')}\
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 ${currentView === 'practice' ? activeClasses : inactiveClasses}`}
          >
            Practice
          </button>
          <button
            onClick={() => setCurrentView('challenges')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 ${currentView === 'challenges' ? activeClasses : inactiveClasses}`}
          >
            Challenges
          </button>
           <button
            onClick={() => setCurrentView('progress')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 ${currentView === 'progress' ? activeClasses : inactiveClasses}`}
          >
            Progress
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
