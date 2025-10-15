/**
 * Funkcje pomocnicze do pracy z danymi użytkownika
 */

/**
 * Generuje username na podstawie danych użytkownika
 * Priorytet: displayName -> email (część przed @)
 * @param {Object} user - obiekt użytkownika z Firebase Auth
 * @returns {string} - wygenerowany username
 */
export const generateUsername = (user) => {
  if (!user) {
    return '';
  }

  // Priorytet 1: displayName (nazwa użytkownika wprowadzona podczas rejestracji)
  if (user.displayName && user.displayName.trim()) {
    // Usuń spacje i znaki specjalne, konwertuj na małe litery
    return user.displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '') // Zostaw tylko litery, cyfry, kropki, podkreślenia i myślniki
      .substring(0, 50); // Ogranicz długość do 50 znaków
  }

  // Fallback: email (część przed @)
  if (user.email) {
    return user.email.split('@')[0];
  }

  return '';
};

/**
 * Sprawdza czy username jest poprawny
 * @param {string} username - username do sprawdzenia
 * @returns {boolean} - czy username jest poprawny
 */
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return false;
  }

  // Username musi mieć co najmniej 2 znaki i maksymalnie 50
  if (username.length < 2 || username.length > 50) {
    return false;
  }

  // Username może zawierać tylko litery, cyfry, kropki, podkreślenia i myślniki
  const validPattern = /^[a-z0-9._-]+$/;
  return validPattern.test(username);
};
