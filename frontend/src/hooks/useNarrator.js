import { useCallback } from 'react';

export const useNarrator = ({ enabled, language = 'en' }) => {
  const speak = useCallback((text) => {
    if (!enabled || !window.speechSynthesis) {
      console.error('Speech synthesis not supported or not enabled');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.lang = language;
    utterance.rate = 1.0;  // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Maximum volume

    // Get available voices
    let voices = window.speechSynthesis.getVoices();
    
    // If voices aren't loaded yet, wait for them
    if (voices.length === 0) {
      return new Promise((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          // Try to find a voice for the selected language
          const voice = voices.find(v => v.lang.startsWith(language)) || voices[0];
          utterance.voice = voice;
          
          // Add error handling
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
          };

          window.speechSynthesis.speak(utterance);
          
          // Resolve when speech ends
          utterance.onend = resolve;
        };
      });
    } else {
      // Try to find a voice for the selected language
      const voice = voices.find(v => v.lang.startsWith(language)) || voices[0];
      utterance.voice = voice;
      
      // Add error handling
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
      };

      window.speechSynthesis.speak(utterance);
      
      // Return a promise that resolves when speech ends
      return new Promise(resolve => {
        utterance.onend = resolve;
      });
    }
  }, [enabled, language]);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, cancel };
}; 