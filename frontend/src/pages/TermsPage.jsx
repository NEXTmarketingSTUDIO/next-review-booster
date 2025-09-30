import React from 'react';
import './TermsPage.css';

const TermsPage = () => {
  return (
    <div className="terms-page">
      <div className="container">
        <div className="terms-content">
          <h1>Regulamin NEXT reviews BOOSTER</h1>
          
          <div className="terms-section">
            <h2>§ 1. Postanowienia ogólne</h2>
            <p>
              1. Niniejszy Regulamin określa zasady korzystania z platformy NEXT reviews BOOSTER dostępnej pod domeną next-reviews-booster.com.
            </p>
            <p>
              2. Operatorem platformy NEXT reviews BOOSTER jest NEXT marketing STUDIO, kontakt: kontakt@next-reviews-booster.com.
            </p>
            <p>
              3. Regulamin jest dostępny na stronie internetowej platformy w sposób umożliwiający jego pobranie, odtworzenie i utrwalenie.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 2. Definicje</h2>
            <p>
              1. <strong>Platforma</strong> - serwis internetowy NEXT reviews BOOSTER dostępny pod domeną next-reviews-booster.com
            </p>
            <p>
              2. <strong>Użytkownik</strong> - osoba fizyczna, prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, która korzysta z Platformy
            </p>
            <p>
              3. <strong>Konto</strong> - indywidualny panel użytkownika w Platformie
            </p>
            <p>
              4. <strong>Usługa</strong> - funkcjonalności oferowane przez Platformę, w tym zarządzanie bazą Klientów, generowanie kodów QR, wysyłanie wiadomości SMS, zbieranie recenzji
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 3. Warunki korzystania z Platformy</h2>
            <p>
              1. Korzystanie z Platformy jest bezpłatne w ramach planu Starter (do 50 recenzji miesięcznie).
            </p>
            <p>
              2. Dostęp do rozszerzonych funkcji wymaga wykupienia planu płatnego (Professional lub Enterprise).
            </p>
            <p>
              3. Użytkownik zobowiązuje się do:
            </p>
            <ul>
              <li>podania prawdziwych danych podczas rejestracji,</li>
              <li>zachowania poufności danych dostępowych do konta,</li>
              <li>nieudostępniania konta osobom trzecim,</li>
              <li>przestrzegania przepisów prawa podczas korzystania z Platformy.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>§ 4. Rejestracja i konto użytkownika</h2>
            <p>
              1. Rejestracja na Platformie jest dobrowolna i bezpłatna.
            </p>
            <p>
              2. Do rejestracji wymagane jest podanie:
            </p>
            <ul>
              <li>imienia i nazwiska,</li>
              <li>adresu e-mail,</li>
              <li>hasła.</li>
            </ul>
            <p>
              3. Użytkownik może utworzyć profil firmy poprzez podanie jej nazwy.
            </p>
            <p>
              4. Użytkownik ponosi odpowiedzialność za wszystkie działania wykonywane za pomocą jego konta.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 5. Funkcjonalności Platformy</h2>
            
            <h3>5.1. Zarządzanie bazą Klientów</h3>
            <ul>
              <li>Użytkownik może dodawać, edytować i usuwać dane swoich Klientów</li>
              <li>Dane obejmują: imię, numer telefonu, notatki, datę wizyty</li>
              <li>Użytkownik ponosi pełną odpowiedzialność za legalność przetwarzania danych Klientów</li>
            </ul>

            <h3>5.2. Wysyłanie wiadomości SMS</h3>
            <ul>
              <li>Platforma umożliwia wysyłanie spersonalizowanych wiadomości SMS do Klientów</li>
              <li>Wiadomości zawierają link do formularza opinii</li>
              <li>Użytkownik ponosi odpowiedzialność za uzyskanie zgód na wysyłanie SMS-ów</li>
            </ul>

            <h3>5.3. Generowanie kodów QR</h3>
            <ul>
              <li>Platforma umożliwia generowanie kodów QR kierujących do formularza opinii</li>
              <li>Kody QR mogą być umieszczane w lokalu Użytkownika</li>
              <li>Użytkownik ponosi odpowiedzialność za zgodność z przepisami prawa</li>
            </ul>

            <h3>5.4. Zbieranie recenzji</h3>
            <ul>
              <li>Klienci mogą wystawiać recenzje poprzez skanowanie kodów QR lub linki SMS</li>
              <li>System filtruje recenzje: pozytywne (4-5 gwiazdek) vs negatywne (1-3 gwiazdki)</li>
              <li>Użytkownik ma kontrolę nad publikowaniem recenzji</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>§ 6. Płatności i rozliczenia</h2>
            <p>
              1. Płatne plany są dostępne w następujących wariantach:
            </p>
            <ul>
              <li><strong>Professional</strong>: 99 zł/miesiąc - nielimitowane recenzje, zaawansowane funkcje</li>
              <li><strong>Enterprise</strong>: 299 zł/miesiąc - wszystkie funkcje + integracje + wsparcie priorytetowe</li>
            </ul>
            <p>
              2. Płatności są pobierane z góry za okres rozliczeniowy.
            </p>
            <p>
              3. Użytkownik może anulować subskrypcję w każdej chwili.
            </p>
            <p>
              4. W przypadku anulowania subskrypcji, dostęp do płatnych funkcji wygasa na koniec okresu rozliczeniowego.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 7. Odpowiedzialność</h2>
            <p>
              1. Użytkownik ponosi pełną odpowiedzialność za:
            </p>
            <ul>
              <li>legalność przetwarzania danych osobowych swoich klientów,</li>
              <li>uzyskanie odpowiednich zgód na zbieranie opinii,</li>
              <li>zgodność z przepisami RODO i innymi przepisami prawa,</li>
              <li>treść i sposób wykorzystania recenzji.</li>
            </ul>
            <p>
              2. NEXT reviews BOOSTER nie ponosi odpowiedzialności za:
            </p>
            <ul>
              <li>nieprawidłowe wykorzystanie Platformy przez Użytkownika,</li>
              <li>naruszenie przepisów prawa przez Użytkownika,</li>
              <li>szkody wynikające z nieprawidłowego przetwarzania danych przez Użytkownika.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>§ 8. Ochrona danych osobowych</h2>
            <p>
              1. Zasady przetwarzania danych osobowych określa Polityka Prywatności dostępna na Platformie.
            </p>
            <p>
              2. Użytkownik zobowiązuje się do przestrzegania przepisów RODO w zakresie przetwarzania danych swoich Klientów.
            </p>
            <p>
              3. NEXT reviews BOOSTER pełni rolę procesora danych działającego na zlecenie Użytkownika.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 9. Własność intelektualna</h2>
            <p>
              1. Wszystkie prawa do Platformy, w tym prawa autorskie, znaki towarowe i inne prawa własności intelektualnej, należą do NEXT marketing STUDIO.
            </p>
            <p>
              2. Użytkownik nie nabywa żadnych praw własności intelektualnej do Platformy.
            </p>
            <p>
              3. Użytkownik może korzystać z Platformy wyłącznie w zakresie określonym w niniejszym Regulaminie.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 10. Zakazane działania</h2>
            <p>Użytkownikowi zabrania się:</p>
            <ul>
              <li>Próby naruszenia bezpieczeństwa Platformy</li>
              <li>Wykorzystywania Platformy do celów niezgodnych z prawem</li>
              <li>Przesyłania treści naruszających prawa osób trzecich</li>
              <li>Próby odwrócenia inżynierii oprogramowania</li>
              <li>Wykorzystywania Platformy do spamu lub innych działań szkodliwych</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>§ 11. Zawieszenie i zakończenie usługi</h2>
            <p>
              1. NEXT reviews BOOSTER może zawiesić lub zakończyć świadczenie usługi w przypadku:
            </p>
            <ul>
              <li>naruszenia niniejszego Regulaminu,</li>
              <li>niepłacenia należności,</li>
              <li>działań szkodliwych dla Platformy lub innych użytkowników.</li>
            </ul>
            <p>
              2. Użytkownik może zakończyć korzystanie z Platformy w każdej chwili poprzez usunięcie konta.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 12. Reklamacje</h2>
            <p>
              1. Reklamacje dotyczące funkcjonowania Platformy można składać na adres: kontakt@next-reviews-booster.com
            </p>
            <p>
              2. Reklamacje będą rozpatrywane w terminie 14 dni roboczych.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 13. Zmiany Regulaminu</h2>
            <p>
              1. NEXT reviews BOOSTER zastrzega sobie prawo do wprowadzania zmian w Regulaminie.
            </p>
            <p>
              2. O zmianach użytkownicy będą informowani z 14-dniowym wyprzedzeniem.
            </p>
            <p>
              3. Dalsze korzystanie z Platformy po wprowadzeniu zmian oznacza akceptację nowego Regulaminu.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 14. Prawo właściwe</h2>
            <p>
              1. Niniejszy Regulamin podlega prawu polskiemu.
            </p>
            <p>
              2. Wszelkie spory będą rozstrzygane przez sądy właściwe dla siedziby NEXT marketing STUDIO.
            </p>
          </div>

          <div className="terms-section">
            <h2>§ 15. Postanowienia końcowe</h2>
            <p>
              1. W przypadku niezgodności między wersją polską a innymi wersjami językowymi Regulaminu, wiążąca jest wersja polska.
            </p>
            <p>
              2. Jeżeli którekolwiek postanowienie niniejszego Regulaminu okaże się nieważne lub niemożliwe do wykonania, pozostałe postanowienia zachowują swoją ważność.
            </p>
            <p>
              3. Regulamin wchodzi w życie z dniem 1 października 2025 r.
            </p>
          </div>

          <div className="terms-footer">
            <p><strong>Data ostatniej aktualizacji:</strong> 2025-10-01</p>
            <p><strong>Wersja:</strong> 1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
