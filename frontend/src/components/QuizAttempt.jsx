import React, { useState, useEffect } from 'react';

function QuizAttempt({ quizId, onBack, language }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/${quizId}?lang=${language}`);
      const data = await response.json();
      setQuiz(data);
      setAnswers({});
    } catch (error) {
      console.error('Error fetching quiz:', error);
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
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (!quiz) return <div>Loading...</div>;

  if (result) {
    return (
      <div className="quiz-result">
        <h2>Quiz Results</h2>
        <p>Score: {result.score} out of {result.total}</p>
        <p>Percentage: {result.percentage.toFixed(2)}%</p>
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
      <button type="submit">Submit Quiz</button>
      <button type="button" onClick={onBack}>Back</button>
    </form>
  );
}

export default QuizAttempt; 