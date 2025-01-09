import React, { useState } from 'react';

function QuizForm({ onQuizCreated }) {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{
    question: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/create_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, questions }),
      });
      
      setTitle('');
      setQuestions([{
        question: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }]);
      
      onQuizCreated();
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="quiz-form">
      <input
        type="text"
        placeholder="Quiz Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="question-block">
          <input
            type="text"
            placeholder="Question"
            value={q.question}
            onChange={(e) => {
              const newQuestions = [...questions];
              newQuestions[qIndex].question = e.target.value;
              setQuestions(newQuestions);
            }}
            required
          />
          {q.options.map((opt, optIndex) => (
            <div key={optIndex} className="option-block">
              <input
                type="text"
                placeholder={`Option ${optIndex + 1}`}
                value={opt.text}
                onChange={(e) => {
                  const newQuestions = [...questions];
                  newQuestions[qIndex].options[optIndex].text = e.target.value;
                  setQuestions(newQuestions);
                }}
                required
              />
              <input
                type="radio"
                name={`correct-${qIndex}`}
                checked={opt.isCorrect}
                onChange={() => {
                  const newQuestions = [...questions];
                  newQuestions[qIndex].options.forEach((o, i) => {
                    o.isCorrect = i === optIndex;
                  });
                  setQuestions(newQuestions);
                }}
                required
              />
            </div>
          ))}
        </div>
      ))}
      <button type="button" onClick={() => setQuestions([...questions, {
        question: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }])}>Add Question</button>
      <button type="submit">Create Quiz</button>
    </form>
  );
}

export default QuizForm; 