import React, { useState, useEffect } from 'react';
import { generateImageForDescription, evaluateImageDescription } from '../services/geminiService';
import { SpinnerIcon } from '../constants';
import { MarkdownRenderer } from './LessonRenderer';

interface ImageDescriptionProps {
    onBack: () => void;
    userLevel: string;
    onComplete: () => void;
}

const ImageDescription: React.FC<ImageDescriptionProps> = ({ onBack, userLevel, onComplete }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [userDescription, setUserDescription] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNewImage = async () => {
        setIsLoadingImage(true);
        setError(null);
        setFeedback(null);
        setUserDescription('');
        try {
            const base64Image = await generateImageForDescription();
            setImageUrl(`data:image/png;base64,${base64Image}`);
        } catch (err: any) {
            setError(err.message || "Failed to load a new image.");
        } finally {
            setIsLoadingImage(false);
        }
    };
    
    useEffect(() => {
        fetchNewImage();
    }, []);

    const handleSubmit = async () => {
        if (!userDescription.trim() || isEvaluating) return;
        setIsEvaluating(true);
        setError(null);
        setFeedback(null);
        try {
            const aiFeedback = await evaluateImageDescription(userDescription, userLevel);
            setFeedback(aiFeedback);
            onComplete();
        } catch (err: any) {
            setError(err.message || "Failed to get feedback.");
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
             <button onClick={onBack} className="mb-4 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">&larr; Back to Challenges</button>
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-2 text-center">Describe the Image</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">Write a few sentences in German describing the image below. When you're done, the AI tutor will give you feedback.</p>

                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 flex items-center justify-center">
                    {isLoadingImage && <SpinnerIcon />}
                    {error && !isLoadingImage && <p className="text-red-500">{error}</p>}
                    {imageUrl && !isLoadingImage && <img src={imageUrl} alt="AI-generated scene" className="w-full h-full object-contain rounded-lg" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <textarea
                            value={userDescription}
                            onChange={(e) => setUserDescription(e.target.value)}
                            placeholder="Schreiben Sie hier Ihre Beschreibung..."
                            className="w-full h-48 p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                            disabled={isEvaluating}
                        />
                        <div className="flex gap-2 mt-2">
                             <button
                                onClick={handleSubmit}
                                disabled={isEvaluating || !userDescription.trim()}
                                className="flex-grow bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {isEvaluating ? 'Getting Feedback...' : 'Get Feedback'}
                            </button>
                             <button
                                onClick={fetchNewImage}
                                disabled={isLoadingImage}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-700 disabled:bg-gray-400"
                            >
                                New Image
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">AI Feedback</h3>
                        <div className="w-full h-48 p-3 bg-gray-100 dark:bg-gray-900 rounded-md overflow-y-auto">
                            {isEvaluating && <p className="text-gray-500">Thinking...</p>}
                            {feedback && <MarkdownRenderer content={feedback} />}
                            {!isEvaluating && !feedback && <p className="text-gray-500">Your feedback will appear here.</p>}
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default ImageDescription;
