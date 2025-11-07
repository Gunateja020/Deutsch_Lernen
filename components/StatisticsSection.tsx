import React, { useMemo, useState } from 'react';
import { FlashcardDeck, ReviewHistory, SrsData, UserProgressData, ChallengeStats } from '../types';
import { calculateAnkiStats } from '../services/srsService';
import { evaluateLevelProgression } from '../services/geminiService';
import { ArrowLeftIcon, ArrowRightIcon, SpinnerIcon } from '../constants';
import { MarkdownRenderer } from './LessonRenderer';

interface ProgressSectionProps {
  reviewHistory: ReviewHistory;
  srsData: SrsData;
  userDecks: FlashcardDeck[];
  dailyDecks: FlashcardDeck[];
  userLevel: string;
  challengeStats: ChallengeStats;
  onImport: (data: UserProgressData) => void;
  onSetLevel: (level: string) => void;
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
        <dd className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
);

const ActivityCalendar: React.FC<{ activityData: Map<string, number> }> = ({ activityData }) => {
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        content: string;
        x: number;
        y: number;
    } | null>(null);
    
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // Set to the first day to avoid month-end issues
        return d;
    });


    const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>, tooltipText: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            content: tooltipText,
            x: rect.left + rect.width / 2,
            y: rect.top,
        });
    };

    const handleMouseOut = () => {
        setTooltip(null);
    };

    const goToPreviousMonth = () => {
        setViewDate(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const goToNextMonth = () => {
        setViewDate(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const isNextMonthDisabled = useMemo(() => {
        const today = new Date();
        return viewDate.getFullYear() > today.getFullYear() ||
               (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() >= today.getMonth());
    }, [viewDate]);
    
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const today = new Date();
    const todayKey = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10);
    
    const dayCells = Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`blank-${i}`} />);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dateKey = date.toISOString().slice(0, 10);
        
        const count = activityData.get(dateKey) || 0;
        
        let colorClass = 'bg-gray-200 dark:bg-gray-700';
        if (count > 0) colorClass = 'bg-blue-200 dark:bg-blue-900';
        if (count > 2) colorClass = 'bg-blue-400 dark:bg-blue-700';
        if (count > 5) colorClass = 'bg-blue-600 dark:bg-blue-500';

        const isToday = dateKey === todayKey;

        const tooltipText = `${count} review${count !== 1 ? 's' : ''} on ${new Date(year, month, day).toLocaleDateString()}`;

        dayCells.push(
            <div 
                key={dateKey} 
                className={`w-full h-12 flex items-center justify-center rounded-md cursor-pointer transition-colors duration-150 ${colorClass} ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`} 
                onMouseOver={(e) => handleMouseOver(e, tooltipText)}
                onMouseLeave={handleMouseOut}
            >
                <span className="text-sm text-gray-700 dark:text-gray-300 opacity-60">{day}</span>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {tooltip?.visible && (
                <div
                    className="fixed z-10 px-3 py-1.5 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-lg dark:bg-black whitespace-nowrap"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translateX(-50%) translateY(-110%)',
                        pointerEvents: 'none',
                    }}
                >
                    {tooltip.content}
                </div>
            )}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Past Year Activity</h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={goToPreviousMonth} 
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Previous month"
                        >
                            <ArrowLeftIcon />
                        </button>
                        <span className="text-lg font-semibold w-36 text-center">
                            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                         <button 
                            onClick={goToNextMonth} 
                            disabled={isNextMonthDisabled}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next month"
                        >
                            <ArrowRightIcon />
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {dayCells}
                </div>

                <div className="flex justify-end items-center gap-2 mt-6 text-xs text-gray-500 dark:text-gray-400">
                    <span>Less</span>
                    <div className="w-4 h-4 rounded-sm bg-gray-200 dark:bg-gray-700" />
                    <div className="w-4 h-4 rounded-sm bg-blue-200 dark:bg-blue-900" />
                    <div className="w-4 h-4 rounded-sm bg-blue-400 dark:bg-blue-700" />
                    <div className="w-4 h-4 rounded-sm bg-blue-600 dark:bg-blue-500" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};


const ProgressSection: React.FC<ProgressSectionProps> = ({ reviewHistory, srsData, userDecks, dailyDecks, userLevel, challengeStats, onImport, onSetLevel }) => {
  const stats = useMemo(() => calculateAnkiStats(reviewHistory, srsData), [reviewHistory, srsData]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{ reasoning: string; nextLevel?: string; approved: boolean; } | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const { matureCount, learningCount, newCount, totalCards } = stats;
  const totalAnswers = Object.values(stats.answerCounts).reduce((a, b) => a + b, 0);
  const correctAnswers = stats.answerCounts.good + stats.answerCounts.easy;
  const correctPercentage = totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(1) : '0.0';

  const activeCards = learningCount + newCount;
  const learningPercent = activeCards > 0 ? (learningCount / activeCards) * 100 : 0;
  const newPercent = activeCards > 0 ? (newCount / activeCards) * 100 : 0;
  const maturePercent = totalCards > 0 ? (matureCount / totalCards) * 100 : 0;

  const handleExport = () => {
    try {
        const dataToExport: UserProgressData = {
            userDecks,
            dailyDecks,
            srsData,
            reviewHistory,
            userLevel,
            challengeStats
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deutsch-lernen-backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error during export:", error);
        alert("Could not export your data. Please try again.");
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) throw new Error("File is empty.");
            const data = JSON.parse(text);
            if (window.confirm("Are you sure you want to import this file? This will overwrite your current progress in this browser.")) {
                onImport(data);
            }
        } catch (error) {
            alert("Error reading or parsing the file. Please make sure it's a valid backup file.");
            console.error("Import error:", error);
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const handleCheckPromotion = async () => {
    setIsEvaluating(true);
    setEvaluationError(null);
    setEvaluationResult(null);
    try {
        const result = await evaluateLevelProgression(srsData, reviewHistory, userLevel, challengeStats);
        setEvaluationResult({
            reasoning: result.reasoning,
            nextLevel: result.nextLevel,
            approved: result.promotionApproved
        });
        if (result.promotionApproved) {
            onSetLevel(result.nextLevel);
        }
    } catch (err: any) {
        setEvaluationError(err.message || "An unknown error occurred.");
    } finally {
        setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
                <p className="text-gray-600 dark:text-gray-300">Save your progress to a file to back it up or move it to another device.</p>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                <button 
                    onClick={handleExport}
                    className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors"
                >
                    Export Progress
                </button>
                <input 
                    type="file" 
                    id="import-file" 
                    className="hidden" 
                    accept=".json,application/json" 
                    onChange={handleFileImport} 
                />
                <label 
                    htmlFor="import-file" 
                    className="w-full sm:w-auto text-center cursor-pointer bg-gray-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-700 transition-colors"
                >
                    Import Progress
                </label>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Review Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Review Activity</h3>
            <dl>
                <StatItem label="Reviews Today" value={stats.reviewsToday} />
                <StatItem label="Reviews - Past 7 Days" value={stats.reviewsPast7Days} />
                <StatItem label="Reviews - Past 30 Days" value={stats.reviewsPast30Days} />
                <StatItem label="Lifetime Reviews" value={totalAnswers} />
                <StatItem label="Correct Answer Rate" value={`${correctPercentage}%`} />
            </dl>
        </div>
        
        {/* Active Card Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold mb-4">Active Card Breakdown</h3>
                <div className="text-right">
                    <p className="font-bold text-blue-600 dark:text-blue-400">Current Level</p>
                    <p className="text-2xl font-bold">{userLevel}</p>
                </div>
            </div>
             <div className="text-center mb-6">
                <p className="text-5xl font-bold text-gray-800 dark:text-gray-200">{activeCards}</p>
                <p className="text-lg text-gray-500 dark:text-gray-400">Cards in Learning</p>
            </div>
            <div className="flex-grow flex flex-col justify-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden flex" title="Active card status breakdown">
                    <div className="bg-orange-500 h-5" style={{ width: `${learningPercent}%` }} title={`Learning: ${learningPercent.toFixed(1)}%`}></div>
                    <div className="bg-blue-500 h-5" style={{ width: `${newPercent}%` }} title={`New: ${newPercent.toFixed(1)}%`}></div>
                </div>
                <div className="mt-4 flex flex-wrap justify-around text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-orange-500"></span>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Learning</p>
                            <p>{learningCount} cards</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                         <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">New</p>
                            <p>{newCount} cards</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

       {/* Level Progression */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-2">Level Progression</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">When you feel ready, ask the AI to evaluate your progress to see if you can advance to the next level.</p>
        <div className="flex gap-4 items-center">
            <button
                onClick={handleCheckPromotion}
                disabled={isEvaluating}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait flex items-center gap-2"
            >
                {isEvaluating && <SpinnerIcon />}
                {isEvaluating ? 'Evaluating...' : 'Check for Promotion'}
            </button>
        </div>
        {evaluationError && <p className="text-red-500 mt-4">{evaluationError}</p>}
        {evaluationResult && (
            <div className={`mt-4 p-4 rounded-md border-l-4 ${evaluationResult.approved ? 'bg-green-50 dark:bg-green-900 border-green-500' : 'bg-orange-50 dark:bg-orange-900 border-orange-500'}`}>
                <MarkdownRenderer content={evaluationResult.reasoning} />
            </div>
        )}
      </div>

      {/* Mature Cards Section */}
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-1">Mature Vocabulary ({maturePercent.toFixed(1)}%)</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Cards you've consistently rated 'Easy' (21 times in a row) with a review interval over 21 days, indicating exceptional long-term memory.</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden" title={`Mature cards: ${maturePercent.toFixed(1)}% of total`}>
            <div className="bg-green-500 h-5" style={{ width: `${maturePercent}%` }}></div>
        </div>
        <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <p><span className="font-semibold text-gray-800 dark:text-gray-200">{matureCount}</span> Mature</p>
            </div>
            <p><span className="font-semibold text-gray-800 dark:text-gray-200">{totalCards}</span> Total Cards</p>
        </div>
      </div>
      
      {/* Challenge Performance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">Challenge Performance</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your progress in practical, AI-powered exercises. This is a key factor in your level progression.</p>
          <dl>
              <StatItem label="Conversations Completed" value={challengeStats.conversation} />
              <StatItem label="Images Described" value={challengeStats.image} />
              <StatItem label="Stories Built" value={challengeStats.story} />
          </dl>
      </div>
      
      <ActivityCalendar activityData={stats.activityMap} />

    </div>
  );
};

export default ProgressSection;
