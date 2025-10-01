# Automatyczne Przypomnienia SMS

## Opis funkcjonalności

System automatycznie wysyła cykliczne przypomnienia SMS do klientów na podstawie statusu ich opinii. Przypomnienia są wysyłane zgodnie z ustawieniami użytkownika w aplikacji.

## Jak to działa?

### 1. Scheduler w tle
- Aplikacja uruchamia scheduler APScheduler, który sprawdza co godzinę, czy są klienci wymagający przypomnienia
- Scheduler działa automatycznie w tle po uruchomieniu serwera backendu

### 2. Logika wysyłania przypomnień

System sprawdza każdego klienta i wysyła SMS, gdy:

#### Pierwszy SMS (status: `not_sent`)
- Klient nigdy nie otrzymał SMS-a
- Pole `last_sms_sent` jest puste
- System wysyła pierwszy SMS z linkiem do opinii

#### Przypomnienia (status: `sent` lub `opened`)
- Klient już otrzymał SMS, ale nie ukończył recenzji
- Minęła liczba dni określona w `reminderFrequency` (domyślnie 7 dni)
- System wysyła kolejne przypomnienie

#### Brak wysyłania (status: `completed`)
- Klient ukończył recenzję
- System nie wysyła więcej przypomnień

### 3. Wymagane ustawienia użytkownika

Aby automatyczne przypomnienia działały, użytkownik musi:
1. Skonfigurować Twilio w ustawieniach (Account SID, Auth Token, numer telefonu)
2. Włączyć opcję `autoSendEnabled` w ustawieniach wiadomości
3. Ustawić częstotliwość przypomnień `reminderFrequency` (w dniach)
4. Skonfigurować szablon wiadomości `messageTemplate`

## Pola w bazie danych

### Nowe pole: `last_sms_sent`
- Typ: `datetime` (opcjonalne)
- Przechowuje datę i czas ostatniego wysłanego SMS
- Używane do obliczania, czy należy wysłać następne przypomnienie

### Statusy recenzji (`review_status`)
- `not_sent` - SMS nigdy nie został wysłany
- `sent` - SMS został wysłany, ale link nie został otwarty
- `opened` - Link został otwarty, ale recenzja nie została ukończona
- `completed` - Recenzja została ukończona

## API Endpoints

### 1. POST `/reminders/send-now`
Ręcznie uruchamia proces wysyłania przypomnień (niezależnie od schedulera).

**Odpowiedź:**
```json
{
  "success": true,
  "message": "Proces wysyłania przypomnień zakończony",
  "result": {
    "reminders_sent": 5
  }
}
```

### 2. GET `/reminders/status`
Sprawdza status schedulera i zaplanowanych zadań.

**Odpowiedź:**
```json
{
  "scheduler_running": true,
  "jobs": [
    {
      "id": "check_reminders",
      "name": "Sprawdzanie i wysyłanie przypomnień SMS",
      "next_run": "2025-10-01T15:00:00",
      "trigger": "interval[1:00:00]"
    }
  ]
}
```

## Przykładowy scenariusz

1. **Dzień 0**: Klient zostaje dodany do systemu
   - `review_status`: `not_sent`
   - `last_sms_sent`: `null`

2. **Dzień 0 (po pierwszym sprawdzeniu schedulera)**:
   - System wysyła pierwszy SMS
   - `review_status`: `sent`
   - `last_sms_sent`: `2025-10-01 10:00:00`

3. **Dzień 1-6**: 
   - System sprawdza, ale nie wysyła (nie minęło 7 dni)

4. **Dzień 7** (jeśli klient nie ukończył recenzji):
   - System wysyła przypomnienie
   - `review_status`: pozostaje `sent` lub `opened`
   - `last_sms_sent`: `2025-10-08 10:00:00`

5. **Dzień 14** (jeśli nadal nie ukończył):
   - System wysyła kolejne przypomnienie
   - Proces powtarza się co 7 dni (lub zgodnie z `reminderFrequency`)

6. **Gdy klient ukończy recenzję**:
   - `review_status`: `completed`
   - Przypomnienia przestają być wysyłane

## Konfiguracja częstotliwości sprawdzania

Domyślnie scheduler sprawdza klientów co godzinę. Możesz zmienić to w pliku `backend_main.py`:

```python
scheduler.add_job(
    run_async_check_and_send_reminders,
    'interval',
    hours=1,  # Zmień tę wartość
    id='check_reminders',
    name='Sprawdzanie i wysyłanie przypomnień SMS',
    replace_existing=True
)
```

## Logi

System loguje wszystkie operacje związane z przypomnieniami:
- `🔄 Rozpoczęcie sprawdzania przypomnień SMS...`
- `✅ Automatyczne przypomnienia włączone (częstotliwość: X dni)`
- `📤 Pierwszy SMS dla: [nazwa klienta]`
- `🔔 Przypomnienie dla: [nazwa klienta] (ostatni SMS: X dni temu)`
- `📱 Wysyłanie przypomnienia SMS do: [nazwa] ([telefon])`
- `✅ Przypomnienie wysłane do: [nazwa klienta]`
- `✅ Sprawdzanie zakończone. Wysłano X przypomnień`

## Uwagi

1. Scheduler uruchamia się automatycznie przy starcie serwera
2. Przypomnienia są wysyłane tylko dla użytkowników z włączonym `autoSendEnabled`
3. System pomija klientów bez numeru telefonu lub kodu recenzji
4. Każde przypomnienie aktualizuje pole `last_sms_sent`
5. Koszty SMS są związane z limitem Twilio użytkownika

