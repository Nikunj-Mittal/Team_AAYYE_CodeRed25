import React, { useState } from 'react';

function QuizList({ quizzes, onSelectQuiz, language }) {
  const [selectedControl, setSelectedControl] = useState(null);

  const handleQuizSelect = (quizId) => {
    if (!selectedControl) {
      alert("Please select a control method first");
      return;
    }
    onSelectQuiz(quizId, selectedControl);
  };

  const renderControlSelector = () => (
    <div className="control-selector">
      <h3>Select Control Method</h3>
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