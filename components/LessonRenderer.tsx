import React, { useState, useRef } from 'react';
import { generatePronunciation } from '../services/geminiService';
import { SpeakerIcon, SpinnerIcon } from '../constants';

// --- Audio Helper Functions ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const GermanWordWithPronunciation: React.FC<{ word: string }> = ({ word }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const handlePlayPronunciation = async (text: string) => {
        if (isSpeaking) return;
        setIsSpeaking(true);
        try {
            const base64Audio = await generatePronunciation(text);
            if (base64Audio) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioContext = audioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
                source.onended = () => setIsSpeaking(false);
            } else {
               setIsSpeaking(false);
            }
        } catch (error) {
            console.error("Error playing pronunciation:", error);
            alert("Could not play audio. Please try again.");
            setIsSpeaking(false);
        }
    };

    return (
        <span className="inline-flex items-center gap-1">
            <strong className="text-blue-600 dark:text-blue-400">{word}</strong>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPronunciation(word);
                }}
                disabled={isSpeaking}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                aria-label={`Listen to ${word}`}
            >
                {isSpeaking ? <SpinnerIcon /> : <SpeakerIcon />}
            </button>
        </span>
    );
};

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parseInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const word = part.slice(2, -2);
                return <GermanWordWithPronunciation key={`${word}-${index}`} word={word} />;
            }
            return <span key={index}>{part}</span>;
        });
    };

    const lines = content.split(/\r\n|\n|\r/);
    const renderableContent = [];
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
                            {block.items.map((item, i) => (
                                <li key={i}>{parseInline(item.replace(/^\* \s*/, ''))}</li>
                            ))}
                        </ul>
                    );
                } else {
                    const line = block.content;
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
