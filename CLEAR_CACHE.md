# Czyszczenie Cache Uprawnień

## Problem
Jeśli uprawnienia w bazie danych zostały zaktualizowane, ale aplikacja nadal pokazuje stare uprawnienia, należy wyczyścić cache w localStorage.

## Rozwiązanie

### Opcja 1: Przez konsolę przeglądarki
1. Otwórz konsolę przeglądarki (F12)
2. Wpisz i wykonaj:
```javascript
localStorage.clear();
location.reload();
```

### Opcja 2: Ręczne czyszczenie
1. Otwórz DevTools (F12)
2. Przejdź do zakładki "Application" lub "Storage"
3. W sekcji "Local Storage" znajdź swój localhost
4. Usuń klucze zaczynające się od `permission_`
5. Odśwież stronę (F5)

### Opcja 3: Przez Incognito/Private
1. Otwórz stronę w trybie prywatnym
2. Zaloguj się ponownie
3. Uprawnienia zostaną pobrane na świeżo

## Co zostało naprawione w backendzie:
- ✅ Zoptymalizowano pobieranie uprawnień (najpierw bezpośrednio po username)
- ✅ Dodano lepsze logowanie błędów
- ✅ Naprawiono endpoint powiadomień (usunięto wymaganie indeksu Firebase)
- ✅ Dodano pominięcie kolekcji systemowych (notifications)

