// Strona rejestracji
// Pokazuje formularz rejestracji dla niezalogowanych użytkowników

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const RegisterPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Jeśli użytkownik jest już zalogowany, przekieruj na dashboard
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      {showLogin ? (
        <LoginForm 
          onLoginSuccess={() => {
            console.log('✅ Logowanie udane, przekierowanie na dashboard');
          }}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      ) : (
        <RegisterForm 
          onRegisterSuccess={() => {
            console.log('✅ Rejestracja udana, przełączanie na logowanie');
            setShowLogin(true);
          }}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
};

export default RegisterPage;
