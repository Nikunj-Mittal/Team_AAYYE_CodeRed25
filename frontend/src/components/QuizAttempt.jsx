import React, { useState, useEffect, useCallback } from 'react';
import '../styles/rtl.css';
import HandGestureControl from './HandGestureControl';
import { useVoiceNavigation } from '../hooks/useVoiceControl';
import useTextToSpeech from '../hooks/useTextToSpeech';

function QuizAttempt({ quizId, onBack, language, selectedControl }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());
  const [gestureControlEnabled, setGestureControlEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Narrate current question and options
  const narrateCurrentQuestion = useCallback(() => {
    if (!quiz || !narrationEnabled) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionText = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;
    const optionsText = currentQuestion.options
      .map((option, index) => `Option ${index + 1}: ${option.text}`)
      .join('. ');

    speak(`${questionText}. ${optionsText}`);
  }, [quiz, currentQuestionIndex, narrationEnabled, speak]);

  // Call narration when question changes
  useEffect(() => {
    narrateCurrentQuestion();
    return () => stop(); // Cleanup: stop narration when component unmounts or question changes
  }, [currentQuestionIndex, quiz, narrationEnabled]);

  // Voice control handlers
  const handleSelectOption = useCallback((optionIndex) => {
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.options[optionIndex]) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentQuestion.options[optionIndex].id.toString()
      }));
      setError(null);
      
      // Narrate the selected option
      if (narrationEnabled) {
        const selectedOption = currentQuestion.options[optionIndex];
        speak(`Selected option ${optionIndex + 1}: ${selectedOption.text}`);
      }
    }
  }, [quiz, currentQuestionIndex, narrationEnabled, speak]);

  const handleNext = useCallback(() => {
    setError(null);
    if (currentQuestionIndex < quiz?.questions.length - 1) {
      const currentQuestion = quiz.questions[currentQuestionIndex];
      if (!answers[currentQuestion.id]) {
        setSkippedQuestions(prev => new Set(prev).add(currentQuestion.id));
      }
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Narrate the next question after state update
      setTimeout(() => {
        if (narrationEnabled) {
          narrateCurrentQuestion();
        }
      }, 100);
    }
  }, [quiz, currentQuestionIndex, answers, narrationEnabled, narrateCurrentQuestion]);

  const handlePrevious = useCallback(() => {
    setError(null);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      
      // Narrate the previous question after state update
      setTimeout(() => {
        if (narrationEnabled) {
          narrateCurrentQuestion();
        }
      }, 100);
    }
  }, [currentQuestionIndex, narrationEnabled, narrateCurrentQuestion]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      const answeredQuestions = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: parseInt(questionId),
        selected_option_id: parseInt(optionId)
      }));

      const response = await fetch('http://localhost:5000/api/quiz/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: answeredQuestions
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit quiz: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult({
        ...data,
        skippedCount: skippedQuestions.size
      });
    } catch (error) {
      setError(error.message);
      console.error('Error submitting quiz:', error);
    } finally {
      setLoading(false);
    }
  }, [quizId, answers, skippedQuestions]);

  // Initialize voice navigation
  const { toggleVoiceRecognition } = useVoiceNavigation({
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSubmit: handleSubmit,
    onBack,
    onSelectOption: handleSelectOption,
    isLastQuestion: quiz ? currentQuestionIndex === quiz.questions.length - 1 : false,
    language
  });

  const handleVoiceToggle = useCallback(() => {
    setVoiceEnabled(prev => {
      const newState = !prev;
      toggleVoiceRecognition(newState);
      return newState;
    });
  }, [toggleVoiceRecognition]);

  useEffect(() => {
    fetchQuiz();
  }, [quizId, language]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/quiz/${quizId}?lang=${language}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate quiz data
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Invalid quiz format or empty quiz');
      }
      
      setQuiz(data);
      setAnswers({});
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGestureDetected = (gesture) => {
    if (!quiz) return;

    switch (gesture) {
      case 0:
        // Previous question
        if (currentQuestionIndex > 0) {
          handlePrevious();
        }
        break;
      case 1:
      case 2:
      case 3:
      case 4:
        // Select option
        const currentQuestion = quiz.questions[currentQuestionIndex];
        if (currentQuestion && currentQuestion.options[gesture - 1]) {
          handleSelectOption(gesture - 1);
        }
        break;
      case 5:
        // Next question or submit
        if (currentQuestionIndex < quiz.questions.length - 1) {
          handleNext();
        } else {
          handleSubmit(new Event('submit'));
        }
        break;
    }
  };

  useEffect(() => {
    // Enable narration if either voice or gesture control is enabled
    if (voiceEnabled || gestureControlEnabled) {
      setNarrationEnabled(true);
    }
  }, [voiceEnabled, gestureControlEnabled]);

  // Add effect to narrate when quiz is first loaded
  useEffect(() => {
    if (quiz && narrationEnabled) {
      narrateCurrentQuestion();
    }
  }, [quiz, narrationEnabled]);

  // Add effect to narrate when narration is enabled
  useEffect(() => {
    if (narrationEnabled && quiz) {
      narrateCurrentQuestion();
    }
  }, [narrationEnabled]);

  const renderControls = () => {
    return (
      <>
        <div className="narration-control">
          <button 
            className={`narration-button ${narrationEnabled ? 'active' : ''}`}
            onClick={() => setNarrationEnabled(prev => !prev)}
            title={narrationEnabled ? 'Disable narration' : 'Enable narration'}
            disabled={voiceEnabled || gestureControlEnabled}
          >
            {narrationEnabled ? '🔊 Narration ON' : '🔇 Narration OFF'}
          </button>
          {isSpeaking && <span className="speaking-indicator">Speaking...</span>}
          {narrationEnabled && <button onClick={narrateCurrentQuestion}>Repeat Question</button>}
          {(voiceEnabled || gestureControlEnabled) && (
            <span className="narration-info">Narration is automatically enabled with controls</span>
          )}
        </div>

        {selectedControl === 'voice' && (
          <>
            <div className="voice-control-container">
              <div className="voice-instructions">
                <h3>Voice Commands:</h3>
                <ul>
                  <li>"Next question" - Move to next question</li>
                  <li>"Previous question" - Move to previous question</li>
                  <li>"Select option [1-4]" - Select an answer option</li>
                  <li>"Submit quiz" - Submit the quiz (on last question)</li>
                  <li>"Exit quiz" - Exit to quiz list</li>
                </ul>
                <button 
                  className={`voice-control-button ${voiceEnabled ? 'active' : ''}`}
                  onClick={handleVoiceToggle}
                  title={voiceEnabled ? 'Disable voice control' : 'Enable voice control'}
                >
                  {voiceEnabled ? '🎤 Voice ON' : '🎤 Voice OFF'}
                </button>
                {voiceEnabled && <p>Voice control is active</p>}
              </div>
            </div>
          </>
        )}

        {selectedControl === 'gesture' && (
          <>
            <div className="gesture-control-container">
              <div className="gesture-instructions">
                <h3>Gesture Controls:</h3>
                <ul>
                  <li>Closed hand (no fingers): Previous question</li>
                  <li>1 finger: Select first option</li>
                  <li>2 fingers: Select second option</li>
                  <li>3 fingers: Select third option</li>
                  <li>4 fingers: Select fourth option</li>
                  <li>All fingers: Next question / Submit</li>
                </ul>
                <div className="gesture-control-toggle">
                  <label>
                    <input
                      type="checkbox"
                      checked={gestureControlEnabled}
                      onChange={(e) => setGestureControlEnabled(e.target.checked)}
                    />
                    Enable Gesture Control
                  </label>
                </div>
                {gestureControlEnabled && <p>Hold gesture for 1 second to activate</p>}
              </div>
            </div>

            <HandGestureControl
              onGestureDetected={handleGestureDetected}
              enabled={gestureControlEnabled}
            />
          </>
        )}
      </>
    );
  };

  // Loading state
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchQuiz} className="retry-button">Retry</button>
        <button onClick={onBack} className="back-button">Back to Quiz List</button>
      </div>
    );
  }

  // Quiz not loaded
  if (!quiz) {
    return <div>No quiz data available</div>;
  }

  // Results view
  if (result) {
    return (
      <div className="quiz-result">
        <h2>Quiz Results</h2>
        <p>Score: {result.score} out of {result.total}</p>
        <p>Percentage: {result.percentage.toFixed(2)}%</p>
        <p>Questions Skipped: {result.skippedCount}</p>
        <button onClick={onBack} className="back-button">Back to Quiz List</button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const containerClass = quiz.isRTL ? 'quiz-container rtl' : 'quiz-container';

  return (
    <div className={containerClass}>
      <div className="quiz-header">
        <h2>{quiz?.title}</h2>
      </div>
      
      <div className="quiz-progress">
        <p>Question {currentQuestionIndex + 1} of {totalQuestions}</p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="question-form">
        <div className="question" key={currentQuestion.id}>
          <p className="question-text">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </p>
          <div className="options-list">
            {currentQuestion.options.map(option => (
              <label key={option.id} className="option-label">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option.id}
                  checked={answers[currentQuestion.id] === option.id.toString()}
                  onChange={(e) => {
                    setAnswers({
                      ...answers,
                      [currentQuestion.id]: e.target.value
                    });
                    setError(null); // Clear error when answer is selected
                  }}
                />
                <span className="option-text">{option.text}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="navigation-buttons">
          <button 
            type="button" 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="nav-button prev"
          >
            Previous
          </button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button 
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleNext}
              className="nav-button next"
            >
              {answers[currentQuestion.id] ? 'Next' : 'Skip'}
            </button>
          )}
        </div>

        <div className="quiz-navigation">
          <button 
            type="button" 
            onClick={onBack} 
            className="back-button"
            disabled={loading}
          >
            Exit Quiz
          </button>
        </div>

        <div className="question-status">
          {skippedQuestions.has(currentQuestion.id) ? (
            <span className="status skipped">Skipped</span>
          ) : answers[currentQuestion.id] ? (
            <span className="status answered">Answered</span>
          ) : (
            <span className="status unanswered">Not Answered</span>
          )}
        </div>
      </form>

      {renderControls()}
    </div>
  );
}

export default QuizAttempt; 