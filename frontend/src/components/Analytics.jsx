import React from 'react';

function Analytics({ quizzes }) {
  return (
    <div className="analytics">
      <h2>Quiz Analytics</h2>
      {quizzes.length === 0 ? (
        <p>No quizzes created yet.</p>
      ) : (
        <div className="analytics-list">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-stats">
              <h3>{quiz.title}</h3>
              <p>Created on: {new Date(quiz.created_at).toLocaleDateString()}</p>
              {quiz.attempts_count && (
                <>
                  <p>Total Attempts: {quiz.attempts_count}</p>
                  <p>Average Score: {quiz.average_score?.toFixed(2) || 'N/A'}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Analytics; 