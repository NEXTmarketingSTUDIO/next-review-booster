import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HelpPage.css';

const HelpPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const helpSections = [
    {
      id: 'getting-started',
      title: '🚀 Rozpoczęcie pracy z platformą',
      icon: '🎯',
      content: (
        <div>
          <h3>Witaj w Next Reviews Booster!</h3>
          <p>Ta platforma pomoże Ci automatycznie zbierać opinie od klientów poprzez wysyłanie SMS-ów z linkami do formularzy ocen.</p>
          
          <div className="help-step">
            <h4>📋 Krok 1: Konfiguracja podstawowa</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/settings">Ustawienia</Link></li>
              <li>Wypełnij swoje dane osobowe i dane firmy</li>
              <li>Dodaj link do swojej wizytówki Google My Business</li>
              <li>Zapisz ustawienia</li>
            </ol>
          </div>

          <div className="help-step">
            <h4>📱 Krok 2: Konfiguracja SMS-ów</h4>
            <ol>
              <li>W sekcji "Konfiguracja Twilio" dodaj swoje dane</li>
              <li>Ustaw szablon wiadomości SMS</li>
              <li>Wybierz częstotliwość wysyłania przypomnień</li>
              <li>Włącz automatyczne wysyłanie (opcjonalnie)</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'add-client',
      title: '👥 Jak dodać pierwszego klienta',
      icon: '📝',
      content: (
        <div>
          <h3>Dodawanie klientów do bazy</h3>
          <p>Każdy klient otrzyma unikalny link do wystawienia opinii.</p>
          
          <div className="help-step">
            <h4>📋 Procedura dodawania klienta:</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/customers">Twoi Klienci</Link></li>
              <li>Kliknij przycisk "+" (dodaj klienta)</li>
              <li>Wypełnij formularz:
                <ul>
                  <li><strong>Imię</strong> - wymagane</li>
                  <li><strong>Telefon</strong> - do wysyłania SMS-ów</li>
                  <li><strong>Notatka</strong> - opcjonalne</li>
                </ul>
              </li>
              <li>Kliknij "Dodaj klienta"</li>
              <li>System automatycznie wygeneruje unikalny kod recenzji</li>
            </ol>
          </div>

          <div className="help-tip">
            <strong>💡 Wskazówka:</strong> Każdy klient otrzyma unikalny link do formularza ocen, który możesz udostępnić na różne sposoby.
          </div>
        </div>
      )
    },
    {
      id: 'send-sms',
      title: '📱 Jak wysłać SMS do klienta',
      icon: '📲',
      content: (
        <div>
          <h3>Wysyłanie SMS-ów z linkami do opinii</h3>
          <p>Możesz wysyłać SMS-y pojedynczo lub do wszystkich klientów na raz.</p>
          
          <div className="help-step">
            <h4>📋 Wysyłanie do pojedynczego klienta:</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/customers">Twoi Klienci</Link></li>
              <li>Znajdź klienta na liście</li>
              <li>Kliknij ikonę telefonu 📱 obok klienta</li>
              <li>Potwierdź wysłanie</li>
              <li>Klient otrzyma SMS z linkiem do formularza ocen</li>
            </ol>
          </div>

          <div className="help-step">
            <h4>📋 Wysyłanie do wszystkich klientów:</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/customers">Twoi Klienci</Link></li>
              <li>Kliknij przycisk "📱 Wyślij do wszystkich"</li>
              <li>System wyśle SMS-y do klientów o statusie różnym od "completed"</li>
              <li>Otrzymasz raport z wynikami</li>
            </ol>
          </div>

          <div className="help-tip">
            <strong>⚠️ Ważne:</strong> Upewnij się, że w ustawieniach masz skonfigurowane Twilio przed wysyłaniem SMS-ów.
          </div>
        </div>
      )
    },
    {
      id: 'message-template',
      title: '✏️ Ustawianie treści wiadomości',
      icon: '📝',
      content: (
        <div>
          <h3>Personalizacja wiadomości SMS</h3>
          <p>Możesz dostosować treść wiadomości SMS do swoich potrzeb.</p>
          
          <div className="help-step">
            <h4>📋 Konfiguracja szablonu wiadomości:</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/settings">Ustawienia</Link></li>
              <li>W sekcji "Opcje wysyłki wiadomości" znajdź pole "Treść wiadomości"</li>
              <li>Edytuj szablon według potrzeb</li>
              <li>Użyj dostępnych zmiennych:
                <ul>
                  <li><code>[LINK]</code> - automatycznie zastąpiony linkiem do formularza ocen</li>
                  <li><code>[NAZWA_FIRMY]</code> - automatycznie zastąpiony nazwą Twojej firmy</li>
                </ul>
              </li>
              <li>Zapisz ustawienia</li>
            </ol>
          </div>

          <div className="help-example">
            <h4>📝 Przykład szablonu:</h4>
            <div className="code-block">
              <pre>{`Dzień dobry!

Chciałbym przypomnieć o możliwości 
wystawienia opinii o naszych usługach.
Wasza opinia jest dla nas bardzo ważna.

Link do wystawienia opinii: [LINK]

Z góry dziękuję!

Z poważaniem,
[NAZWA_FIRMY]`}</pre>
            </div>
          </div>

          <div className="help-tip">
            <strong>💡 Wskazówka:</strong> Wiadomość powinna być krótka, przyjazna i zawierać jasne wezwanie do działania.
          </div>
        </div>
      )
    },
    {
      id: 'company-data',
      title: '🏢 Dodawanie danych firmy',
      icon: '🏢',
      content: (
        <div>
          <h3>Konfiguracja informacji o firmie</h3>
          <p>Dane firmy są używane w wiadomościach SMS i formularzach ocen.</p>
          
          <div className="help-step">
            <h4>📋 Uzupełnianie danych firmy:</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/settings">Ustawienia</Link></li>
              <li>W sekcji "Dane użytkownika" wypełnij:
                <ul>
                  <li><strong>Imię i nazwisko</strong> - Twoje dane</li>
                  <li><strong>Email</strong> - adres kontaktowy</li>
                  <li><strong>Nazwa firmy</strong> - nazwa Twojej działalności</li>
                  <li><strong>Wizytówka Google</strong> - link do Google My Business</li>
                </ul>
              </li>
              <li>Zapisz ustawienia</li>
            </ol>
          </div>

          <div className="help-step">
            <h4>🔗 Link do wizytówki Google:</h4>
            <ol>
              <li>Przejdź do Google My Business</li>
              <li>Zaloguj się na swoje konto</li>
              <li>Wybierz swoją firmę</li>
              <li>Kliknij "Uzyskaj więcej opinii"</li>
              <li>Skopiuj link do udostępnienia</li>
              <li>Wklej link w pole "Wizytówka Google"</li>
            </ol>
          </div>

          <div className="help-example">
            <h4>📝 Przykład linku:</h4>
            <div className="code-block">
              <pre>https://g.page/TwojaFirma/review</pre>
            </div>
          </div>

          <div className="help-tip">
            <strong>💡 Wskazówka:</strong> Link do Google My Business pozwoli klientom łatwo znaleźć Twoją firmę i wystawić opinię.
          </div>
        </div>
      )
    },
    {
      id: 'qr-codes',
      title: '🔲 Generowanie kodów QR',
      icon: '📱',
      content: (
        <div>
          <h3>Tworzenie kodów QR do udostępniania</h3>
          <p>Kody QR ułatwiają klientom dostęp do formularza ocen.</p>
          
          <div className="help-step">
            <h4>📋 Generowanie kodu QR:</h4>
            <ol>
              <li>Przejdź do <Link to="/dashboard/review-links">Wygeneruj kody QR</Link></li>
              <li>Wybierz rozmiar kodu (50-1000 pikseli)</li>
              <li>Kliknij "Generuj kod QR"</li>
              <li>Pobierz lub skopiuj kod QR</li>
              <li>Użyj go w materiałach promocyjnych, wizytówkach, itp.</li>
            </ol>
          </div>

          <div className="help-tip">
            <strong>💡 Wskazówka:</strong> Kod QR prowadzi bezpośrednio do formularza logowania klienta, gdzie może podać swoje dane.
          </div>
        </div>
      )
    },
    {
      id: 'statistics',
      title: '📊 Śledzenie wyników',
      icon: '📈',
      content: (
        <div>
          <h3>Monitorowanie skuteczności kampanii</h3>
          <p>Sprawdzaj statystyki i analizuj wyniki swoich działań.</p>
          
          <div className="help-step">
            <h4>📋 Dostępne statystyki:</h4>
            <ul>
              <li><strong>Łączna liczba klientów</strong> - wszystkich dodanych klientów</li>
              <li><strong>Wystawione opinie</strong> - klienci którzy ukończyli formularz</li>
              <li><strong>Wysłane SMS-y</strong> - liczba wysłanych wiadomości</li>
              <li><strong>Wskaźnik konwersji</strong> - procent klientów którzy wystawili opinię</li>
            </ul>
          </div>

          <div className="help-step">
            <h4>📋 Statusy klientów:</h4>
            <ul>
              <li><strong>not_sent</strong> - SMS jeszcze nie wysłany</li>
              <li><strong>sent</strong> - SMS wysłany, czekamy na odpowiedź</li>
              <li><strong>opened</strong> - klient otworzył link do formularza</li>
              <li><strong>completed</strong> - klient wystawił opinię</li>
            </ul>
          </div>

          <div className="help-tip">
            <strong>💡 Wskazówka:</strong> Regularnie sprawdzaj statystyki, aby ocenić skuteczność swoich działań.
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: '🔧 Rozwiązywanie problemów',
      icon: '🛠️',
      content: (
        <div>
          <h3>Najczęstsze problemy i rozwiązania</h3>
          
          <div className="help-issue">
            <h4>❌ SMS-y nie są wysyłane</h4>
            <p><strong>Przyczyny:</strong></p>
            <ul>
              <li>Błędne dane Twilio (Account SID, Auth Token)</li>
              <li>Brak środków na koncie Twilio</li>
              <li>Nieprawidłowy format numeru telefonu</li>
            </ul>
            <p><strong>Rozwiązanie:</strong> Sprawdź konfigurację Twilio w ustawieniach.</p>
          </div>

          <div className="help-issue">
            <h4>❌ Klient nie może otworzyć formularza</h4>
            <p><strong>Przyczyny:</strong></p>
            <ul>
              <li>Błędny link w wiadomości SMS</li>
              <li>Problem z połączeniem internetowym klienta</li>
              <li>Błędny kod recenzji</li>
            </ul>
            <p><strong>Rozwiązanie:</strong> Sprawdź czy link jest poprawny i działa.</p>
          </div>

          <div className="help-issue">
            <h4>❌ Automatyczne wysyłanie nie działa</h4>
            <p><strong>Przyczyny:</strong></p>
            <ul>
              <li>Automatyczne wysyłanie jest wyłączone</li>
              <li>Błędna konfiguracja częstotliwości</li>
              <li>Problem z schedulerem</li>
            </ul>
            <p><strong>Rozwiązanie:</strong> Sprawdź ustawienia automatycznego wysyłania.</p>
          </div>

          <div className="help-tip">
            <strong>📞 Kontakt:</strong> W przypadku problemów technicznych skontaktuj się z administratorem platformy.
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="help-page">
      <div className="container">
        <div className="help-header">
          <h1>📚 Centrum pomocy</h1>
          <p>Dowiedz się jak efektywnie korzystać z platformy Next Reviews Booster</p>
        </div>

        <div className="help-content">
          {helpSections.map((section) => (
            <div key={section.id} className="help-section">
              <button
                className={`help-section-header ${expandedSection === section.id ? 'expanded' : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="section-title">
                  <span className="section-icon">{section.icon}</span>
                  <span className="section-text">{section.title}</span>
                </div>
                <svg 
                  className={`expand-icon ${expandedSection === section.id ? 'rotated' : ''}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              
              {expandedSection === section.id && (
                <div className="help-section-content">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="help-footer">
          <div className="help-footer-content">
            <h3>🤝 Potrzebujesz dodatkowej pomocy?</h3>
            <p>Jeśli nie znalazłeś odpowiedzi na swoje pytanie, skontaktuj się z nami:</p>
            <div className="contact-info">
              <p>📧 Email: kontakt@next-reviews-booster.com</p>
              <p>📞 Telefon: +48 730 004 440</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
