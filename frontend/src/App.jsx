import React, { useState, useEffect } from 'react';
import TeacherView from './views/TeacherView';
import StudentView from './views/StudentView';
import './App.css';
import QuizList from './components/QuizList';
import QuizAttempt from './components/QuizAttempt';

function App() {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedControl, setSelectedControl] = useState(null);
  const [role, setRole] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default to English

  useEffect(() => {
    if (role === 'student') {
      fetchQuizzes();
    }
  }, [role]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/quizzes');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quizzes: ${response.statusText}`);
      }
      
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelect = (quizId, controlMethod) => {
    setSelectedQuiz(quizId);
    setSelectedControl(controlMethod);
  };

  if (!role) {
    return (
      <div className="role-selection">
        <h1>Quiz Platform</h1>
        <h2>Select your role:</h2>
        <button onClick={() => setRole('teacher')}>Teacher</button>
        <button onClick={() => setRole('student')}>Student</button>
      </div>
    );
  }

  if (role === 'teacher') {
    return (
      <div className="App">
        <TeacherView />
        <button className="change-role" onClick={() => setRole(null)}>
          Change Role
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading quizzes...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchQuizzes} className="retry-button">Retry</button>
        <button onClick={() => setRole(null)} className="back-button">Change Role</button>
      </div>
    );
  }

  return (
    <div className="App">
      {selectedQuiz ? (
        <QuizAttempt 
          quizId={selectedQuiz} 
          onBack={() => {
            setSelectedQuiz(null);
            setSelectedControl(null);
          }}
          language={selectedLanguage}
          selectedControl={selectedControl}
        />
      ) : (
        <QuizList 
          quizzes={quizzes} 
          onSelectQuiz={handleQuizSelect}
          language={selectedLanguage}
        />
      )}
      <button className="change-role" onClick={() => setRole(null)}>
        Change Role
      </button>
    </div>
  );
}

export default App; 