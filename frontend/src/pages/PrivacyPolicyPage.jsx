import React from 'react';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="privacy-policy-page">
      <div className="container">
        <div className="policy-content">
          <h1>Polityka Prywatności NEXT reviews BOOSTER</h1>
          
          <div className="policy-section">
            <p className="intro">
              Niniejsza Polityka Prywatności opisuje zasady przetwarzania danych osobowych przez platformę NEXT reviews BOOSTER, 
              dostępną pod domeną www.next-reviews-booster.com, której właścicielem i operatorem jest NEXT marketing STUDIO, 
              kontakt: kontakt@next-reviews-booster.com.
            </p>
          </div>

            <div className="policy-section">
              <h2>1. Proces rejestracji</h2>  
              <p>
                Aby rozpocząć korzystanie z platformy NEXT reviews BOOSTER, użytkownik musi utworzyć konto użytkownika. 
                Podczas rejestracji wymagane jest podanie podstawowych danych osobowych: imienia, nazwiska oraz adresu e-mail, 
                a także utworzenie bezpiecznego hasła dostępu.
              </p>
              <p>
                Dodatkowo, użytkownik ma możliwość utworzenia profilu swojej firmy, podając jej nazwę wyświetlaną w systemie. 
                Nie jest wymagana pełna nazwa prawna - wystarczy nazwa, która będzie widoczna w panelu administracyjnym.
              </p>
            </div>

          <div className="policy-section">
            <h2>2. Zarządzanie bazą klientów</h2>
            <p>
              Użytkownik może tworzyć i zarządzać bazą swoich klientów poprzez podanie:
            </p>
            <ul>
              <li>imienia Klienta,</li>
              <li>numeru telefonu Klienta,</li>
              <li>notatek o Kliencie,</li>
              <li>data wizyty Klienta.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>3. Generowanie kodów QR</h2>
            <p>
              Platforma NEXT reviews BOOSTER umożliwia generowanie kodów QR, które prowadzą Klientów bezpośrednio do
              formularza opinii na naszej platformie. Po przesłaniu oceny Klient otrzymuje potwierdzenie jej złożenia,
              a Użytkownik otrzymuje informację zwrotną w panelu administracyjnym.
            </p>
          </div>

          <div className="policy-section">
            <h2>4. Kanały wystawiania opinii</h2>
            <p>Platforma NEXT reviews BOOSTER oferuje dwa główne kanały, przez które Klienci mogą wystawiać opinie:</p>
            
            <h3>4.1. Kanał QR Code</h3>
            <p>Klienci skanują kod QR umieszczony w lokalu, co prowadzi ich do formularza logowania, gdzie wypełniają:</p>
            <ul>
              <li>imię,</li>
              <li>numer telefonu,</li>
              <li>następnie przechodzą do formularza opinii, gdzie mogą wystawić ocenę w skali 1-5 gwiazdek oraz dodać komentarz tekstowy.</li>
            </ul>
            
            <h3>4.2. Kanał SMS</h3>
            <p>Klienci otrzymują wiadomość SMS z linkiem do formularza opinii, gdzie mogą bezpośrednio:</p>
            <ul>
              <li>wystawić ocenę w skali 1-5 gwiazdek,</li>
              <li>dodać komentarz tekstowy,</li>
            </ul>
            
            <p>W obu przypadkach, po złożeniu opinii, Klient otrzymuje potwierdzenie, a Użytkownik informację zwrotną w panelu administracyjnym.</p>
          </div>

          <div className="policy-section">
            <h2>5. Odpowiedzialność za dane</h2>
            <p>
              W ramach korzystania z platformy NEXT reviews BOOSTER, <b>Użytkownik zachowuje status administratora danych osobowych 
              swoich Klientów</b> i jest wyłącznie odpowiedzialny za zgodne z prawem przetwarzanie tych danych. 
              <b>Obejmuje to obowiązek uzyskania od Klientów odpowiednich zgód na zbieranie i przetwarzanie ich danych osobowych</b>
              w celu wystawiania opinii.
            </p>
            <p>
              <b>NEXT reviews BOOSTER działa tylko i wyłącznie jako procesor danych (podmiot przetwarzający)</b> na zlecenie Użytkownika 
              zgodnie z art. 28 RODO. <b>Platforma nie jest administratorem danych osobowych Klientów Użytkownika </b>
               i nie rości sobie żadnych praw własności do tych danych.
            </p>
          </div>

          <div className="policy-section">
            <h2>6. Cel przetwarzania danych</h2>
            <p>
              Platforma NEXT reviews BOOSTER przetwarza dane osobowe Klientów wyłącznie w celu wysyłania spersonalizowanych 
              wiadomości SMS z prośbą o opinię po odbyciu wizyty. Dane są wykorzystywane jedynie do personalizacji treści 
              wiadomości (imię Klienta, nazwa firmy Użytkownika) oraz do zapewnienia prawidłowej dostawy wiadomości.
            </p>
          </div>

          <div className="policy-section">
            <h2>7. Pliki cookies</h2>
            <p>Platforma NEXT reviews BOOSTER wykorzystuje pliki cookies w celu:</p>
            <ul>
              <li>zapewnienia prawidłowego działania serwisu (np. sesje logowania),</li>
              <li>analizy ruchu na stronie (np. Google Analytics),</li>
              <li>poprawy komfortu użytkowania.</li>
            </ul>
            <p>
              Użytkownik może zarządzać ustawieniami cookies w swojej przeglądarce internetowej. 
              Korzystanie z serwisu oznacza zgodę na zapisywanie cookies zgodnie z ustawieniami przeglądarki.
            </p>
          </div>

          <div className="policy-section">
            <h2>8. Bezpieczeństwo danych</h2>
            <p>
              NEXT reviews BOOSTER wdraża odpowiednie środki techniczne i organizacyjne, aby chronić dane przed 
              nieautoryzowanym dostępem, utratą lub zniszczeniem, w tym:
            </p>
            <ul>
              <li>szyfrowanie danych w trakcie przesyłania,</li>
              <li>bezpieczne przechowywanie danych,</li>
              <li>regularne kopie zapasowe,</li>
              <li>kontrola dostępu do danych.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>9. Prawa użytkownika</h2>
            <p>Użytkownik ma prawo do:</p>
            <ul>
              <li>dostępu do swoich danych,</li>
              <li>ich poprawiania,</li>
              <li>usunięcia,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>przenoszenia danych,</li>
              <li>cofnięcia zgody na przetwarzanie.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>10. Kontakt</h2>
            <p>W sprawach związanych z polityką prywatności można skontaktować się z operatorem platformy:</p>
            <p>
              <strong>NEXT marketing STUDIO</strong><br />
              E-mail: kontakt@next-reviews-booster.com
            </p>
          </div>

          <div className="policy-section">
            <h2>11. Dostęp podmiotów trzecich</h2>
            <p>NEXT reviews BOOSTER może korzystać z usług zewnętrznych dostawców w celu:</p>
            <ul>
              <li>hostingu aplikacji,</li>
              <li>analizy ruchu na stronie,</li>
              <li>wysyłania powiadomień SMS.</li>
            </ul>
            <p>
              Wszyscy zewnętrzni dostawcy są zobowiązani do przestrzegania zasad RODO i zapewnienia 
              odpowiedniego poziomu bezpieczeństwa danych.
            </p>
          </div>

          <div className="policy-section">
            <h2>12. Przechowywanie danych</h2>
            <p>
              Dane klientów (imię, numer telefonu, recenzje, notatki) są przechowywane na serwerach NEXT reviews BOOSTER 
              tak długo, jak długo użytkownik utrzymuje konto i nie usunie danych samodzielnie. Użytkownik może 
              w każdej chwili usunąć dane ręcznie ze swojego panelu.
            </p>
            <p>Po usunięciu konta, dane są usuwane automatycznie w ciągu 30 dni.</p>
          </div>

          <div className="policy-section">
            <h2>13. Zmiany w polityce prywatności</h2>
            <p>NEXT reviews BOOSTER zastrzega sobie prawo do wprowadzania zmian w niniejszej polityce prywatności. O wszelkich zmianach użytkownicy będą informowani poprzez:</p>
            <ul>
              <li>powiadomienie w panelu użytkownika,</li>
              <li>email na adres podany podczas rejestracji,</li>
              <li>ogłoszenie na stronie internetowej.</li>
            </ul>
          </div>

          <div className="policy-section">
            <h2>14. Podstawa prawna</h2>
            <p>Przetwarzanie danych osobowych odbywa się na podstawie:</p>
            <ul>
              <li>Art. 6 ust. 1 lit. b RODO (wykonanie umowy) - w przypadku danych niezbędnych do świadczenia usługi,</li>
              <li>Art. 6 ust. 1 lit. a RODO (zgoda) - w przypadku danych opcjonalnych,</li>
              <li>Art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes) - w przypadku analizy ruchu na stronie.</li>
            </ul>
          </div>

          <div className="policy-footer">
            <p><strong>Data ostatniej aktualizacji:</strong> 2025-10-01</p>
            <p><strong>Wersja:</strong> 1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
