# Burger Menu - Instrukcja testowania

## Co zostało dodane

### ✅ **Burger Menu dla nawigacji głównej:**
- Hamburger ikona (3 linie) pojawia się na urządzeniach mobilnych (≤768px)
- Animowana transformacja hamburger → X przy otwieraniu
- Dropdown menu z linkami nawigacyjnymi
- Dropdown menu z przyciskami autoryzacji
- Overlay do zamykania menu kliknięciem poza nim

### 🎯 **Funkcjonalności:**
1. **Wykrywanie urządzeń mobilnych** - automatyczne przełączanie
2. **Animowane hamburger** - płynna transformacja ikony
3. **Dropdown menu** - linki i przyciski w kolumnie
4. **Overlay** - zamykanie menu kliknięciem poza nim
5. **Auto-zamykanie** - menu zamyka się po kliknięciu w link
6. **Responsywność** - dostosowanie do różnych rozmiarów ekranów

## Jak testować

### 1. **Narzędzia deweloperskie przeglądarki:**
1. Otwórz aplikację w przeglądarce
2. Naciśnij F12 (lub Cmd+Option+I na Mac)
3. Kliknij ikonę urządzenia mobilnego
4. Wybierz iPhone lub Android
5. Sprawdź czy hamburger menu się pojawia

### 2. **Testowanie funkcjonalności:**
- ✅ **Kliknij hamburger** - menu powinno się otworzyć
- ✅ **Animacja ikony** - hamburger → X
- ✅ **Linki nawigacyjne** - wszystkie linki widoczne
- ✅ **Przyciski auth** - Zaloguj się/Rejestracja
- ✅ **Kliknij link** - menu zamyka się automatycznie
- ✅ **Kliknij overlay** - menu zamyka się
- ✅ **Kliknij X** - menu zamyka się

### 3. **Breakpointy do testowania:**
- **Desktop**: > 768px - normalna nawigacja
- **Tablet/Mobile**: ≤ 768px - burger menu

### 4. **Orientacja:**
- **Pionowa** - burger menu działa
- **Pozioma** - burger menu działa

## Struktura kodu

### **App.jsx:**
```javascript
// Stan burger menu
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Burger button
<button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
  <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
    <span></span>
    <span></span>
    <span></span>
  </span>
</button>

// Menu z klasą warunkową
<div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
```

### **App.css:**
```css
/* Hamburger animacja */
.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}
.hamburger.active span:nth-child(2) {
  opacity: 0;
}
.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Mobile menu */
.nav-links.mobile-open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}
```

## Problemy do rozwiązania w przyszłości

1. **Keyboard navigation** - obsługa klawiatury
2. **Focus management** - zarządzanie fokusem
3. **ARIA attributes** - lepsze wsparcie dla screen readerów
4. **Swipe gestures** - gesty dotykowe
5. **Animation performance** - optymalizacja animacji

## Zakończenie

Burger menu jest teraz w pełni funkcjonalne i responsywne. Menu automatycznie się pokazuje na urządzeniach mobilnych i zapewnia doskonałe UX dla użytkowników.

