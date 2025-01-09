import React, { useState, useEffect } from 'react';
import '../styles/rtl.css';

function QuizAttempt({ quizId, onBack, language }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        skippedCount: skippedQuestions.size  // Add skipped count to results
      });
    } catch (error) {
      setError(error.message);
      console.error('Error submitting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Clear any existing errors
    setError(null);
    
    // Move to next question regardless of answer
    if (currentQuestionIndex < quiz.questions.length - 1) {
      // If question is not answered, consider it skipped
      const currentQuestion = quiz.questions[currentQuestionIndex];
      if (!answers[currentQuestion.id]) {
        const newSkipped = new Set(skippedQuestions);
        newSkipped.add(currentQuestion.id);
        setSkippedQuestions(newSkipped);
      }
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    setError(null); // Clear any existing errors
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
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
      <h2>{quiz.title}</h2>
      
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
    </div>
  );
}

export default QuizAttempt; 