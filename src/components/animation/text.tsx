'use client';
import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
    texts: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
    className?: string;
}

export default function TypewriterText({ 
    texts, 
    typingSpeed = 100, 
    deletingSpeed = 50, 
    pauseDuration = 2000,
    className = ""
}: TypewriterTextProps) {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (texts.length === 0) return;

        const currentFullText = texts[currentTextIndex];

        if (isPaused) {
            const pauseTimer = setTimeout(() => {
                setIsPaused(false);
                setIsDeleting(true);
            }, pauseDuration);
            return () => clearTimeout(pauseTimer);
        }

        if (isDeleting) {
            if (currentText === '') {
                setIsDeleting(false);
                setCurrentTextIndex((prev) => (prev + 1) % texts.length);
            } else {
                const deleteTimer = setTimeout(() => {
                    setCurrentText(prev => prev.slice(0, -1));
                }, deletingSpeed);
                return () => clearTimeout(deleteTimer);
            }
        } else {
            if (currentText === currentFullText) {
                setIsPaused(true);
            } else {
                const typeTimer = setTimeout(() => {
                    setCurrentText(prev => currentFullText.slice(0, prev.length + 1));
                }, typingSpeed);
                return () => clearTimeout(typeTimer);
            }
        }
    }, [currentText, currentTextIndex, isDeleting, isPaused, texts, typingSpeed, deletingSpeed, pauseDuration]);

    return (
        <span className={`${className}`}>
            {currentText}
            <span className="animate-pulse text-primary">|</span>
        </span>
    );
}

export function DefaultTypewriterText({ className }: { className?: string }) {
    const defaultTexts = [
        "Feeling Creative?",
        "What's on your mind?",
        "Need some guidance?",
        "Ready to explore?",
        "Got questions?",
        "Let's get started!"
    ];

    return (
        <TypewriterText 
            texts={defaultTexts}
            className={className}
            typingSpeed={80}
            deletingSpeed={40}
            pauseDuration={1500}
        />
    );
}
