import { useState, useCallback } from 'react';

const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = window.speechSynthesis;

    const speak = useCallback((text) => {
        // Cancel any ongoing speech
        synth.cancel();

        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure speech settings
        utterance.rate = 1; // Normal speed
        utterance.pitch = 1; // Normal pitch
        utterance.volume = 1; // Full volume
        
        // Use English voice
        const voices = synth.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        // Event handlers
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        synth.cancel();
        setIsSpeaking(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking
    };
};

export default useTextToSpeech; 