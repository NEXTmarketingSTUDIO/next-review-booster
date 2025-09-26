# Konfiguracja URL-i dla Deploymentu

## Zmienne środowiskowe

### Backend (Render)

Ustaw następujące zmienne środowiskowe w Render:

```bash
# URL frontendu (gdzie będzie hostowana aplikacja)
FRONTEND_URL=https://next-reviews-9d19c.web.app

# Firebase credentials (już ustawione)
FIREBASE_PROJECT_ID=next-reviews-9d19c
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_CLIENT_X509_CERT_URL=...
```

### Frontend (Firebase Hosting)

Ustaw zmienną środowiskową w Firebase Hosting:

```bash
# URL backendu (Render)
VITE_API_URL=https://next-review-booster.onrender.com
```

## Lokalne testowanie

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Kod QR: `http://localhost:3000/client-login`

### Production URLs
- Frontend: `https://next-reviews-9d19c.web.app`
- Backend: `https://next-review-booster.onrender.com`
- Kod QR: `https://next-reviews-9d19c.web.app/client-login`

## Jak to działa

1. **Backend** używa `FRONTEND_URL` do generowania URL-i w kodach QR
2. **Frontend** używa `VITE_API_URL` do komunikacji z backendem
3. **Kody QR** kierują do `{FRONTEND_URL}/client-login`
4. **Formularze recenzji** używają `{FRONTEND_URL}/review/{code}`

## Przykład konfiguracji

### Render (Backend)
```yaml
envVars:
  - key: FRONTEND_URL
    value: https://next-reviews-9d19c.web.app
  - key: FIREBASE_PROJECT_ID
    value: next-reviews-9d19c
  # ... inne zmienne Firebase
```

### Firebase Hosting (Frontend)
```bash
# W .env.production
VITE_API_URL=https://next-review-booster.onrender.com
```
