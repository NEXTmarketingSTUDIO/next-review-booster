# 📝 NextReviews - Aplikacja Recenzji

Nowoczesna aplikacja do zarządzania recenzjami zbudowana w **React + Vite** frontend i **FastAPI** backend, inspirowana designem [Next Marketing Studio](https://nextmarketingstudio.com/).

## 🎨 Design

Aplikacja wykorzystuje kolorystykę i styl inspirowany Next Marketing Studio:
- **Ciemne tło** z gradientami
- **Niebieskie akcenty** (#0066ff, #3399ff)
- **Nowoczesny glassmorphism** z efektami blur
- **Animacje** i efekty hover
- **Responsywny design** dla wszystkich urządzeń

## 🏗️ Architektura

```
nextreviews/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx          # Główny komponent
│   │   ├── App.css          # Style główne
│   │   ├── index.css        # Style globalne
│   │   ├── main.jsx         # Punkt wejścia
│   │   └── services/
│   │       └── api.js       # Serwis API
│   ├── package.json
│   └── vite.config.js
├── backend/                 # FastAPI backend
│   ├── backend_main.py      # Główny plik API
│   └── requirements.txt     # Zależności Python
└── start_app.sh            # Skrypt uruchamiający
```

## 🚀 Szybki start

### Opcja 1: Użyj skryptu (Zalecane)

```bash
# Nadaj uprawnienia wykonywania
chmod +x start_app.sh

# Uruchom aplikację
./start_app.sh
```

### Opcja 2: Ręczne uruchomienie

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

#### Backend:
```bash
cd backend
pip install -r requirements.txt
python backend_main.py
```

## 🌐 Dostęp do aplikacji

Po uruchomieniu aplikacja będzie dostępna pod adresami:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Dokumentacja API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## ✨ Funkcje

### 🎯 Główna strona
- **Nazwa aplikacji**: "Next Reviews" w stylu Next Marketing Studio
- **Status połączenia**: Real-time sprawdzanie połączenia z backendem
- **Health endpoint**: Wyświetlanie danych z `/health`
- **Nowoczesny design**: Gradienty, animacje, glassmorphism
- **Responsywność**: Działa na wszystkich urządzeniach

### 🔧 Backend API
- **Health Check**: Endpoint `/health` z informacjami o statusie
- **CORS**: Skonfigurowany dla frontend
- **Auto-reload**: Automatyczne przeładowanie przy zmianach
- **Dokumentacja**: Automatyczna dokumentacja Swagger

## 🎨 Kolory i style

### Paleta kolorów (inspirowana Next Marketing Studio):
```css
--primary-dark: #0a0a0a
--secondary-dark: #1a1a1a
--accent-blue: #0066ff
--accent-light-blue: #3399ff
--text-white: #ffffff
--text-gray: #cccccc
```

### Efekty:
- **Gradienty**: Ciemne tło z niebieskimi akcentami
- **Glassmorphism**: Przezroczyste karty z efektem blur
- **Animacje**: Fade-in, pulse, glow
- **Hover effects**: Transformacje i cienie

## 🔌 API Endpoints

### Health Check
- `GET /health` - Sprawdza status API
- Zwraca: status, message, timestamp, version

### Główny endpoint
- `GET /` - Informacje o API

## 🛠️ Technologie

### Frontend
- **React 18** - Biblioteka UI
- **Vite** - Szybki bundler
- **Axios** - HTTP client
- **CSS3** - Nowoczesne style z gradientami

### Backend
- **FastAPI** - Nowoczesny framework Python
- **Pydantic** - Walidacja danych
- **Uvicorn** - ASGI server
- **CORS** - Cross-origin requests

## 📱 Responsywność

Aplikacja jest w pełni responsywna:
- **Desktop**: Pełna funkcjonalność z efektami hover
- **Tablet**: Dostosowane rozmiary i odstępy
- **Mobile**: Zoptymalizowane dla małych ekranów

## 🔍 Testowanie

1. **Uruchom aplikację**: `./start_app.sh`
2. **Otwórz**: http://localhost:3000
3. **Sprawdź status**: Powinien pokazać "Połączono z backendem"
4. **Zobacz dane**: Health endpoint powinien wyświetlić informacje z API

## 🐛 Rozwiązywanie problemów

### Błąd połączenia z API
- Sprawdź czy backend działa na porcie 8000
- Sprawdź endpoint http://localhost:8000/health
- Sprawdź konsole przeglądarki (F12)

### Problemy z instalacją
- Upewnij się, że masz Node.js 16+ i Python 3.8+
- Sprawdź czy wszystkie zależności zostały zainstalowane

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
# Pliki w folderze dist/
```

### Backend
```bash
# Użyj gunicorn dla produkcji
gunicorn backend_main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📄 Licencja

Projekt NextReviews - aplikacja do zarządzania recenzjami.

---

**🎉 Gotowe do użycia! Uruchom `./start_app.sh` i otwórz http://localhost:3000**
