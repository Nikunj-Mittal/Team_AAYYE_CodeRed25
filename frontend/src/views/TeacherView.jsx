import React, { useState, useEffect } from 'react';
import QuizForm from '../components/QuizForm';
import Analytics from '../components/Analytics';

function TeacherView() {
  const [view, setView] = useState('create');
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/quizzes');
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  return (
    <div className="teacher-view">
      <div className="nav-buttons">
        <button onClick={() => setView('create')}>Create Quiz</button>
        <button onClick={() => setView('analytics')}>View Analytics</button>
      </div>
      {view === 'create' ? (
        <QuizForm onQuizCreated={fetchQuizzes} />
      ) : (
        <Analytics quizzes={quizzes} />
      )}
    </div>
  );
}

export default TeacherView; 