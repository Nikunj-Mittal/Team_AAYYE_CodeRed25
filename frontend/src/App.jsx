import React, { useState } from 'react';
import TeacherView from './views/TeacherView';
import StudentView from './views/StudentView';
import './App.css';

function App() {
  const [role, setRole] = useState(null);

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

  return (
    <div className="App">
      {role === 'teacher' ? <TeacherView /> : <StudentView />}
      <button className="change-role" onClick={() => setRole(null)}>
        Change Role
      </button>
    </div>
  );
}

export default App; 