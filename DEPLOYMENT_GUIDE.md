# 🚀 Przewodnik Deploymentu NextReviews

## 📋 **Przygotowanie do deploymentu**

### **1. Wymagania**
- ✅ Konto Google (do Firebase)
- ✅ Projekt Firebase utworzony
- ✅ Firebase CLI dostępny (używamy npx)
- ✅ Node.js i npm zainstalowane

### **2. Konfiguracja Firebase**
- ✅ Projekt: `next-reviews-9d19c`
- ✅ Hosting site: `next-reviews`
- ✅ Konfiguracja w `firebase.json` i `.firebaserc`

## 🔥 **Deployment Frontend (Firebase Hosting)**

### **Krok 1: Logowanie do Firebase**
```bash
# Zaloguj się do Firebase (otworzy przeglądarkę)
npx firebase-tools login
```

### **Krok 2: Automatyczny deployment**
```bash
# Uruchom skrypt deploymentu
./deploy.sh
```

### **Krok 3: Ręczny deployment (alternatywa)**
```bash
# Zbuduj frontend
cd frontend
npm run build

# Wróć do głównego katalogu
cd ..

# Deploy na Firebase
npx firebase-tools deploy --only hosting
```

## 🌐 **Deployment Backend (Opcje)**

### **Opcja 1: Railway**
```bash
# Instaluj Railway CLI
npm install -g @railway/cli

# Zaloguj się
railway login

# Deploy
railway deploy
```

### **Opcja 2: Heroku**
```bash
# Instaluj Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Zaloguj się
heroku login

# Utwórz aplikację
heroku create nextreviews-api

# Deploy
git push heroku main
```

### **Opcja 3: Render**
1. Połącz repozytorium GitHub z Render
2. Wybierz folder `backend`
3. Ustaw build command: `pip install -r requirements.txt`
4. Ustaw start command: `python backend_main.py`

## 📱 **Adresy po deploymentzie**

### **Frontend (Firebase Hosting)**
- **URL**: https://next-reviews-9d19c.web.app
- **Custom domain**: Można skonfigurować w Firebase Console

### **Backend (przykład z Railway)**
- **URL**: https://nextreviews-api.railway.app
- **Health check**: https://nextreviews-api.railway.app/health

## ⚙️ **Konfiguracja po deploymentzie**

### **1. Aktualizuj URL API w frontend**
W `frontend/src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: 'https://nextreviews-api.railway.app', // URL Twojego backendu
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### **2. Skonfiguruj CORS w backend**
W `backend/backend_main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://next-reviews-9d19c.web.app",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **3. Zmienne środowiskowe**
Utwórz plik `.env` w folderze backend:
```env
PORT=8000
CORS_ORIGINS=https://next-reviews-9d19c.web.app
```

## 🔧 **Automatyzacja deploymentu**

### **GitHub Actions (CI/CD)**
Utwórz `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    - name: Build
      run: |
        cd frontend
        npm run build
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: next-reviews-9d19c
```

## 📊 **Monitoring i Analytics**

### **Firebase Analytics**
- Automatycznie włączone w Firebase
- Dostępne w Firebase Console → Analytics

### **Performance Monitoring**
- Firebase Performance Monitoring
- Dostępne w Firebase Console → Performance

## 🚨 **Rozwiązywanie problemów**

### **Błąd: "Firebase project not found"**
```bash
# Sprawdź konfigurację
cat .firebaserc

# Zaktualizuj projekt
npx firebase-tools use next-reviews-9d19c
```

### **Błąd: "Build failed"**
```bash
# Sprawdź błędy w konsoli
cd frontend
npm run build

# Sprawdź zależności
npm install
```

### **Błąd: "CORS policy"**
- Sprawdź konfigurację CORS w backend
- Dodaj URL frontendu do `allow_origins`

## 🎉 **Gotowe!**

Po deploymentzie Twoja aplikacja będzie dostępna pod adresem:
**https://next-reviews-9d19c.web.app**

### **Przydatne linki:**
- Firebase Console: https://console.firebase.google.com/project/next-reviews-9d19c
- Hosting: https://console.firebase.google.com/project/next-reviews-9d19c/hosting
- Analytics: https://console.firebase.google.com/project/next-reviews-9d19c/analytics
