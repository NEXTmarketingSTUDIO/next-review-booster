import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Klasa do zarządzania autoryzacją Firebase
class FirebaseAuthService {
  constructor() {
    this.auth = auth;
    this.currentUser = null;
    this.authStateListeners = [];
  }

  // Rejestracja nowego użytkownika
  async register(email, password, displayName = '') {
    try {
      console.log('🔄 Rejestracja użytkownika:', email);
      
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // Aktualizuj profil użytkownika z nazwą
      if (displayName) {
        await updateProfile(user, {
          displayName: displayName
        });
      }
      
      // Wyślij email weryfikacyjny
      await sendEmailVerification(user);
      
      console.log('✅ Użytkownik zarejestrowany:', user.uid);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
      
    } catch (error) {
      console.error('❌ Błąd rejestracji:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Logowanie użytkownika
  async login(email, password) {
    try {
      console.log('🔄 Logowanie użytkownika:', email);
      
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      console.log('✅ Użytkownik zalogowany:', user.uid);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
      
    } catch (error) {
      console.error('❌ Błąd logowania:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Wylogowanie użytkownika
  async logout() {
    try {
      console.log('🔄 Wylogowywanie użytkownika');
      
      await signOut(this.auth);
      
      console.log('✅ Użytkownik wylogowany');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Błąd wylogowania:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Reset hasła
  async resetPassword(email) {
    try {
      console.log('🔄 Reset hasła dla:', email);
      
      await sendPasswordResetEmail(this.auth, email);
      
      console.log('✅ Email reset hasła wysłany');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Błąd reset hasła:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Pobierz aktualnego użytkownika
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Nasłuchuj zmian stanu autoryzacji
  onAuthStateChange(callback) {
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      
      const userData = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      } : null;
      
      callback(userData);
    });
    
    this.authStateListeners.push(unsubscribe);
    return unsubscribe;
  }

  // Sprawdź czy użytkownik jest zalogowany
  isAuthenticated() {
    return !!this.auth.currentUser;
  }

  // Pobierz token ID użytkownika
  async getIdToken() {
    try {
      if (this.auth.currentUser) {
        return await this.auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('❌ Błąd pobierania tokenu:', error);
      return null;
    }
  }

  // Konwertuj kody błędów Firebase na czytelne komunikaty
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Nie znaleziono użytkownika z tym adresem email.',
      'auth/wrong-password': 'Nieprawidłowe hasło.',
      'auth/email-already-in-use': 'Ten adres email jest już używany.',
      'auth/weak-password': 'Hasło jest zbyt słabe. Użyj co najmniej 6 znaków.',
      'auth/invalid-email': 'Nieprawidłowy adres email.',
      'auth/user-disabled': 'To konto zostało wyłączone.',
      'auth/too-many-requests': 'Zbyt wiele prób logowania. Spróbuj ponownie później.',
      'auth/network-request-failed': 'Błąd połączenia z siecią.',
      'auth/requires-recent-login': 'Ta operacja wymaga ponownego logowania.'
    };
    
    return errorMessages[errorCode] || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
  }

  // Wyczyść wszystkie nasłuchiwacze
  cleanup() {
    this.authStateListeners.forEach(unsubscribe => unsubscribe());
    this.authStateListeners = [];
  }
}

// Utwórz instancję serwisu
const firebaseAuthService = new FirebaseAuthService();

// Eksportuj serwis
export default firebaseAuthService;
