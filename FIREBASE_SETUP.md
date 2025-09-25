# 🔥 Konfiguracja Firebase Authentication

## 📋 Krok po kroku - Konfiguracja Firebase

### **Krok 1: Utwórz projekt Firebase**

1. **Przejdź do [Firebase Console](https://console.firebase.google.com/)**
2. **Kliknij "Create a project"**
3. **Wprowadź nazwę projektu**: `nextreviews` (lub inną)
4. **Wyłącz Google Analytics** (opcjonalnie)
5. **Kliknij "Create project"**

### **Krok 2: Włącz Authentication**

1. **W lewym menu kliknij "Authentication"**
2. **Kliknij "Get started"**
3. **Przejdź do zakładki "Sign-in method"**
4. **Włącz "Email/Password"**:
   - Kliknij na "Email/Password"
   - Włącz "Enable"
   - Kliknij "Save"

### **Krok 3: Pobierz konfigurację**

1. **Kliknij ikonę koła zębatego** (Settings) w lewym menu
2. **Wybierz "Project settings"**
3. **Przewiń w dół do sekcji "Your apps"**
4. **Kliknij ikonę Web** (`</>`)
5. **Wprowadź nazwę aplikacji**: `nextreviews-web`
6. **Kliknij "Register app"**
7. **Skopiuj konfigurację Firebase** (obiekt `firebaseConfig`)

### **Krok 4: Zaktualizuj plik konfiguracyjny**

Zastąp zawartość pliku `frontend/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Twoja konfiguracja Firebase (wklej tutaj)
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Twoja wartość
  authDomain: "nextreviews-12345.firebaseapp.com", // Twoja wartość
  projectId: "nextreviews-12345", // Twoja wartość
  storageBucket: "nextreviews-12345.appspot.com", // Twoja wartość
  messagingSenderId: "123456789", // Twoja wartość
  appId: "1:123456789:web:abcdef123456" // Twoja wartość
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);

// Inicjalizacja Firebase Authentication
export const auth = getAuth(app);

// Inicjalizacja Firestore Database
export const db = getFirestore(app);

export default app;
```

### **Krok 5: Skonfiguruj domeny autoryzowane**

1. **W Firebase Console przejdź do Authentication**
2. **Kliknij zakładkę "Settings"**
3. **Przewiń w dół do "Authorized domains"**
4. **Dodaj domeny**:
   - `localhost` (dla development)
   - Twoja domena produkcyjna (dla production)

### **Krok 6: Testuj konfigurację**

Po skonfigurowaniu uruchom aplikację:

```bash
./start_app.sh
```

I sprawdź czy Firebase działa poprawnie w konsoli przeglądarki.

## 🔒 **Bezpieczeństwo**

### **Zmienne środowiskowe (Zalecane)**

Zamiast hardkodować konfigurację, użyj zmiennych środowiskowych:

1. **Utwórz plik `.env` w folderze `frontend/`**:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

2. **Zaktualizuj `firebase.js`**:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 🚀 **Gotowe!**

Po wykonaniu tych kroków Firebase Authentication będzie gotowe do użycia w aplikacji.
