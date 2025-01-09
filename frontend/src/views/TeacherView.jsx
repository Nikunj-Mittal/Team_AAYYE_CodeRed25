import React, { useState, useEffect } from 'react';
import QuizForm from '../components/QuizForm';
import Analytics from '../components/Analytics';

function TeacherView() {
  const [view, setView] = useState('create');
  const [quizzes, setQuizzes] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:5000/api/quizzes');
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
    setIsRefreshing(false);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/quiz/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quiz');
      }

      await fetchQuizzes(); // Refresh the quiz list
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    }
    setIsDeleting(false);
  };

  return (
    <div className="teacher-view">
      <div className="nav-buttons">
        <button onClick={() => setView('create')}>Create Quiz</button>
        <button onClick={() => setView('analytics')}>View Analytics</button>
        <button 
          className="refresh-button"
          onClick={fetchQuizzes}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Quizzes'}
        </button>
      </div>

      {view === 'create' ? (
        <>
          <div className="quiz-management">
            <h2>Existing Quizzes</h2>
            <div className="quiz-list">
              {quizzes.length === 0 ? (
                <div className="quiz-item">
                  <span>No quizzes available</span>
                </div>
              ) : (
                quizzes.map(quiz => (
                  <div key={quiz.id} className="quiz-item">
                    <span>{quiz.title}</span>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      disabled={isDeleting}
                      title="Delete this quiz"
                    >
                      {isDeleting ? '...' : 'Delete'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <QuizForm onQuizCreated={fetchQuizzes} />
        </>
      ) : (
        <Analytics quizzes={quizzes} />
      )}
    </div>
  );
}

export default TeacherView; 