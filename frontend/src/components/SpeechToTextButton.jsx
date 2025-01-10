import React, { useState, useEffect } from 'react';

function SpeechToTextButton({ onTextReceived, placeholder }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          onTextReceived(transcript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <button
      type="button"
      className={`speech-to-text-button ${isListening ? 'active' : ''}`}
      onClick={toggleListening}
      title={placeholder || 'Toggle speech recognition'}
    >
      {isListening ? '🎤 ON' : '🎤 OFF'}
    </button>
  );
}

export default SpeechToTextButton; 