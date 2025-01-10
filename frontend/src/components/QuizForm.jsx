import React, { useState } from 'react';
import SpeechToTextButton from './SpeechToTextButton';
import LanguageSelector from './LanguageSelector';

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
      const questionsWithDummy = [...questions, {
        question: 'Dummy question',
        options: [
          { text: 'Option 1', isCorrect: false },
          { text: 'Option 2', isCorrect: false },
          { text: 'Option 3', isCorrect: false },
          { text: 'Option 4', isCorrect: true }
        ]
      }];

      await fetch('http://localhost:5000/api/create_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, questions: questionsWithDummy }),
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

  const handleSpeechInput = (field, questionIndex = null, optionIndex = null) => (text) => {
    if (questionIndex === null) {
      // For quiz title
      setTitle(text);
    } else if (optionIndex === null) {
      // For question text
      const newQuestions = [...questions];
      newQuestions[questionIndex].question = text;
      setQuestions(newQuestions);
    } else {
      // For option text
      const newQuestions = [...questions];
      newQuestions[questionIndex].options[optionIndex].text = text;
      setQuestions(newQuestions);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="quiz-form">
      <div className="form-group">
        <label>
          Quiz Title:
          <div className="input-with-speech">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <SpeechToTextButton
              onTextReceived={handleSpeechInput('title')}
              placeholder="Speak quiz title"
            />
          </div>
        </label>
      </div>

      {questions.map((question, questionIndex) => (
        <div key={questionIndex} className="question-block">
          <div className="form-group">
            <label>
              Question {questionIndex + 1}:
              <div className="input-with-speech">
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[questionIndex].question = e.target.value;
                    setQuestions(newQuestions);
                  }}
                  required
                />
                <SpeechToTextButton
                  onTextReceived={handleSpeechInput(null, questionIndex)}
                  placeholder="Speak question"
                />
              </div>
            </label>
          </div>

          <div className="form-group">
            <label>
              Language:
              <LanguageSelector
                selectedLanguage={question.language || 'en'}
                onLanguageChange={(language) => {
                  const newQuestions = [...questions];
                  newQuestions[questionIndex].language = language;
                  setQuestions(newQuestions);
                }}
              />
            </label>
          </div>

          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="option-block">
              <div className="input-with-speech">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[questionIndex].options[optionIndex].text = e.target.value;
                    setQuestions(newQuestions);
                  }}
                  placeholder={`Option ${optionIndex + 1}`}
                  required
                />
                <SpeechToTextButton
                  onTextReceived={handleSpeechInput(null, questionIndex, optionIndex)}
                  placeholder={`Speak option ${optionIndex + 1}`}
                />
              </div>
              <input
                type="radio"
                name={`correct-${questionIndex}`}
                checked={option.isCorrect}
                onChange={() => {
                  const newQuestions = [...questions];
                  newQuestions[questionIndex].options.forEach((o, i) => {
                    o.isCorrect = i === optionIndex;
                  });
                  setQuestions(newQuestions);
                }}
                required
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              const newQuestions = [...questions];
              newQuestions.splice(questionIndex, 1);
              setQuestions(newQuestions);
            }}
            className="remove-button"
          >
            Remove Question
          </button>
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