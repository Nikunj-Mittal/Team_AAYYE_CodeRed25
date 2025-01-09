import React from 'react';

function QuizList({ quizzes, onSelectQuiz }) {
  return (
    <div className="quiz-list">
      <h2>Available Quizzes</h2>
      {quizzes.length === 0 ? (
        <p>No quizzes available.</p>
      ) : (
        <ul>
          {quizzes.map(quiz => (
            <li key={quiz.id}>
              <button onClick={() => onSelectQuiz(quiz.id)}>
                {quiz.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QuizList; 