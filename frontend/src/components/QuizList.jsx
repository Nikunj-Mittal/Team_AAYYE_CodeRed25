import React, { useState } from 'react';

function QuizList({ quizzes, onSelectQuiz, language }) {
  const [selectedControl, setSelectedControl] = useState(null);

  const handleQuizSelect = (quizId) => {
    onSelectQuiz(quizId, selectedControl);
  };

  const renderControlSelector = () => (
    <div className="control-selector">
      <h3>Select Control Method (Optional)</h3>
      <div className="control-buttons">
        <button 
          className={`control-button ${selectedControl === 'voice' ? 'active' : ''}`}
          onClick={() => setSelectedControl(selectedControl === 'voice' ? null : 'voice')}
        >
          🎤 Voice Control
        </button>
        <button 
          className={`control-button ${selectedControl === 'gesture' ? 'active' : ''}`}
          onClick={() => setSelectedControl(selectedControl === 'gesture' ? null : 'gesture')}
        >
          👋 Gesture Control
        </button>
      </div>
      {selectedControl && (
        <button 
          className="control-button clear-selection"
          onClick={() => setSelectedControl(null)}
        >
          ❌ Clear Selection
        </button>
      )}
    </div>
  );

  return (
    <div className="quiz-list">
      {renderControlSelector()}
      <h2>Available Quizzes</h2>
      <ul>
        {quizzes.map(quiz => (
          <li key={quiz.id}>
            <button onClick={() => handleQuizSelect(quiz.id)}>
              {quiz.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QuizList; 