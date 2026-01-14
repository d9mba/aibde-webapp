'use client';

import { useState, useEffect } from 'react';

const SEARCH_SUGGESTIONS = [
    'Search AI tools... ',
    'Tools for chat...',
    'ChatGPT for writing...',
    'AI image generators...',
    'Code assistants...',
    'Video editing tools...',
    'Music creation AI...',
    'Voice cloning tools...',
    'AI chatbots...',
    'Design automation...',
];

export function useTypingPlaceholder(interval = 100, pauseDuration = 2000) {
    const [placeholder, setPlaceholder] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        const currentText = SEARCH_SUGGESTIONS[currentIndex];

        if (isTyping) {
            // Typing effect
            if (charIndex < currentText.length) {
                const timeout = setTimeout(() => {
                    setPlaceholder(currentText.slice(0, charIndex + 1));
                    setCharIndex(charIndex + 1);
                }, interval);
                return () => clearTimeout(timeout);
            } else {
                // Pause after typing complete
                const timeout = setTimeout(() => {
                    setIsTyping(false);
                }, pauseDuration);
                return () => clearTimeout(timeout);
            }
        } else {
            // Deleting effect
            if (charIndex > 0) {
                const timeout = setTimeout(() => {
                    setPlaceholder(currentText.slice(0, charIndex - 1));
                    setCharIndex(charIndex - 1);
                }, interval / 2);
                return () => clearTimeout(timeout);
            } else {
                // Move to next suggestion
                setCurrentIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
                setIsTyping(true);
            }
        }
    }, [charIndex, currentIndex, isTyping, interval, pauseDuration]);

    return placeholder;
}
