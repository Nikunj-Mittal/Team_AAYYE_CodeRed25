import React, { useState, useEffect } from 'react';
import QuizList from '../components/QuizList';
import QuizAttempt from '../components/QuizAttempt';
import LanguageSelector from '../components/LanguageSelector';

function StudentView() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuizzes = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/quizzes?lang=${selectedLanguage}`);
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
    setIsRefreshing(false);
  };

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    fetchQuizzes(); // Fetch quizzes whenever language changes
  };

  // Initial fetch
  useEffect(() => {
    fetchQuizzes();
  }, []); // Remove selectedLanguage dependency since we handle it in handleLanguageChange

  return (
    <div className="student-view">
      <div className="header-controls">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
        />
        <button 
          className="refresh-button"
          onClick={fetchQuizzes}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Quizzes'}
        </button>
      </div>
      {selectedQuiz ? (
        <QuizAttempt 
          quizId={selectedQuiz} 
          onBack={() => setSelectedQuiz(null)}
          language={selectedLanguage}
        />
      ) : (
        <QuizList 
          quizzes={quizzes} 
          onSelectQuiz={setSelectedQuiz}
        />
      )}
    </div>
  );
}

export default StudentView; 