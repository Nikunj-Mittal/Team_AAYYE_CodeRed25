import React, { useState, useEffect } from 'react';

function QuizAttempt({ quizId, onBack, language }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId, language]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/${quizId}?lang=${language}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      const data = await response.json();
      setQuiz(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/quiz/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizId,
          answers: Object.entries(answers).map(([questionId, optionId]) => ({
            question_id: parseInt(questionId),
            selected_option_id: parseInt(optionId)
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading quiz...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quiz) return <div className="error">Quiz not found</div>;

  if (result) {
    return (
      <div className="quiz-result">
        <h2>Quiz Results</h2>
        <p>Score: {result.score} out of {result.total}</p>
        <p>Percentage: {result.percentage ? result.percentage.toFixed(2) : 0}%</p>
        <button onClick={onBack}>Back to Quiz List</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="quiz-attempt">
      <h2>{quiz.title}</h2>
      {quiz.questions.map((question, index) => (
        <div key={question.id} className="question">
          <p>{index + 1}. {question.question}</p>
          {question.options.map(option => (
            <label key={option.id}>
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                onChange={(e) => setAnswers({
                  ...answers,
                  [question.id]: e.target.value
                })}
                required
              />
              {option.text}
            </label>
          ))}
        </div>
      ))}
      <div className="quiz-buttons">
        <button type="submit">Submit Quiz</button>
        <button type="button" onClick={onBack}>Back</button>
      </div>
    </form>
  );
}

export default QuizAttempt; 