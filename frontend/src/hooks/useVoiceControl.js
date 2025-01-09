import { useEffect, useCallback } from 'react';
import annyang from 'annyang';

export const useVoiceNavigation = ({
  onNext,
  onPrevious,
  onSubmit,
  onBack,
  onSelectOption,
  isLastQuestion,
  language = 'en',
}) => {
  const initializeVoiceCommands = useCallback(() => {
    if (annyang) {
      annyang.removeCommands();

      // Define commands based on language
      const commands = {
        // Navigation commands
        'next (question)': () => onNext && onNext(),
        'previous (question)': () => onPrevious && onPrevious(),
        'submit (quiz)': () => {
          if (isLastQuestion && onSubmit) {
            onSubmit();
          }
        },
        'back': () => onBack && onBack(),
        
        // Numeric option selection
        'select option :number': (number) => {
          const optionIndex = parseInt(number) - 1;
          if (onSelectOption && optionIndex >= 0 && optionIndex < 4) {
            onSelectOption(optionIndex);
          }
        },
        'choose option :number': (number) => {
          const optionIndex = parseInt(number) - 1;
          if (onSelectOption && optionIndex >= 0 && optionIndex < 4) {
            onSelectOption(optionIndex);
          }
        },

        // Direct option selection commands
        'select first (option)': () => onSelectOption && onSelectOption(0),
        'select second (option)': () => onSelectOption && onSelectOption(1),
        'select third (option)': () => onSelectOption && onSelectOption(2),
        'select fourth (option)': () => onSelectOption && onSelectOption(3),
        
        // Alternative option selection commands
        'choose first (option)': () => onSelectOption && onSelectOption(0),
        'choose second (option)': () => onSelectOption && onSelectOption(1),
        'choose third (option)': () => onSelectOption && onSelectOption(2),
        'choose fourth (option)': () => onSelectOption && onSelectOption(3),
        
        // Letter-based selection
        'select a': () => onSelectOption && onSelectOption(0),
        'select b': () => onSelectOption && onSelectOption(1),
        'select c': () => onSelectOption && onSelectOption(2),
        'select d': () => onSelectOption && onSelectOption(3),
        
        // Simple number selection
        'first': () => onSelectOption && onSelectOption(0),
        'second': () => onSelectOption && onSelectOption(1),
        'third': () => onSelectOption && onSelectOption(2),
        'fourth': () => onSelectOption && onSelectOption(3),
      };

      // Add Spanish language commands
      if (language === 'es') {
        Object.assign(commands, {
          'siguiente (pregunta)': () => onNext && onNext(),
          'anterior (pregunta)': () => onPrevious && onPrevious(),
          'enviar': () => {
            if (isLastQuestion && onSubmit) {
              onSubmit();
            }
          },
          'volver': () => onBack && onBack(),
          'seleccionar opción :number': (number) => {
            const optionIndex = parseInt(number) - 1;
            if (onSelectOption && optionIndex >= 0 && optionIndex < 4) {
              onSelectOption(optionIndex);
            }
          },
          'primera opción': () => onSelectOption && onSelectOption(0),
          'segunda opción': () => onSelectOption && onSelectOption(1),
          'tercera opción': () => onSelectOption && onSelectOption(2),
          'cuarta opción': () => onSelectOption && onSelectOption(3),
          'opción a': () => onSelectOption && onSelectOption(0),
          'opción b': () => onSelectOption && onSelectOption(1),
          'opción c': () => onSelectOption && onSelectOption(2),
          'opción d': () => onSelectOption && onSelectOption(3),
        });
      }

      // Set the language
      annyang.setLanguage(language);

      // Add commands to annyang
      annyang.addCommands(commands);

      // Start listening
      annyang.start({ autoRestart: true, continuous: false });

      // Add error handling
      annyang.addCallback('error', (err) => {
        console.error('Voice recognition error:', err);
      });

      // Add debug logging for recognized commands
      annyang.addCallback('resultMatch', (userSaid, commandText, phrases) => {
        console.log('Voice command recognized:', userSaid);
      });

      // Add debug logging for unrecognized commands
      annyang.addCallback('resultNoMatch', (phrases) => {
        console.log('Voice command not recognized:', phrases);
      });
    }
  }, [onNext, onPrevious, onSubmit, onBack, onSelectOption, isLastQuestion, language]);

  useEffect(() => {
    initializeVoiceCommands();

    // Cleanup function
    return () => {
      if (annyang) {
        annyang.abort();
        annyang.removeCommands();
      }
    };
  }, [initializeVoiceCommands]);

  const toggleVoiceRecognition = (enable) => {
    if (annyang) {
      if (enable) {
        annyang.start();
      } else {
        annyang.abort();
      }
    }
  };

  return {
    toggleVoiceRecognition,
  };
}; 