import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import LoginPage from './components/LoginPage';
import RegistrationPage from './components/RegistrationPage';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import Layout from './components/Layout';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Layout colorMode={colorMode}>
            <Routes>
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <RegistrationPage /> : <Navigate to="/" />} />
            <Route path="/" element={
              !user ? (
                <Navigate to="/login" />
              ) : user.role === 'teacher' ? (
                <TeacherDashboard user={user} />
              ) : (
                <StudentDashboard user={user} />
              )
            } />
          </Routes>
        </Layout>
      </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
