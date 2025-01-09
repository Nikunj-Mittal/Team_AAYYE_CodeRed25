import React, { useState, useEffect } from 'react';
import QuizList from '../components/QuizList';
import QuizAttempt from '../components/QuizAttempt';
import LanguageSelector from '../components/LanguageSelector';

function StudentView() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    fetchQuizzes();
  }, [selectedLanguage]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quizzes?lang=${selectedLanguage}`);
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  return (
    <div className="student-view">
      <LanguageSelector
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
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