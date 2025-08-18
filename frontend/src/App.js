import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <RegistrationPage /> : <Navigate to="/" />} />
          <Route path="/" element={
            !user ? (
              <Navigate to="/login" />
            ) : user.role === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <StudentDashboard user={user} />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
