import React from 'react';
import { SpeakerIcon } from '../constants';

// BROWSER-NATIVE TEXT-TO-SPEECH FOR UNLIMITED USAGE
function browserSpeak(text: string, lang: string) {
  if (!text) return;
  // Stop any previous speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = lang; // 'de-DE' for German, 'en-US' for English
  window.speechSynthesis.speak(utter);
}


const GermanWordWithPronunciation: React.FC<{ word: string }> = ({ word }) => {

    const handleClick = () => {
        // Native browser speak does not require async/await or a loading state
        // We assume the lesson words are German
        browserSpeak(word, 'de-DE'); 
    };

    return (
        <span className="inline-flex items-center group/word whitespace-nowrap">
            <strong className="mr-1">{word}</strong>
            <button
                onClick={handleClick}
                className="text-blue-500 dark:text-blue-400 opacity-0 group-hover/word:opacity-100 transition-opacity"
                aria-label={`Pronounce ${word}`}
            >
                <SpeakerIcon className="h-4 w-4" /> 
            </button>
        </span>
    );
};

// --- Markdown Rendering Logic ---

const parseInline = (text: string) => {
    // Replace German words in **bold** with the interactive component
    let content: (string | React.ReactNode)[] = [text];

    // 1. Handle **Bold German Words**
    content = content.flatMap(segment => {
        if (typeof segment !== 'string') return segment;
        const parts = segment.split(/(\*\*[\w\s]+\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const word = part.substring(2, part.length - 2).trim();
                return <GermanWordWithPronunciation key={`word-${index}`} word={word} />;
            }
            return part;
        });
    });

    return <>{content}</>;
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n').filter(line => !line.startsWith('### Answers') && !line.startsWith('### Quick Quiz'));
    
    // Group lines into blocks of content
    const renderableContent: { type: 'ul' | 'line', content?: string, items?: string[] }[] = [];
    let listItems: string[] = [];

    lines.forEach(line => {
        if (line.trim().startsWith('* ')) {
            listItems.push(line);
        } else {
            if (listItems.length > 0) {
                renderableContent.push({ type: 'ul', items: listItems });
                listItems = [];
            }
            renderableContent.push({ type: 'line', content: line });
        }
    });
    if (listItems.length > 0) {
        renderableContent.push({ type: 'ul', items: listItems });
    }

    return (
        <div className="space-y-3">
            {renderableContent.map((block, index) => {
                if (block.type === 'ul') {
                    return (
                        <ul key={index} className="list-disc list-inside space-y-1">
                            {block.items!.map((item, i) => (
                                <li key={i}>{parseInline(item.replace(/^\* \s*/, ''))}</li>
                            ))}
                        </ul>
                    );
                } else {
                    const line = block.content!;
                    if (line.trim().startsWith('### ')) {
                        return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{parseInline(line.replace('### ', ''))}</h3>;
                    }
                    if (line.trim() === '') return null;
                    return <p key={index}>{parseInline(line)}</p>;
                }
            })}
        </div>
    );
};
