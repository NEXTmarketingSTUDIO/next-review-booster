import { useState, useEffect } from 'react';
import firebaseAuthService from '../services/firebaseAuth';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Nasłuchuj zmian stanu autoryzacji (tylko raz przy montowaniu)
    const unsubscribe = firebaseAuthService.onAuthStateChange((userData) => {
      setUser(userData);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  // Funkcje autoryzacji
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await firebaseAuthService.login(email, password);
      
      if (!result.success) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd podczas logowania.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await firebaseAuthService.register(email, password, displayName);
      
      if (!result.success) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd podczas rejestracji.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await firebaseAuthService.logout();
      
      if (!result.success) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd podczas wylogowania.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await firebaseAuthService.resetPassword(email);
      
      if (!result.success) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd podczas resetowania hasła.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sprawdź czy użytkownik jest zalogowany
  const isAuthenticated = () => {
    return !!user;
  };

  // Sprawdź czy użytkownik ma zweryfikowany email
  const isEmailVerified = () => {
    return user && user.emailVerified;
  };

  // Pobierz token ID użytkownika
  const getIdToken = async () => {
    try {
      return await firebaseAuthService.getIdToken();
    } catch (err) {
      console.error('❌ Błąd pobierania tokenu:', err);
      return null;
    }
  };

  return {
    // Stan
    user,
    loading,
    error,
    
    // Funkcje
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated,
    isEmailVerified,
    getIdToken,
    
    // Pomocnicze
    clearError: () => setError(null)
  };
};

export default useAuth;
