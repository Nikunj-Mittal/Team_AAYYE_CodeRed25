import React, { useState, useEffect } from 'react';
import QuizList from '../components/QuizList';
import QuizAttempt from '../components/QuizAttempt';

function StudentView() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

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
    <div className="student-view">
      {selectedQuiz ? (
        <QuizAttempt 
          quizId={selectedQuiz} 
          onBack={() => setSelectedQuiz(null)}
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