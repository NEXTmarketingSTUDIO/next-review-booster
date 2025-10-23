from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import uvicorn
import firebase_admin
from firebase_admin import credentials, firestore
import os
import secrets
import string
import qrcode
import io
import base64
from fastapi.responses import StreamingResponse
from twilio.rest import Client
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from enum import Enum

# Enum dla uprawnień użytkownika
class UserPermission(str, Enum):
    ADMIN = "Admin"
    STARTER = "Starter" 
    PROFESSIONAL = "Professional"
    DEMO = "Demo"

def get_sms_limit_for_permission(permission: UserPermission) -> int:
    limits = {
        UserPermission.ADMIN: 1000,        # Admin - nieograniczony praktycznie
        UserPermission.PROFESSIONAL: 200,  # Professional - 200 SMS
        UserPermission.STARTER: 50,       # Starter - 50 SMS  
        UserPermission.DEMO: 10            # Demo - 10 SMS
    }
    return limits.get(permission, 10)  # Domyślnie 10 dla nieznanych uprawnień

def check_sms_limit(username: str) -> dict:
    """Sprawdź czy użytkownik nie przekroczył limitu SMS"""
    try:
        # Pobierz ustawienia użytkownika
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            return {"allowed": False, "message": "Użytkownik nie istnieje"}
        
        settings_data = doc.to_dict()
        settings = UserSettings(**settings_data)
        
        # Pobierz limit z ustawień lub na podstawie uprawnień
        sms_limit = settings.messaging.smsLimit
        if sms_limit is None:
            sms_limit = get_sms_limit_for_permission(settings.permission)
        
        # Sprawdź czy trzeba zresetować limit (nowy miesiąc)
        current_month = datetime.now().strftime("%Y-%m")
        last_reset_month = settings_data.get("messaging", {}).get("lastResetMonth", "")
        
        if last_reset_month != current_month:
            # Nowy miesiąc - zresetuj limit
            reset_sms_limit_for_month(username, current_month, sms_limit)
        
        # Policz wysłane SMS w tym miesiącu
        sms_collection = db.collection(username).document("SMS").collection(current_month)
        sent_sms_count = len(list(sms_collection.stream()))
        
        print(f"📊 Limit SMS dla {username}: {sms_limit}, wysłane: {sent_sms_count}")
        
        if sent_sms_count >= sms_limit:
            return {
                "allowed": False, 
                "message": f"Przekroczono limit SMS ({sms_limit}). Wysłano: {sent_sms_count}",
                "limit": sms_limit,
                "sent": sent_sms_count
            }
        
        return {
            "allowed": True,
            "message": f"Limit SMS: {sms_limit}, wysłane: {sent_sms_count}",
            "limit": sms_limit,
            "sent": sent_sms_count,
            "remaining": sms_limit - sent_sms_count
        }
        
    except Exception as e:
        print(f"❌ Błąd podczas sprawdzania limitu SMS: {str(e)}")
        return {"allowed": False, "message": f"Błąd sprawdzania limitu: {str(e)}"}

def reset_sms_limit_for_month(username: str, current_month: str, sms_limit: int):
    """Zresetuj limit SMS dla nowego miesiąca"""
    try:
        print(f"🔄 Resetowanie limitu SMS dla {username} na miesiąc {current_month}")
        
        # Pobierz aktualne ustawienia
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            print(f"❌ Użytkownik {username} nie istnieje")
            return False
        
        settings_data = doc.to_dict()
        
        # Zaktualizuj ustawienia messaging
        if "messaging" not in settings_data:
            settings_data["messaging"] = {}
        
        settings_data["messaging"]["lastResetMonth"] = current_month
        settings_data["messaging"]["smsLimit"] = sms_limit
        settings_data["messaging"]["smsCount"] = 0  # Zresetuj licznik
        settings_data["updated_at"] = datetime.now().isoformat()
        
        # Zapisz zaktualizowane ustawienia
        doc_ref.set(settings_data)
        
        print(f"✅ Limit SMS zresetowany dla {username}: {sms_limit} SMS na miesiąc {current_month}")
        return True
        
    except Exception as e:
        print(f"❌ Błąd resetowania limitu SMS: {str(e)}")
        return False

def convert_firebase_timestamp_to_naive(timestamp):
    """Bezpiecznie konwertuj Firebase Timestamp na naive datetime"""
    if not timestamp:
        return None
    
    if hasattr(timestamp, 'to_pydatetime'):
        dt = timestamp.to_pydatetime()
        # Upewnij się, że to jest naive datetime (bez strefy czasowej)
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        return dt
    elif isinstance(timestamp, str):
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            # Upewnij się, że to jest naive datetime (bez strefy czasowej)
            if dt.tzinfo is not None:
                dt = dt.replace(tzinfo=None)
            return dt
        except:
            return None
    elif isinstance(timestamp, datetime):
        # Jeśli już jest datetime, upewnij się że jest naive
        if timestamp.tzinfo is not None:
            return timestamp.replace(tzinfo=None)
        return timestamp
    
    return None

def get_user_permission_from_db(username: str) -> UserPermission:
    """Pobierz uprawnienia użytkownika z bazy danych"""
    if not db:
        return UserPermission.DEMO
    
    try:
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if doc.exists:
            settings_data = doc.to_dict()
            settings = UserSettings(**settings_data)
            return settings.permission
        else:
            return UserPermission.DEMO  # Domyślnie Demo jeśli użytkownik nie istnieje
    except Exception as e:
        print(f"❌ Błąd podczas pobierania uprawnień dla {username}: {str(e)}")
        return UserPermission.DEMO

def check_user_permission(username: str, required_permission: UserPermission) -> bool:
    """Sprawdź czy użytkownik ma wymagane uprawnienia"""
    user_permission = get_user_permission_from_db(username)
    
    # Hierarchia uprawnień: Admin > Professional > Starter > Demo
    permission_hierarchy = {
        UserPermission.ADMIN: 4,
        UserPermission.PROFESSIONAL: 3,
        UserPermission.STARTER: 2,
        UserPermission.DEMO: 1
    }
    
    user_level = permission_hierarchy.get(user_permission, 1)
    required_level = permission_hierarchy.get(required_permission, 1)
    
    return user_level >= required_level

def ensure_user_exists(username: str, email: str = "", name: str = "", surname: str = "") -> bool:
    """Upewnij się, że użytkownik istnieje w bazie danych. Jeśli nie, utwórz go z domyślnymi danymi."""
    if not db:
        return False
    
    try:
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if doc.exists:
            print(f"✅ Użytkownik {username} już istnieje w bazie danych")
            return True
        
        print(f"🔄 Tworzenie rekordu dla użytkownika: {username}")
        
        # Utwórz nowy rekord użytkownika z domyślnymi danymi
        now = datetime.now()
        default_settings = UserSettings(
            userData=UserData(
                name=name,
                surname=surname,
                email=email,
                companyName="",
                googleCard=""
            ),
            messaging=MessagingSettings(
                reminderFrequency=7,
                messageTemplate="""Bardzo prosimy o zostawienie opinii o naszych usługach: [LINK]
Wasza opinia ma dla nas ogromne znaczenie i pomoże kolejnym klientom w wyborze.

Dziękujemy!""",
                autoSendEnabled=False
            ),
            twilio=TwilioSettings(
                account_sid="ACfc0d69a38f5b328bc7783fa5829336b2",
                auth_token="3d5761074605ac590f0c18494820d15f",
                phone_number="",
                messaging_service_sid="MG12792d6acd38447e77756a5ceb2c75f1"
            ),
            permission=UserPermission.DEMO  # Nowi użytkownicy domyślnie mają uprawnienia Demo
        )
        
        # Zapisz ustawienia do bazy danych
        settings_dict = default_settings.dict()
        settings_dict.update({
            "created_at": now,
            "updated_at": now
        })
        
        doc_ref.set(settings_dict)
        print(f"✅ Utworzono rekord użytkownika {username} z uprawnieniami Demo")
        return True
        
    except Exception as e:
        print(f"❌ Błąd podczas tworzenia rekordu użytkownika {username}: {str(e)}")
        return False

# Załaduj zmienne środowiskowe z pliku .env (jeśli istnieje)
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Załadowano zmienne środowiskowe z pliku .env")
except ImportError:
    print("⚠️ python-dotenv nie zainstalowany - używaj zmiennych systemowych")

# Inicjalizacja Twilio - będzie inicjalizowany per użytkownik z Firebase
twilio_client = None

# Inicjalizacja Firebase Admin
try:
    # Sprawdź czy Firebase jest już zainicjalizowany
    if not firebase_admin._apps:
        # Sprawdź czy istnieje plik z kluczem serwisowym (lokalne środowisko)
        if os.path.exists("next-reviews-9d19c-firebase-adminsdk-fbsvc-ffec0c49f4.json"):
            cred = credentials.Certificate("next-reviews-9d19c-firebase-adminsdk-fbsvc-ffec0c49f4.json")
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin SDK zainicjalizowany z pliku lokalnego")
        else:
            firebase_config = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID", "next-reviews-9d19c"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
                "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
                "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
                "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
            }
            
            # Sprawdź czy wszystkie wymagane zmienne są ustawione
            required_vars = ["FIREBASE_PRIVATE_KEY_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL", "FIREBASE_CLIENT_ID", "FIREBASE_CLIENT_X509_CERT_URL"]
            missing_vars = [var for var in required_vars if not os.getenv(var)]
            
            if missing_vars:
                print(f"⚠️ Brakujące zmienne środowiskowe: {missing_vars}")
                print("🔄 Próba inicjalizacji z domyślnymi poświadczeniami...")
                firebase_admin.initialize_app()
            else:
                cred = credentials.Certificate(firebase_config)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin SDK zainicjalizowany ze zmiennych środowiskowych")
        
        print("✅ Firebase Admin SDK zainicjalizowany pomyślnie")
    else:
        print("✅ Firebase Admin SDK już zainicjalizowany")
    
    db = firestore.client()
except Exception as e:
    print(f"❌ Błąd inicjalizacji Firebase: {e}")
    db = None

app = FastAPI(
    title="next review booster API", 
    version="1.0.0",
    description="API dla aplikacji next review booster - zarządzanie recenzjami"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://next-reviews-9d19c.web.app",  # Stara domena Firebase (backup)
        "https://next-reviews-booster-app.web.app",  # Nowa domena Firebase
        "https://next-reviews-booster.com",  # Docelowa domena
        "https://www.next-reviews-booster.com",  # Wariant z www
        "https://next-reviews-frontend.onrender.com",  # Frontend na Render
        "https://*.onrender.com"  # Wszystkie domeny Render
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
    version: str = "1.0.0"

# Modele danych dla klientów
class ClientCreate(BaseModel):
    name: str
    phone: str
    note: str = ""
    stars: int = 0
    review: str = ""
    review_code: str = ""
    review_status: str = "not_sent"
    last_sms_sent: Optional[datetime] = None
    sms_count: int = 0
    source: str = "CRM"

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    note: Optional[str] = None
    stars: Optional[int] = None
    review: Optional[str] = None
    review_code: Optional[str] = None
    review_status: Optional[str] = None
    last_sms_sent: Optional[datetime] = None
    sms_count: Optional[int] = None
    source: Optional[str] = None

class ClientResponse(BaseModel):
    id: str
    name: str
    phone: str
    note: str = ""
    stars: int = 0
    review: str = ""
    review_code: str = ""
    review_status: str = "not_sent"
    created_at: datetime
    updated_at: datetime
    last_sms_sent: Optional[datetime] = None
    sms_count: int = 0
    source: str = "CRM"

class ClientListResponse(BaseModel):
    clients: List[ClientResponse]
    total: int

# Modele dla ustawień użytkownika
class UserData(BaseModel):
    name: str
    surname: str
    email: str
    companyName: str = ""
    googleCard: str = ""


class TwilioSettings(BaseModel):
    account_sid: str = ""
    auth_token: str = ""
    phone_number: str = "" 
    messaging_service_sid: str = "" 

class MessagingSettings(BaseModel):
    reminderFrequency: int = 7
    messageTemplate: str = ""
    autoSendEnabled: bool = False  
    smsLimit: int = 10
    smsCount: int = 0  # Licznik wysłanych SMS

class UserSettings(BaseModel):
    userData: UserData
    messaging: MessagingSettings
    twilio: Optional[TwilioSettings] = None
    permission: UserPermission = UserPermission.DEMO  # Domyślnie Demo dla nowych użytkowników

class UserSettingsResponse(BaseModel):
    settings: UserSettings

# Modele dla formularza ocen
class ReviewSubmission(BaseModel):
    stars: int
    review: str

class ReviewResponse(BaseModel):
    success: bool
    message: str

# Modele dla kodów QR
class QRCodeRequest(BaseModel):
    size: int = 200
    format: str = "png"

class QRCodeResponse(BaseModel):
    qr_code: str
    company_name: str
    review_url: str

# Modele dla logowania klienta
class ClientLoginRequest(BaseModel):
    name: str
    phone: str
    note: str = ""
    stars: int = 0

class ClientLoginResponse(BaseModel):
    review_code: str
    message: str

# Modele dla SMS
class SMSRequest(BaseModel):
    to_phone: str
    message: str
    client_name: str = ""

class SMSResponse(BaseModel):
    success: bool
    message: str
    sid: Optional[str] = None

# Modele dla formularza kontaktowego
class ContactFormRequest(BaseModel):
    name: str
    email: str
    company: Optional[str] = ""
    message: str

class ContactFormResponse(BaseModel):
    success: bool
    message: str

# Funkcja do inicjalizacji Twilio dla konkretnego użytkownika
def get_twilio_client_for_user(username: str):
    """Pobierz klienta Twilio dla konkretnego użytkownika z Firebase"""
    if not db:
        return None
    
    try:
        # Pobierz ustawienia użytkownika
        settings_doc = db.collection(username).document("Dane").get()
        
        if not settings_doc.exists:
            print(f"⚠️ Brak ustawień dla użytkownika: {username}")
            return None
        
        settings_data = settings_doc.to_dict()
        
        # Sprawdź czy użytkownik ma skonfigurowane Twilio
        if "twilio" not in settings_data:
            print(f"⚠️ Użytkownik {username} nie ma skonfigurowanego Twilio")
            return None
        
        twilio_config = settings_data["twilio"]
        
        account_sid = twilio_config.get("account_sid")
        auth_token = twilio_config.get("auth_token")
        phone_number = twilio_config.get("phone_number")
        messaging_service_sid = twilio_config.get("messaging_service_sid")
        
        # Sprawdź czy mamy podstawowe dane (account_sid i auth_token są wymagane)
        if not all([account_sid, auth_token]):
            print(f"⚠️ Niekompletna konfiguracja Twilio dla użytkownika: {username}")
            return None
        
        # Sprawdź czy mamy messaging_service_sid (preferowane) lub phone_number (fallback)
        if not messaging_service_sid and not phone_number:
            print(f"⚠️ Brak messaging_service_sid ani phone_number dla użytkownika: {username}")
            return None
        
        # Utwórz klienta Twilio
        client = Client(account_sid, auth_token)
        print(f"✅ Twilio skonfigurowany dla użytkownika: {username}")
        
        return {
            "client": client,
            "phone_number": phone_number,
            "messaging_service_sid": messaging_service_sid
        }
        
    except Exception as e:
        print(f"❌ Błąd inicjalizacji Twilio dla użytkownika {username}: {e}")
        return None

# Funkcja do wysyłania SMS przez Twilio
async def send_sms(to_phone: str, message: str, twilio_config: dict, username: str = None) -> dict:
    """Wysyła SMS przez Twilio używając Messaging Service SID lub numeru telefonu"""
    if not twilio_config:
        raise HTTPException(status_code=500, detail="Twilio nie jest skonfigurowany")
    
    # Sprawdź limit SMS jeśli podano username
    if username:
        limit_check = check_sms_limit(username)
        if not limit_check["allowed"]:
            raise HTTPException(status_code=429, detail=limit_check["message"])
    
    try:
        client = twilio_config["client"]
        messaging_service_sid = twilio_config.get("messaging_service_sid")
        phone_number = twilio_config.get("phone_number")
        
        # Wyczyść numer telefonu (usuń spacje, myślniki)
        clean_phone = ''.join(filter(str.isdigit, to_phone))
        
        # Dodaj kod kraju jeśli nie ma
        if not clean_phone.startswith('48') and len(clean_phone) == 9:
            clean_phone = '48' + clean_phone
        elif clean_phone.startswith('+'):
            clean_phone = clean_phone[1:]  # Usuń +
        
        # Dodaj + na początku
        formatted_phone = '+' + clean_phone
        
        print(f"📱 Wysyłanie SMS do: {formatted_phone}")
        print(f"💬 Treść: {message}")
        
        # Użyj Messaging Service SID jeśli dostępny (preferowane), w przeciwnym razie użyj numeru telefonu
        if messaging_service_sid:
            print(f"📞 Używając Messaging Service SID: {messaging_service_sid}")
            # Dokładnie taka sama składnia jak w przykładzie Twilio SDK
            message_obj = client.messages.create(
                messaging_service_sid=messaging_service_sid,
                body=message,
                to=formatted_phone,
                status_callback=None  # Wyłącz callback URL
            )
        elif phone_number:
            print(f"📞 Używając numeru telefonu: {phone_number}")
            message_obj = client.messages.create(
                body=message,
                from_=phone_number,
                to=formatted_phone
            )
        else:
            raise HTTPException(status_code=500, detail="Brak konfiguracji nadawcy (messaging_service_sid lub phone_number)")
        
        print(f"✅ SMS wysłany pomyślnie. SID: {message_obj.sid}")
        
        # Zapisz informację o wysłanym SMS do bazy danych i zwiększ licznik
        if username:
            try:
                # Zapisz szczegóły SMS do kolekcji miesięcznej
                current_month = datetime.now().strftime("%Y-%m")
                sms_doc_ref = db.collection(username).document("SMS").collection(current_month).document()
                sms_data = {
                    "to_phone": to_phone,
                    "message": message,
                    "sid": message_obj.sid,
                    "sent_at": datetime.now(),
                    "status": "sent"
                }
                sms_doc_ref.set(sms_data)
                
                # Zwiększ licznik SMS w ustawieniach użytkownika
                settings_doc_ref = db.collection(username).document("Dane")
                settings_doc = settings_doc_ref.get()
                if settings_doc.exists:
                    settings_data = settings_doc.to_dict()
                    if "messaging" not in settings_data:
                        settings_data["messaging"] = {}
                    if "smsCount" not in settings_data["messaging"]:
                        settings_data["messaging"]["smsCount"] = 0
                    
                    # Zwiększ licznik o 1
                    settings_data["messaging"]["smsCount"] = settings_data["messaging"]["smsCount"] + 1
                    settings_data["updated_at"] = datetime.now().isoformat()
                    
                    # Zapisz zaktualizowane ustawienia
                    settings_doc_ref.set(settings_data)
                    print(f"📊 Licznik SMS zwiększony do: {settings_data['messaging']['smsCount']}")
                
                print(f"📝 Zapisano informację o SMS w bazie danych")
            except Exception as e:
                print(f"⚠️ Błąd zapisywania SMS do bazy danych: {str(e)}")
        
        return {
            "success": True,
            "message": "SMS został wysłany pomyślnie",
            "sid": message_obj.sid
        }
        
    except Exception as e:
        print(f"❌ Błąd wysyłania SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd wysyłania SMS: {str(e)}")

# Funkcja do generowania unikalnego kodu recenzji
def generate_review_code():
    """Generuje unikalny kod recenzji (10 znaków alfanumerycznych)"""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(10))

# Funkcja do wysyłania emaili kontaktowych
async def send_contact_email(contact_data: ContactFormRequest) -> dict:
    """Wysyła email kontaktowy na adres kontakt@next-reviews-booster.com"""
    try:
        # Konfiguracja SMTP dla konta kontakt@next-reviews-booster.com
        smtp_server = os.getenv("SMTP_SERVER")
        smtp_port = int(os.getenv("SMTP_PORT"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        # Adres docelowy
        to_email = "kontakt@next-reviews-booster.com"
        
        # Przygotuj wiadomość email
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = f"Nowa wiadomość kontaktowa od {contact_data.name}"
        
        # Treść wiadomości
        body = f"""
Nowa wiadomość z formularza kontaktowego:

Imię i nazwisko: {contact_data.name}
Email: {contact_data.email}
Firma: {contact_data.company if contact_data.company else 'Nie podano'}
Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Wiadomość:
{contact_data.message}

---
Wiadomość wysłana z formularza kontaktowego na stronie next-reviews-booster.com
"""
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Wyślij email
        print(f"📧 Wysyłanie emaila kontaktowego od: {contact_data.name}")
        print(f"📧 SMTP Server: {smtp_server}:{smtp_port}")
        
        # Użyj SMTP_SSL dla portu 465 (SSL/TLS)
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
        
        server.login(smtp_username, smtp_password)
        
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        server.quit()
        
        print(f"✅ Email kontaktowy wysłany pomyślnie od: {contact_data.name}")
        
        return {
            "success": True,
            "message": "Wiadomość została wysłana pomyślnie. Odpowiemy najszybciej jak to możliwe."
        }
        
    except Exception as e:
        print(f"❌ Błąd wysyłania emaila kontaktowego: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # W przypadku błędu, zapisz do logów jako backup
        print("=" * 50)
        print("BŁĄD WYSYŁANIA EMAILA - ZAPISYWANIE DO LOGÓW")
        print("=" * 50)
        print(f"Od: {contact_data.name} <{contact_data.email}>")
        if contact_data.company:
            print(f"Firma: {contact_data.company}")
        print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 50)
        print("Wiadomość:")
        print(contact_data.message)
        print("-" * 50)
        print(f"Błąd SMTP: {str(e)}")
        print("=" * 50)
        
        return {
            "success": True,
            "message": "Wiadomość została zapisana. Odpowiemy najszybciej jak to możliwe."
        }


# Funkcja do generowania kodu QR
def generate_qr_code(data: str, size: int = 200) -> bytes:
    """Generuje kod QR jako bytes z lepszą konfiguracją zgodnie z dokumentacją"""
    # Oblicz box_size na podstawie żądanego rozmiaru
    # Dla wersji 1 (21x21) z border=4, całkowity rozmiar to (21 + 2*4) * box_size
    # Dla rozmiaru 200px: box_size = 200 / (21 + 8) = ~6.9, zaokrąglamy do 7
    box_size = max(4, size // 30)  # Minimum 4px na box
    
    qr = qrcode.QRCode(
        version=None,  # Automatyczny wybór wersji zgodnie z dokumentacją
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # 15% korekta błędów (domyślne)
        box_size=box_size,
        border=4,  # Minimalny border zgodnie ze specyfikacją
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Generuj obraz z lepszymi kolorami
    img = qr.make_image(
        fill_color="black", 
        back_color="white"
    )
    
    # Jeśli obraz jest za duży, przeskaluj go
    if img.size[0] > size:
        # Użyj LANCZOS zamiast ANTIALIAS (nowsze wersje Pillow)
        from PIL import Image
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Konwertuj do bytes z optymalizacją
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG', optimize=True)
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

# Funkcja do sprawdzania i wysyłania cyklicznych przypomnień SMS
async def check_and_send_reminders():
    """Sprawdź wszystkich klientów i wyślij przypomnienia SMS jeśli potrzebne"""
    print("🔄 Rozpoczęcie sprawdzania przypomnień SMS...")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        return
    
    try:
        # Pobierz wszystkie kolekcje użytkowników
        collections = db.collections()
        total_reminders_sent = 0
        
        for collection in collections:
            collection_name = collection.id
            
            # Pomiń kolekcje systemowe
            if collection_name in ["temp_clients"]:
                continue
            
            print(f"🔍 Sprawdzanie kolekcji: {collection_name}")
            
            # Sprawdź czy użytkownik ma włączone automatyczne przypomnienia
            try:
                settings_doc = db.collection(collection_name).document("Dane").get()
                if not settings_doc.exists:
                    print(f"⚠️ Brak ustawień dla użytkownika: {collection_name}")
                    continue
                
                settings_data = settings_doc.to_dict()
                
                # Sprawdź czy autoSendEnabled jest włączone
                auto_send_enabled = False
                reminder_frequency = 7  # domyślnie 7 dni
                
                if "messaging" in settings_data:
                    messaging = settings_data["messaging"]
                    auto_send_enabled = messaging.get("autoSendEnabled", False)
                    reminder_frequency = messaging.get("reminderFrequency", 7)
                
                if not auto_send_enabled:
                    print(f"⏭️ Automatyczne przypomnienia wyłączone dla: {collection_name}")
                    continue
                
                print(f"✅ Automatyczne przypomnienia włączone (częstotliwość: {reminder_frequency} dni)")
                
                # Pobierz konfigurację Twilio
                twilio_config = get_twilio_client_for_user(collection_name)
                if not twilio_config:
                    print(f"⚠️ Brak konfiguracji Twilio dla użytkownika: {collection_name}")
                    continue
                
                # Pobierz szablon wiadomości i nazwę firmy
                message_template = """Dzień dobry!

Chciałbym przypomnieć o możliwości wystawienia opinii o naszych usługach. 
Wasza opinia jest dla nas bardzo ważna i pomoże innym klientom w podjęciu decyzji.

Link do wystawienia opinii: [LINK]

Z góry dziękuję za poświęcony czas!

Z poważaniem,
[NAZWA_FIRMY]"""
                company_name = "Twoja Firma"
                
                if "messaging" in settings_data and "messageTemplate" in settings_data["messaging"]:
                    message_template = settings_data["messaging"]["messageTemplate"]
                if "userData" in settings_data and "companyName" in settings_data["userData"]:
                    company_name = settings_data["userData"]["companyName"]
                
                # Pobierz wszystkich klientów tej kolekcji (pomijamy dokument "Dane")
                docs = collection.stream()
                
                for doc in docs:
                    # Pomiń dokument "Dane"
                    if doc.id == "Dane":
                        continue
                    
                    client_data = doc.to_dict()
                    client_id = doc.id
                    
                    # Sprawdź czy klient spełnia warunki do wysłania przypomnienia
                    review_status = client_data.get("review_status", "not_sent")
                    phone = client_data.get("phone", "")
                    review_code = client_data.get("review_code", "")
                    client_name = client_data.get("name", "")
                    sms_count = client_data.get("sms_count", 0)
                    
                    # Pomiń klientów bez numeru telefonu lub kodu recenzji
                    if not phone or not review_code:
                        continue
                    
                    # Pomiń klientów którzy już ukończyli recenzję
                    if review_status == "completed":
                        continue
                    
                    # Pomiń klientów którzy osiągnęli limit SMS
                    if sms_count >= 2:
                        continue
                    
                    # Sprawdź czy minął odpowiedni czas od ostatniego SMS
                    last_sms_sent = client_data.get("last_sms_sent")
                    created_at = client_data.get("created_at")
                    
                    now = datetime.now()
                    should_send = False
                    
                    # Konwertuj Firebase Timestamp na datetime jeśli potrzeba
                    last_sms_sent = convert_firebase_timestamp_to_naive(last_sms_sent)
                    created_at = convert_firebase_timestamp_to_naive(created_at)
                    
                    print(f"🔍 Sprawdzanie klienta: {client_name}")
                    print(f"   - Status: {review_status}")
                    print(f"   - Ostatni SMS: {last_sms_sent}")
                    print(f"   - Częstotliwość: {reminder_frequency} dni")
                    
                    if review_status == "not_sent":
                        # Jeśli nigdy nie wysłano SMS, wyślij pierwszy raz
                        if not last_sms_sent:
                            should_send = True
                            print(f"📤 Pierwszy SMS dla: {client_name}")
                    elif review_status in ["sent", "opened"]:
                        # Jeśli SMS był wysłany lub link był otwarty, sprawdź czy minął czas na przypomnienie
                        if last_sms_sent:
                            # Użyj total_seconds() zamiast days dla dokładniejszego porównania
                            time_diff = now - last_sms_sent
                            hours_since_last_sms = time_diff.total_seconds() / 3600
                            days_since_last_sms = time_diff.days
                            
                            print(f"   - Godziny od ostatniego SMS: {hours_since_last_sms:.2f}")
                            print(f"   - Dni od ostatniego SMS: {days_since_last_sms}")
                            
                            # Dla częstotliwości 1 dzień - sprawdź czy minęło co najmniej 24 godziny
                            if reminder_frequency == 1:
                                if hours_since_last_sms >= 24:
                                    should_send = True
                                    print(f"🔔 Przypomnienie dla: {client_name} (ostatni SMS: {hours_since_last_sms:.1f} godzin temu)")
                            else:
                                # Dla innych częstotliwości używaj dni
                                if days_since_last_sms >= reminder_frequency:
                                    should_send = True
                                    print(f"🔔 Przypomnienie dla: {client_name} (ostatni SMS: {days_since_last_sms} dni temu)")
                    
                    if should_send:
                        try:
                            # Przygotuj URL do recenzji
                            base_url = os.getenv("FRONTEND_URL", "https://next-reviews-booster-app.web.app")
                            review_url = f"{base_url}/review/{review_code}"
                            
                            # Przygotuj wiadomość
                            message = message_template.replace("[LINK]", review_url).replace("[NAZWA_FIRMY]", company_name)
                            
                            # Wyślij SMS
                            print(f"📱 Wysyłanie przypomnienia SMS do: {client_name} ({phone})")
                            result = await send_sms(phone, message, twilio_config, collection_name)
                            
                            # Zaktualizuj status klienta
                            doc_ref = db.collection(collection_name).document(client_id)
                            update_data = {
                                "last_sms_sent": now,
                                "updated_at": now,
                                "sms_count": sms_count + 1
                            }
                            
                            # Jeśli to pierwszy SMS, zmień status na "sent"
                            if review_status == "not_sent":
                                update_data["review_status"] = "sent"
                            
                            doc_ref.update(update_data)
                            
                            total_reminders_sent += 1
                            print(f"✅ Przypomnienie wysłane do: {client_name}")
                            
                        except Exception as sms_error:
                            print(f"❌ Błąd wysyłania SMS do {client_name}: {str(sms_error)}")
                            continue
                
            except Exception as user_error:
                print(f"❌ Błąd przetwarzania użytkownika {collection_name}: {str(user_error)}")
                continue
        
        print(f"✅ Sprawdzanie zakończone. Wysłano {total_reminders_sent} przypomnień")
        return {"reminders_sent": total_reminders_sent}
        
    except Exception as e:
        print(f"❌ Błąd podczas sprawdzania przypomnień: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Inicjalizacja schedulera
scheduler = BackgroundScheduler()

def run_async_check_and_send_reminders():
    """Wrapper do uruchamiania async funkcji w scheduler"""
    try:
        print(f"🕐 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Uruchamianie schedulera przypomnień SMS...")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(check_and_send_reminders())
        loop.close()
        print(f"✅ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Scheduler zakończony: {result}")
    except Exception as e:
        print(f"❌ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Błąd w schedulerze: {str(e)}")
        import traceback
        traceback.print_exc()

# Dodaj zadanie do schedulera - sprawdzaj co godzinę
scheduler.add_job(
    run_async_check_and_send_reminders,
    'interval',
    hours=1,
    id='check_reminders',
    name='Sprawdzanie i wysyłanie przypomnień SMS',
    replace_existing=True
)

# Uruchom scheduler
scheduler.start()
print("✅ Scheduler przypomnień SMS uruchomiony (sprawdzanie co godzinę)")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        message="next review booster API działa poprawnie! 🚀",
        timestamp=datetime.now(),
        version="1.0.0"
    )

@app.get("/")
async def root():
    return {
        "message": "Witaj w next review booster API! 🎉",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Endpointy dla klientów
@app.post("/clients/{username}", response_model=ClientResponse)
async def create_client(username: str, client_data: ClientCreate):
    """Dodaj nowego klienta do kolekcji użytkownika"""
    print(f"➕ Dodawanie klienta dla użytkownika: {username}")
    print(f"📊 Dane klienta: {client_data.dict()}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    # Sprawdź uprawnienia użytkownika - Demo może mieć ograniczenia
    user_permission = get_user_permission_from_db(username)
    if user_permission == UserPermission.DEMO:
        print(f"⚠️ Użytkownik {username} ma uprawnienia Demo - sprawdzanie limitów")
        # Tutaj można dodać logikę sprawdzania limitów dla użytkowników Demo
        # Na przykład: maksymalna liczba klientów, ograniczenia funkcjonalności
    
    try:
        # Kolekcja nazywa się tak jak username
        clients_ref = db.collection(username)
        print(f"📂 Kolekcja: {username}")
        
        # Dodaj timestampy i wygeneruj kod recenzji
        now = datetime.now()
        client_dict = client_data.dict()
        review_code = generate_review_code()
        client_dict.update({
            "created_at": now,
            "updated_at": now,
            "review_code": review_code,
            "review_status": "not_sent",
            "last_sms_sent": None,
            "sms_count": 0,
            "source": "CRM"
        })
        print(f"📝 Dane do zapisu: {client_dict}")
        print(f"🔑 Wygenerowany kod recenzji: {review_code}")
        
        # Dodaj klienta do Firestore
        doc_ref = clients_ref.add(client_dict)[1]
        print(f"✅ Klient dodany z ID: {doc_ref.id}")
        
        # Pobierz dodanego klienta
        doc = doc_ref.get()
        client_data_dict = doc.to_dict()
        client_data_dict["id"] = doc.id
        print(f"📖 Odczytane dane: {client_data_dict}")
        
        # Konwertuj Firebase Timestamp na datetime
        if "created_at" in client_data_dict:
            client_data_dict["created_at"] = convert_firebase_timestamp_to_naive(client_data_dict["created_at"])
        if "updated_at" in client_data_dict:
            client_data_dict["updated_at"] = convert_firebase_timestamp_to_naive(client_data_dict["updated_at"])
        if "last_sms_sent" in client_data_dict:
            client_data_dict["last_sms_sent"] = convert_firebase_timestamp_to_naive(client_data_dict["last_sms_sent"])
        
        # Upewnij się, że last_sms_sent istnieje
        if "last_sms_sent" not in client_data_dict:
            client_data_dict["last_sms_sent"] = None
        
        return ClientResponse(**client_data_dict)
        
    except Exception as e:
        print(f"❌ Błąd podczas dodawania klienta: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas dodawania klienta: {str(e)}")

@app.get("/clients/{username}", response_model=ClientListResponse)
async def get_clients(username: str):
    """Pobierz wszystkich klientów użytkownika"""
    print(f"🔍 Pobieranie klientów dla użytkownika: {username}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    # Upewnij się, że użytkownik istnieje w bazie danych
    ensure_user_exists(username)
    
    try:
        print(f"📂 Próba dostępu do kolekcji: {username}")
        clients_ref = db.collection(username)
        docs = clients_ref.stream()
        
        clients = []
        doc_count = 0
        for doc in docs:
            doc_count += 1
            print(f"📄 Dokument {doc_count}: {doc.id}")
            
            # Pomiń dokument "Dane" - to są ustawienia użytkownika, nie klient
            if doc.id == "Dane":
                print(f"⏭️ Pomijanie dokumentu 'Dane' (ustawienia użytkownika)")
                continue
            
            client_data = doc.to_dict()
            client_data["id"] = doc.id
            print(f"📊 Dane klienta: {client_data}")
            
            try:
                # Konwertuj Firebase Timestamp na datetime
                if "created_at" in client_data:
                    client_data["created_at"] = convert_firebase_timestamp_to_naive(client_data["created_at"])
                if "updated_at" in client_data:
                    client_data["updated_at"] = convert_firebase_timestamp_to_naive(client_data["updated_at"])
                if "last_sms_sent" in client_data:
                    client_data["last_sms_sent"] = convert_firebase_timestamp_to_naive(client_data["last_sms_sent"])
                
                # Upewnij się, że wszystkie wymagane pola są obecne
                if "note" not in client_data:
                    client_data["note"] = ""
                if "stars" not in client_data:
                    client_data["stars"] = 0
                if "review" not in client_data:
                    client_data["review"] = ""
                if "review_code" not in client_data:
                    client_data["review_code"] = ""
                if "review_status" not in client_data:
                    client_data["review_status"] = "not_sent"
                if "last_sms_sent" not in client_data:
                    client_data["last_sms_sent"] = None
                if "sms_count" not in client_data:
                    client_data["sms_count"] = 0
                if "source" not in client_data:
                    client_data["source"] = "CRM"
                
                client_response = ClientResponse(**client_data)
                clients.append(client_response)
                print(f"✅ Klient {doc_count} dodany do listy")
            except Exception as validation_error:
                print(f"❌ Błąd walidacji dla klienta {doc_count}: {validation_error}")
                print(f"📊 Problemowe dane: {client_data}")
                # Kontynuuj z następnym dokumentem
                continue
        
        print(f"✅ Znaleziono {len(clients)} klientów")
        return ClientListResponse(clients=clients, total=len(clients))
        
    except Exception as e:
        print(f"❌ Błąd podczas pobierania klientów: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas pobierania klientów: {str(e)}")

@app.get("/clients/{username}/{client_id}", response_model=ClientResponse)
async def get_client(username: str, client_id: str):
    """Pobierz konkretnego klienta"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        doc_ref = db.collection(username).document(client_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
        
        client_data = doc.to_dict()
        client_data["id"] = doc.id
        
        # Konwertuj Firebase Timestamp na datetime
        if "created_at" in client_data and hasattr(client_data["created_at"], 'to_pydatetime'):
            client_data["created_at"] = client_data["created_at"].to_pydatetime()
        if "updated_at" in client_data and hasattr(client_data["updated_at"], 'to_pydatetime'):
            client_data["updated_at"] = client_data["updated_at"].to_pydatetime()
        if "last_sms_sent" in client_data and client_data["last_sms_sent"] and hasattr(client_data["last_sms_sent"], 'to_pydatetime'):
            client_data["last_sms_sent"] = client_data["last_sms_sent"].to_pydatetime()
        
        # Upewnij się, że last_sms_sent istnieje
        if "last_sms_sent" not in client_data:
            client_data["last_sms_sent"] = None
        
        return ClientResponse(**client_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd podczas pobierania klienta: {str(e)}")

@app.put("/clients/{username}/{client_id}", response_model=ClientResponse)
async def update_client(username: str, client_id: str, client_data: ClientUpdate):
    """Zaktualizuj klienta"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        doc_ref = db.collection(username).document(client_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
        
        # Przygotuj dane do aktualizacji (tylko nie-None wartości)
        update_data = {k: v for k, v in client_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now()
        
        # Zaktualizuj dokument
        doc_ref.update(update_data)
        
        # Pobierz zaktualizowany dokument
        updated_doc = doc_ref.get()
        client_data_dict = updated_doc.to_dict()
        client_data_dict["id"] = updated_doc.id
        
        # Konwertuj Firebase Timestamp na datetime
        if "created_at" in client_data_dict:
            client_data_dict["created_at"] = convert_firebase_timestamp_to_naive(client_data_dict["created_at"])
        if "updated_at" in client_data_dict:
            client_data_dict["updated_at"] = convert_firebase_timestamp_to_naive(client_data_dict["updated_at"])
        if "last_sms_sent" in client_data_dict:
            client_data_dict["last_sms_sent"] = convert_firebase_timestamp_to_naive(client_data_dict["last_sms_sent"])
        
        # Upewnij się, że last_sms_sent istnieje
        if "last_sms_sent" not in client_data_dict:
            client_data_dict["last_sms_sent"] = None
        
        return ClientResponse(**client_data_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd podczas aktualizacji klienta: {str(e)}")

@app.delete("/clients/{username}/{client_id}")
async def delete_client(username: str, client_id: str):
    """Usuń klienta"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        doc_ref = db.collection(username).document(client_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
        
        # Usuń dokument
        doc_ref.delete()
        
        return {"message": "Klient został usunięty pomyślnie"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd podczas usuwania klienta: {str(e)}")

# Endpointy dla ustawień użytkownika
@app.get("/settings/{username}", response_model=UserSettingsResponse)
async def get_user_settings(username: str):
    """Pobierz ustawienia użytkownika"""
    print(f"⚙️ Pobieranie ustawień dla użytkownika: {username}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if doc.exists:
            settings_data = doc.to_dict()
            print(f"✅ Znaleziono ustawienia: {settings_data}")
            return UserSettingsResponse(settings=UserSettings(**settings_data))
        else:
            print("ℹ️ Brak ustawień, tworzę nowy rekord użytkownika")
            # Utwórz nowy rekord użytkownika z domyślnymi danymi
            ensure_user_exists(username)
            
            # Pobierz nowo utworzone ustawienia
            doc = doc_ref.get()
            if doc.exists:
                settings_data = doc.to_dict()
                print(f"✅ Utworzono nowy rekord użytkownika: {settings_data}")
                return UserSettingsResponse(settings=UserSettings(**settings_data))
            else:
                # Fallback - zwróć domyślne ustawienia
                default_settings = UserSettings(
                    userData=UserData(
                        name="",
                        surname="",
                        email="",
                        companyName="",
                        googleCard=""
                    ),
            messaging=MessagingSettings(
                reminderFrequency=7,
                messageTemplate="""Bardzo prosimy o zostawienie opinii o naszych usługach: [LINK]
Wasza opinia ma dla nas ogromne znaczenie i pomoże kolejnym klientom w wyborze.

Dziękujemy!""",
                autoSendEnabled=False,
                smsLimit=get_sms_limit_for_permission(UserPermission.DEMO)
            ),
                    twilio=TwilioSettings(
                        account_sid="TWILIO_ACCOUNT_SID_ENV",
                        auth_token="TWILIO_AUTH_TOKEN_ENV",
                        phone_number="",
                        messaging_service_sid="TWILIO_MESSAGING_SERVICE_SID_ENV"
                    ),
                    permission=UserPermission.DEMO
                )
                return UserSettingsResponse(settings=default_settings)
        
    except Exception as e:
        print(f"❌ Błąd podczas pobierania ustawień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas pobierania ustawień: {str(e)}")

@app.put("/settings/{username}")
async def save_user_settings(username: str, settings: UserSettings):
    """Zapisz ustawienia użytkownika"""
    print(f"💾 Zapisywanie ustawień dla użytkownika: {username}")
    print(f"📊 Dane ustawień: {settings.dict()}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        doc_ref = db.collection(username).document("Dane")
        
        # Dodaj timestamp
        settings_dict = settings.dict()
        settings_dict.update({
            "updated_at": datetime.now()
        })
        
        # Zapisz do Firestore
        doc_ref.set(settings_dict)
        print(f"✅ Ustawienia zapisane pomyślnie")
        
        return {"message": "Ustawienia zostały zapisane pomyślnie"}
        
    except Exception as e:
        print(f"❌ Błąd podczas zapisywania ustawień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas zapisywania ustawień: {str(e)}")

# Endpointy do zarządzania uprawnieniami użytkowników
class PermissionUpdateRequest(BaseModel):
    permission: UserPermission

class PermissionResponse(BaseModel):
    username: str
    permission: UserPermission
    message: str

@app.put("/admin/permissions/{username}", response_model=PermissionResponse)
async def update_user_permission(username: str, permission_data: PermissionUpdateRequest, admin_username: str = None):
    """Zaktualizuj uprawnienia użytkownika (tylko dla adminów)"""
    print(f"🔐 Aktualizacja uprawnień dla użytkownika: {username}")
    print(f"🔐 Nowe uprawnienia: {permission_data.permission}")
    print(f"🔐 Admin wykonujący akcję: {admin_username}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    # Sprawdź uprawnienia admina (jeśli podano)
    if admin_username and not check_user_permission(admin_username, UserPermission.ADMIN):
        print(f"❌ Użytkownik {admin_username} nie ma uprawnień administratora")
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    
    try:
        # Sprawdź czy użytkownik istnieje
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            print(f"❌ Użytkownik {username} nie istnieje")
            raise HTTPException(status_code=404, detail="Użytkownik nie został znaleziony")
        
        # Pobierz obecne ustawienia
        settings_data = doc.to_dict()
        settings = UserSettings(**settings_data)
        
        # Zaktualizuj uprawnienia
        settings.permission = permission_data.permission
        
        # Zaktualizuj limit SMS na podstawie nowych uprawnień
        new_sms_limit = get_sms_limit_for_permission(permission_data.permission)
        settings.messaging.smsLimit = new_sms_limit
        print(f"📊 Zaktualizowano limit SMS dla {username}: {new_sms_limit}")
        
        # Zapisz zaktualizowane ustawienia
        settings_dict = settings.dict()
        settings_dict.update({
            "updated_at": datetime.now()
        })
        
        doc_ref.set(settings_dict)
        print(f"✅ Uprawnienia zaktualizowane pomyślnie dla {username}: {permission_data.permission}")
        
        return PermissionResponse(
            username=username,
            permission=permission_data.permission,
            message=f"Uprawnienia użytkownika {username} zostały zaktualizowane na {permission_data.permission}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas aktualizacji uprawnień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas aktualizacji uprawnień: {str(e)}")

@app.get("/admin/permissions/{username}", response_model=PermissionResponse)
async def get_user_permission(username: str):
    """Pobierz uprawnienia użytkownika"""
    print(f"🔍 Sprawdzanie uprawnień dla użytkownika: {username}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            print(f"❌ Użytkownik {username} nie istnieje")
            raise HTTPException(status_code=404, detail="Użytkownik nie został znaleziony")
        
        settings_data = doc.to_dict()
        settings = UserSettings(**settings_data)
        
        print(f"✅ Uprawnienia użytkownika {username}: {settings.permission}")
        
        return PermissionResponse(
            username=username,
            permission=settings.permission,
            message=f"Uprawnienia użytkownika {username}: {settings.permission}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas pobierania uprawnień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas pobierania uprawnień: {str(e)}")

class UserPermissionInfo(BaseModel):
    username: str
    permission: UserPermission
    permission_level: int
    can_manage_clients: bool
    can_send_sms: bool
    can_access_admin: bool
    limits: dict

@app.get("/user-permission-info/{username}", response_model=UserPermissionInfo)
async def get_user_permission_info(username: str):
    """Pobierz szczegółowe informacje o uprawnieniach użytkownika"""
    print(f"🔍 Sprawdzanie szczegółowych uprawnień dla użytkownika: {username}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        user_permission = get_user_permission_from_db(username)
        
        # Hierarchia uprawnień
        permission_hierarchy = {
            UserPermission.ADMIN: 4,
            UserPermission.PROFESSIONAL: 3,
            UserPermission.STARTER: 2,
            UserPermission.DEMO: 1
        }
        
        permission_level = permission_hierarchy.get(user_permission, 1)
        
        # Określ możliwości na podstawie uprawnień
        can_manage_clients = user_permission in [UserPermission.ADMIN, UserPermission.PROFESSIONAL, UserPermission.STARTER]
        can_send_sms = user_permission in [UserPermission.ADMIN, UserPermission.PROFESSIONAL, UserPermission.STARTER]
        can_access_admin = user_permission == UserPermission.ADMIN
        
        # Określ limity na podstawie uprawnień
        limits = {}
        if user_permission == UserPermission.DEMO:
            limits = {
                "max_clients": 5,
                "max_sms_per_month": 10,
                "features": ["basic_reviews"]
            }
        elif user_permission == UserPermission.STARTER:
            limits = {
                "max_clients": 50,
                "max_sms_per_month": 100,
                "features": ["basic_reviews", "sms_reminders"]
            }
        elif user_permission == UserPermission.PROFESSIONAL:
            limits = {
                "max_clients": 500,
                "max_sms_per_month": 1000,
                "features": ["basic_reviews", "sms_reminders", "advanced_analytics"]
            }
        elif user_permission == UserPermission.ADMIN:
            limits = {
                "max_clients": -1,  # Bez limitu
                "max_sms_per_month": -1,  # Bez limitu
                "features": ["all"]
            }
        
        print(f"✅ Uprawnienia użytkownika {username}: {user_permission} (poziom {permission_level})")
        
        return UserPermissionInfo(
            username=username,
            permission=user_permission,
            permission_level=permission_level,
            can_manage_clients=can_manage_clients,
            can_send_sms=can_send_sms,
            can_access_admin=can_access_admin,
            limits=limits
        )
        
    except Exception as e:
        print(f"❌ Błąd podczas pobierania informacji o uprawnieniach: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas pobierania informacji o uprawnieniach: {str(e)}")

@app.post("/admin/migrate-user-permissions")
async def migrate_user_permissions():
    """Migruj istniejących użytkowników - ustaw im uprawnienia Demo jeśli nie mają uprawnień"""
    print(f"🔄 Rozpoczynanie migracji uprawnień użytkowników")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        migrated_count = 0
        skipped_count = 0
        
        # Pobierz wszystkie kolekcje (użytkowników)
        collections = db.collections()
        
        for collection in collections:
            collection_name = collection.id
            print(f"🔍 Sprawdzanie kolekcji: {collection_name}")
            
            # Sprawdź czy to jest kolekcja użytkownika (nie systemowa)
            if collection_name in ["temp_clients", "Dane"]:
                print(f"⏭️ Pomijanie kolekcji systemowej: {collection_name}")
                continue
            
            # Sprawdź czy użytkownik ma dokument "Dane"
            doc_ref = collection.document("Dane")
            doc = doc_ref.get()
            
            if doc.exists:
                settings_data = doc.to_dict()
                
                # Sprawdź czy ma już uprawnienia
                if "permission" not in settings_data:
                    print(f"🔄 Migracja użytkownika: {collection_name}")
                    
                    # Dodaj uprawnienia Demo
                    settings_data["permission"] = UserPermission.DEMO
                    settings_data["updated_at"] = datetime.now()
                    
                    # Zapisz zaktualizowane ustawienia
                    doc_ref.set(settings_data)
                    migrated_count += 1
                    print(f"✅ Użytkownik {collection_name} zmigrowany do uprawnień Demo")
                else:
                    print(f"⏭️ Użytkownik {collection_name} już ma uprawnienia: {settings_data.get('permission')}")
                    skipped_count += 1
            else:
                print(f"⚠️ Użytkownik {collection_name} nie ma dokumentu Dane")
        
        print(f"✅ Migracja zakończona: {migrated_count} zmigrowanych, {skipped_count} pominiętych")
        
        return {
            "message": "Migracja uprawnień zakończona pomyślnie",
            "migrated_count": migrated_count,
            "skipped_count": skipped_count,
            "total_processed": migrated_count + skipped_count
        }
        
    except Exception as e:
        print(f"❌ Błąd podczas migracji uprawnień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas migracji uprawnień: {str(e)}")

# Endpoint do tworzenia rekordu użytkownika po rejestracji
class UserRegistrationData(BaseModel):
    username: str
    email: str
    name: str = ""
    surname: str = ""

class UserRegistrationResponse(BaseModel):
    success: bool
    message: str
    username: str
    permission: UserPermission

@app.post("/register-user", response_model=UserRegistrationResponse)
async def register_user(user_data: UserRegistrationData):
    """Utwórz rekord użytkownika w bazie danych po rejestracji"""
    print(f"👤 Rejestracja nowego użytkownika: {user_data.username}")
    print(f"📧 Email: {user_data.email}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Sprawdź czy użytkownik już istnieje
        doc_ref = db.collection(user_data.username).document("Dane")
        doc = doc_ref.get()
        
        if doc.exists:
            print(f"⚠️ Użytkownik {user_data.username} już istnieje w bazie danych")
            # Pobierz istniejące uprawnienia
            settings_data = doc.to_dict()
            settings = UserSettings(**settings_data)
            return UserRegistrationResponse(
                success=True,
                message="Użytkownik już istnieje w bazie danych",
                username=user_data.username,
                permission=settings.permission
            )
        
        # Utwórz nowy rekord użytkownika z domyślnymi danymi
        now = datetime.now()
        default_settings = UserSettings(
            userData=UserData(
                name=user_data.name,
                surname=user_data.surname,
                email=user_data.email,
                companyName="",
                googleCard=""
            ),
            messaging=MessagingSettings(
                reminderFrequency=7,
                messageTemplate="""Bardzo prosimy o zostawienie opinii o naszych usługach: [LINK]
Wasza opinia ma dla nas ogromne znaczenie i pomoże kolejnym klientom w wyborze.

Dziękujemy!""",
                autoSendEnabled=False,
                smsLimit=get_sms_limit_for_permission(UserPermission.DEMO)
            ),
            twilio=TwilioSettings(
                account_sid="TWILIO_ACCOUNT_SID_ENV",
                auth_token="TWILIO_AUTH_TOKEN_ENV",
                phone_number="",
                messaging_service_sid="TWILIO_MESSAGING_SERVICE_SID_ENV"
            ),
            permission=UserPermission.DEMO  # Nowi użytkownicy domyślnie mają uprawnienia Demo
        )
        
        # Zapisz ustawienia do bazy danych
        settings_dict = default_settings.dict()
        settings_dict.update({
            "created_at": now,
            "updated_at": now
        })
        
        doc_ref.set(settings_dict)
        print(f"✅ Użytkownik {user_data.username} zarejestrowany z uprawnieniami Demo")
        
        return UserRegistrationResponse(
            success=True,
            message=f"Użytkownik {user_data.username} został pomyślnie zarejestrowany",
            username=user_data.username,
            permission=UserPermission.DEMO
        )
        
    except Exception as e:
        print(f"❌ Błąd podczas rejestracji użytkownika: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas rejestracji użytkownika: {str(e)}")

# Endpointy dla formularza ocen
@app.get("/review/{review_code}")
async def get_review_form(review_code: str):
    """Pobierz informacje o kliencie na podstawie kodu recenzji"""
    print(f"🔍 Wyszukiwanie klienta z kodem: {review_code}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Najpierw sprawdź w kolekcji temp_clients
        temp_clients_ref = db.collection("temp_clients")
        temp_docs = temp_clients_ref.where("review_code", "==", review_code).stream()
        
        found_client = None
        found_collection = None
        is_temp_client = False
        
        for doc in temp_docs:
            found_client = doc.to_dict()
            found_client["id"] = doc.id
            is_temp_client = True
            break
        
        # Jeśli nie znaleziono w temp_clients, szukaj w kolekcjach użytkowników
        if not found_client:
            collections = db.collections()
            
            for collection in collections:
                collection_name = collection.id
                # Pomiń kolekcje systemowe
                if collection_name in ["Dane", "temp_clients"]:
                    continue
                    
                docs = collection.where("review_code", "==", review_code).stream()
                
                for doc in docs:
                    found_client = doc.to_dict()
                    found_client["id"] = doc.id
                    found_collection = collection_name
                    break
                
                if found_client:
                    break
        
        if found_client:
            print(f"✅ Znaleziono klienta: {found_client['name']}")
            
            # Zaktualizuj status na "opened" (formularz został otwarty)
            if is_temp_client:
                doc_ref = db.collection("temp_clients").document(found_client["id"])
                doc_ref.update({
                    "status": "opened",
                    "updated_at": datetime.now()
                })
            else:
                # Znajdź kolekcję użytkownika
                collections = db.collections()
                for collection in collections:
                    collection_name = collection.id
                    if collection_name in ["Dane", "temp_clients"]:
                        continue
                    docs = collection.where("review_code", "==", review_code).stream()
                    for doc in docs:
                        doc_ref = db.collection(collection_name).document(doc.id)
                        doc_ref.update({
                            "review_status": "opened",
                            "updated_at": datetime.now()
                        })
                        break
                    if docs:
                        break
            
            # Pobierz ustawienia firmy (dla wszystkich klientów)
            company_name = "Twoja Firma"
            google_card = ""
            try:
                print(f"🔍 Szukanie ustawień dla kodu: {review_code}")
                print(f"🔍 Znaleziony klient: {found_client}")
                print(f"🔍 Czy to temp_client: {is_temp_client}")
                print(f"🔍 Kolekcja klienta: {found_collection}")
                
                # Jeśli klient jest w temp_clients, musimy znaleźć właściciela
                if is_temp_client:
                    print("🔍 Klient jest w temp_clients - szukam właściciela")
                    # Sprawdź wszystkie kolekcje użytkowników
                    collections = db.collections()
                    for collection in collections:
                        collection_name = collection.id
                        if collection_name in ["Dane", "temp_clients"]:
                            continue
                        print(f"🔍 Sprawdzanie kolekcji użytkownika: {collection_name}")
                        settings_doc = db.collection(collection_name).document("Dane").get()
                        if settings_doc.exists:
                            settings_data = settings_doc.to_dict()
                            print(f"📋 Dane ustawień z kolekcji {collection_name}: {settings_data}")
                            if "userData" in settings_data:
                                user_data = settings_data["userData"]
                                print(f"👤 Dane użytkownika z kolekcji {collection_name}: {user_data}")
                                
                                # Sprawdź czy userData ma zagnieżdżoną strukturę userData
                                if "userData" in user_data:
                                    nested_user_data = user_data["userData"]
                                    print(f"👤 Zagnieżdżone dane użytkownika z kolekcji {collection_name}: {nested_user_data}")
                                    if "companyName" in nested_user_data:
                                        company_name = nested_user_data["companyName"]
                                        print(f"🏢 Nazwa firmy z kolekcji {collection_name}: {company_name}")
                                    if "googleCard" in nested_user_data:
                                        google_card = nested_user_data["googleCard"]
                                        print(f"🔗 Google Card (zagnieżdżone) z kolekcji {collection_name}: {google_card}")
                                        print(f"🔗 Google Card type: {type(google_card)}")
                                        print(f"🔗 Google Card length: {len(google_card) if google_card else 0}")
                                        break  # Znaleziono ustawienia, przerwij pętlę
                                else:
                                    # Sprawdź bezpośrednio w userData
                                    if "companyName" in user_data:
                                        company_name = user_data["companyName"]
                                        print(f"🏢 Nazwa firmy z kolekcji {collection_name}: {company_name}")
                                    if "googleCard" in user_data:
                                        google_card = user_data["googleCard"]
                                        print(f"🔗 Google Card (bezpośrednie) z kolekcji {collection_name}: {google_card}")
                                        print(f"🔗 Google Card type: {type(google_card)}")
                                        print(f"🔗 Google Card length: {len(google_card) if google_card else 0}")
                                        break  # Znaleziono ustawienia, przerwij pętlę
                else:
                    # Klient jest w kolekcji użytkownika
                    print(f"🔍 Klient jest w kolekcji użytkownika: {found_collection}")
                    settings_doc = db.collection(found_collection).document("Dane").get()
                    if settings_doc.exists:
                        settings_data = settings_doc.to_dict()
                        print(f"📋 Dane ustawień z kolekcji {found_collection}: {settings_data}")
                        if "userData" in settings_data:
                            user_data = settings_data["userData"]
                            print(f"👤 Dane użytkownika z kolekcji {found_collection}: {user_data}")
                            
                            # Sprawdź czy userData ma zagnieżdżoną strukturę userData
                            if "userData" in user_data:
                                nested_user_data = user_data["userData"]
                                print(f"👤 Zagnieżdżone dane użytkownika z kolekcji {found_collection}: {nested_user_data}")
                                if "companyName" in nested_user_data:
                                    company_name = nested_user_data["companyName"]
                                    print(f"🏢 Nazwa firmy z kolekcji {found_collection}: {company_name}")
                                if "googleCard" in nested_user_data:
                                    google_card = nested_user_data["googleCard"]
                                    print(f"🔗 Google Card (zagnieżdżone) z kolekcji {found_collection}: {google_card}")
                                    print(f"🔗 Google Card type: {type(google_card)}")
                                    print(f"🔗 Google Card length: {len(google_card) if google_card else 0}")
                            else:
                                # Sprawdź bezpośrednio w userData
                                if "companyName" in user_data:
                                    company_name = user_data["companyName"]
                                    print(f"🏢 Nazwa firmy z kolekcji {found_collection}: {company_name}")
                                if "googleCard" in user_data:
                                    google_card = user_data["googleCard"]
                                    print(f"🔗 Google Card (bezpośrednie) z kolekcji {found_collection}: {google_card}")
                                    print(f"🔗 Google Card type: {type(google_card)}")
                                    print(f"🔗 Google Card length: {len(google_card) if google_card else 0}")
                        else:
                            print("⚠️ Brak userData w ustawieniach")
                    else:
                        print(f"⚠️ Dokument 'Dane' nie istnieje w kolekcji {found_collection}")
            except Exception as e:
                print(f"⚠️ Nie można pobrać ustawień firmy: {e}")
            
            result = {
                "review_code": review_code,
                "client_name": found_client['name'],
                "company_name": company_name,
                "google_card": google_card
            }
            
            print(f"🔍 DEBUG - Zwracane dane:")
            print(f"🔍 - review_code: {result['review_code']}")
            print(f"🔍 - client_name: {result['client_name']}")
            print(f"🔍 - company_name: {result['company_name']}")
            print(f"🔍 - google_card: {result['google_card']}")
            print(f"🔍 - google_card type: {type(result['google_card'])}")
            
            return result
        else:
            print(f"❌ Nie znaleziono klienta z kodem: {review_code}")
            raise HTTPException(status_code=404, detail="Kod recenzji nie został znaleziony")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas wyszukiwania kodu recenzji: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas wyszukiwania kodu recenzji: {str(e)}")

@app.post("/review/{review_code}", response_model=ReviewResponse)
async def submit_review(review_code: str, review_data: ReviewSubmission):
    """Zapisz ocenę klienta"""
    print(f"⭐ Otrzymano ocenę dla kodu: {review_code}")
    print(f"📊 Dane oceny: {review_data.dict()}")
    
    if not db:
        print("❌ Firebase nie jest skonfigurowany")
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Walidacja oceny
        if review_data.stars < 1 or review_data.stars > 5:
            raise HTTPException(status_code=400, detail="Ocena musi być między 1 a 5 gwiazdkami")
        
        # Znajdź klienta po kodzie recenzji
        found_client = None
        found_collection = None
        is_temp_client = False
        
        # Najpierw sprawdź w kolekcji temp_clients
        temp_clients_ref = db.collection("temp_clients")
        temp_docs = temp_clients_ref.where("review_code", "==", review_code).stream()
        
        for doc in temp_docs:
            found_client = doc.to_dict()
            found_client["id"] = doc.id
            is_temp_client = True
            break
        
        # Jeśli nie znaleziono w temp_clients, szukaj w kolekcjach użytkowników
        if not found_client:
            collections = db.collections()
            
            for collection in collections:
                collection_name = collection.id
                if collection_name in ["Dane", "temp_clients"]:
                    continue
                    
                docs = collection.where("review_code", "==", review_code).stream()
                
                for doc in docs:
                    found_client = doc.to_dict()
                    found_client["id"] = doc.id
                    found_collection = collection_name
                    break
                
                if found_client:
                    break
        
        if not found_client:
            print(f"❌ Nie znaleziono klienta z kodem: {review_code}")
            raise HTTPException(status_code=404, detail="Kod recenzji nie został znaleziony")
        
        # Zaktualizuj dane klienta z nową recenzją
        if is_temp_client:
            # Dla tymczasowych klientów
            doc_ref = db.collection("temp_clients").document(found_client["id"])
            doc_ref.update({
                "stars": review_data.stars,
                "review": review_data.review,
                "status": "completed",
                "updated_at": datetime.now()
            })
            print(f"✅ Zaktualizowano tymczasowego klienta: {found_client['id']}")
        else:
            # Dla stałych klientów - użyj zapisanej nazwy kolekcji
            if found_collection:
                doc_ref = db.collection(found_collection).document(found_client["id"])
                doc_ref.update({
                    "stars": review_data.stars,
                    "review": review_data.review,
                    "review_status": "completed",
                    "updated_at": datetime.now()
                })
                print(f"✅ Zaktualizowano klienta w kolekcji {found_collection}: {found_client['id']}")
            else:
                print(f"⚠️ Nie znaleziono kolekcji dla klienta")
                raise HTTPException(status_code=500, detail="Nie można zaktualizować klienta")
        
        print(f"✅ Ocena zapisana: {review_data.stars} gwiazdek dla {found_client['name']}")
        print(f"💬 Recenzja: {review_data.review}")
        
        return ReviewResponse(
            success=True,
            message="Dziękujemy za wystawienie opinii!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas zapisywania oceny: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas zapisywania oceny: {str(e)}")

# Endpointy dla kodów QR
@app.post("/qrcode/{username}", response_model=QRCodeResponse)
async def generate_company_qr_code(username: str, request: QRCodeRequest):
    """Generuj jeden kod QR dla firmy użytkownika"""
    print(f"🔲 Generowanie kodu QR dla firmy: {username}")
    print(f"📏 Żądany rozmiar: {request.size}px")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Walidacja rozmiaru
        if request.size < 50 or request.size > 1000:
            raise HTTPException(status_code=400, detail="Rozmiar kodu QR musi być między 50 a 1000 pikseli")
        
        # Pobierz ustawienia firmy
        company_name = "Twoja Firma"
        try:
            settings_doc = db.collection(username).document("Dane").get()
            if settings_doc.exists:
                settings_data = settings_doc.to_dict()
                if "userData" in settings_data and "companyName" in settings_data["userData"]:
                    company_name = settings_data["userData"]["companyName"]
        except Exception as e:
            print(f"⚠️ Nie można pobrać nazwy firmy: {e}")
        
        # Generuj URL do formularza logowania klienta
        base_url = os.getenv("FRONTEND_URL", "https://next-reviews-booster-app.web.app")
        client_login_url = f"{base_url}/client-login/{username}"
        
        # Generuj kod QR z lepszą konfiguracją
        qr_data = generate_qr_code(client_login_url, request.size)
        qr_base64 = f"data:image/png;base64,{base64.b64encode(qr_data).decode()}"
        
        print(f"✅ Wygenerowano kod QR dla firmy: {company_name} (rozmiar: {request.size}px)")
        return QRCodeResponse(
            qr_code=qr_base64,
            company_name=company_name,
            review_url=client_login_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas generowania kodu QR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas generowania kodu QR: {str(e)}")







@app.get("/qrcode/{review_code}")
async def get_qr_code_image(review_code: str, size: int = 200):
    """Pobierz kod QR jako obraz dla konkretnego kodu recenzji"""
    print(f"🔲 Generowanie kodu QR dla: {review_code}")
    print(f"📏 Żądany rozmiar: {size}px")
    
    try:
        # Walidacja rozmiaru
        if size < 50 or size > 1000:
            raise HTTPException(status_code=400, detail="Rozmiar kodu QR musi być między 50 a 1000 pikseli")
        
        # Generuj URL do formularza recenzji
        # Użyj zmiennej środowiskowej lub domyślnego localhost
        base_url = os.getenv("FRONTEND_URL", "https://next-reviews-booster-app.web.app")
        review_url = f"{base_url}/review/{review_code}"
        
        # Generuj kod QR z lepszą konfiguracją
        qr_data = generate_qr_code(review_url, size)
        
        return StreamingResponse(
            io.BytesIO(qr_data),
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=qr_{review_code}.png",
                "Cache-Control": "public, max-age=3600"  # Cache na 1 godzinę
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas generowania kodu QR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas generowania kodu QR: {str(e)}")

# Endpoint do logowania klienta
@app.post("/client-login/{username}", response_model=ClientLoginResponse)
async def client_login(username: str, client_data: ClientLoginRequest):
    """Zapisz dane klienta i wygeneruj kod recenzji dla konkretnego użytkownika"""
    print(f"👤 Logowanie klienta: {client_data.name} dla użytkownika: {username}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Generuj unikalny kod recenzji
        review_code = generate_review_code()
        
        # Zapisz dane klienta w kolekcji użytkownika z informacją o właścicielu
        now = datetime.now()
        client_data_dict = {
            "name": client_data.name,
            "phone": client_data.phone,
            "note": client_data.note,
            "stars": client_data.stars,
            "review": "",
            "review_code": review_code,
            "review_status": "not_sent",
            "created_at": now,
            "updated_at": now,
            "status": "pending_review",
            "owner_username": username,
            "last_sms_sent": None,
            "sms_count": 0,
            "source": "QR"
        }
        
        # Dodaj do kolekcji użytkownika
        user_clients_ref = db.collection(username)
        doc_ref = user_clients_ref.add(client_data_dict)[1]
        
        print(f"✅ Klient zapisany z kodem: {review_code} dla użytkownika: {username}")
        
        return ClientLoginResponse(
            review_code=review_code,
            message="Dane zostały zapisane pomyślnie"
        )
        
    except Exception as e:
        print(f"❌ Błąd podczas zapisywania danych klienta: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas zapisywania danych: {str(e)}")

# Endpoint do wysyłania SMS
@app.post("/send-sms/{username}/{client_id}", response_model=SMSResponse)
async def send_sms_to_client(username: str, client_id: str):
    """Wyślij SMS do klienta z linkiem do opinii"""
    print(f"📱 Wysyłanie SMS dla użytkownika: {username}, klient: {client_id}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Pobierz konfigurację Twilio dla użytkownika
        twilio_config = get_twilio_client_for_user(username)
        if not twilio_config:
            raise HTTPException(status_code=400, detail="Twilio nie jest skonfigurowany dla tego użytkownika")
        
        # Pobierz dane klienta
        doc_ref = db.collection(username).document(client_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Klient nie został znaleziony")
        
        client_data = doc.to_dict()
        client_phone = client_data.get("phone", "")
        client_name = client_data.get("name", "")
        review_code = client_data.get("review_code", "")
        sms_count = client_data.get("sms_count", 0)
        
        if sms_count >= 2:
            raise HTTPException(status_code=400, detail="Osiągnięto limit SMS dla tego klienta (maksymalnie 2 SMS)")
        
        if not client_phone:
            raise HTTPException(status_code=400, detail="Klient nie ma numeru telefonu")
        
        if not review_code:
            raise HTTPException(status_code=400, detail="Klient nie ma kodu recenzji")
        
        # Pobierz ustawienia użytkownika (szablon wiadomości)
        settings_doc = db.collection(username).document("Dane").get()
        message_template = """Dzień dobry!

Chciałbym przypomnieć o możliwości wystawienia opinii o naszych usługach. 
Wasza opinia jest dla nas bardzo ważna i pomoże innym klientom w podjęciu decyzji.

Link do wystawienia opinii: [LINK]

Z góry dziękuję za poświęcony czas!

Z poważaniem,
[NAZWA_FIRMY]"""
        
        company_name = "Twoja Firma"
        
        if settings_doc.exists:
            settings_data = settings_doc.to_dict()
            if "messaging" in settings_data and "messageTemplate" in settings_data["messaging"]:
                message_template = settings_data["messaging"]["messageTemplate"]
            if "userData" in settings_data and "companyName" in settings_data["userData"]:
                company_name = settings_data["userData"]["companyName"]
        
        # Generuj URL do formularza recenzji
        base_url = os.getenv("FRONTEND_URL", "https://next-reviews-booster-app.web.app")
        review_url = f"{base_url}/review/{review_code}"
        
        # Przygotuj wiadomość SMS
        message = message_template.replace("[LINK]", review_url).replace("[NAZWA_FIRMY]", company_name)
        
        # Wyślij SMS
        result = await send_sms(client_phone, message, twilio_config, username)
        
        # Zaktualizuj status klienta
        now = datetime.now()
        doc_ref.update({
            "review_status": "sent",
            "last_sms_sent": now,
            "updated_at": now,
            "sms_count": sms_count + 1
        })
        
        print(f"✅ SMS wysłany do {client_name} ({client_phone})")
        
        return SMSResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas wysyłania SMS: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas wysyłania SMS: {str(e)}")

# Endpoint do wysyłania SMS bezpośrednio (dla testów)
@app.post("/send-sms-direct/{username}", response_model=SMSResponse)
async def send_sms_direct(username: str, sms_request: SMSRequest):
    """Wyślij SMS bezpośrednio (dla testów)"""
    print(f"📱 Bezpośrednie wysyłanie SMS do: {sms_request.to_phone}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Pobierz konfigurację Twilio dla użytkownika
        twilio_config = get_twilio_client_for_user(username)
        if not twilio_config:
            raise HTTPException(status_code=400, detail="Twilio nie jest skonfigurowany dla tego użytkownika")
        
        result = await send_sms(sms_request.to_phone, sms_request.message, twilio_config, username)
        return SMSResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas wysyłania SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas wysyłania SMS: {str(e)}")

# Endpoint do ręcznego uruchomienia procesu wysyłania przypomnień
@app.post("/reminders/send-now")
async def send_reminders_now():
    """Ręcznie uruchom proces wysyłania przypomnień SMS"""
    print("🚀 Ręczne uruchomienie procesu wysyłania przypomnień")
    
    try:
        result = await check_and_send_reminders()
        return {
            "success": True,
            "message": "Proces wysyłania przypomnień zakończony",
            "timestamp": datetime.now().isoformat(),
            "result": result
        }
    except Exception as e:
        print(f"❌ Błąd podczas ręcznego wysyłania przypomnień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas wysyłania przypomnień: {str(e)}")

# Endpoint do testowania wysyłania przypomnień dla konkretnego użytkownika
@app.post("/reminders/test/{username}")
async def test_reminders_for_user(username: str):
    """Test wysyłania przypomnień dla konkretnego użytkownika"""
    print(f"🧪 Test wysyłania przypomnień dla użytkownika: {username}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Sprawdź ustawienia użytkownika
        settings_doc = db.collection(username).document("Dane").get()
        if not settings_doc.exists:
            raise HTTPException(status_code=404, detail="Użytkownik nie został znaleziony")
        
        settings_data = settings_doc.to_dict()
        auto_send_enabled = False
        reminder_frequency = 7
        
        if "messaging" in settings_data:
            messaging = settings_data["messaging"]
            auto_send_enabled = messaging.get("autoSendEnabled", False)
            reminder_frequency = messaging.get("reminderFrequency", 7)
        
        # Pobierz klientów
        clients = []
        collection = db.collection(username)
        docs = collection.stream()
        
        for doc in docs:
            if doc.id == "Dane":
                continue
            
            client_data = doc.to_dict()
            clients.append({
                "id": doc.id,
                "name": client_data.get("name", ""),
                "phone": client_data.get("phone", ""),
                "review_status": client_data.get("review_status", "not_sent"),
                "last_sms_sent": client_data.get("last_sms_sent"),
                "created_at": client_data.get("created_at")
            })
        
        return {
            "success": True,
            "username": username,
            "auto_send_enabled": auto_send_enabled,
            "reminder_frequency": reminder_frequency,
            "clients_count": len(clients),
            "clients": clients,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas testowania przypomnień: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas testowania: {str(e)}")

# Endpoint do wysyłania wiadomości do wszystkich klientów użytkownika (testowy)
@app.get("/sms-limit/{username}")
async def get_sms_limit(username: str):
    """Sprawdź limit SMS dla użytkownika"""
    try:
        limit_info = check_sms_limit(username)
        return {
            "username": username,
            "limit": limit_info.get("limit", 0),
            "sent": limit_info.get("sent", 0),
            "remaining": limit_info.get("remaining", 0),
            "allowed": limit_info.get("allowed", False),
            "message": limit_info.get("message", "")
        }
    except Exception as e:
        print(f"❌ Błąd podczas sprawdzania limitu SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd sprawdzania limitu: {str(e)}")

@app.post("/send-sms-all/{username}")
async def send_sms_to_all_clients(username: str):
    """Wyślij SMS do wszystkich klientów użytkownika o statusie recenzji różnym od 'completed'"""
    print(f"📱 Wysyłanie SMS do wszystkich klientów użytkownika: {username}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Pobierz konfigurację Twilio dla użytkownika
        twilio_config = get_twilio_client_for_user(username)
        if not twilio_config:
            raise HTTPException(status_code=400, detail="Twilio nie jest skonfigurowany dla tego użytkownika")
        
        # Pobierz ustawienia użytkownika (szablon wiadomości)
        settings_doc = db.collection(username).document("Dane").get()
        message_template = """Dzień dobry!

Chciałbym przypomnieć o możliwości wystawienia opinii o naszych usługach. 
Wasza opinia jest dla nas bardzo ważna i pomoże innym klientom w podjęciu decyzji.

Link do wystawienia opinii: [LINK]

Z góry dziękuję za poświęcony czas!

Z poważaniem,
[NAZWA_FIRMY]"""
        
        company_name = "Twoja Firma"
        
        if settings_doc.exists:
            settings_data = settings_doc.to_dict()
            if "messaging" in settings_data and "messageTemplate" in settings_data["messaging"]:
                message_template = settings_data["messaging"]["messageTemplate"]
            if "userData" in settings_data and "companyName" in settings_data["userData"]:
                company_name = settings_data["userData"]["companyName"]
        
        # Pobierz wszystkich klientów użytkownika (pomijamy dokument "Dane")
        clients_collection = db.collection(username)
        docs = clients_collection.stream()
        
        clients_to_send = []
        total_sent = 0
        errors = []
        
        # Przygotuj listę klientów do wysłania
        for doc in docs:
            # Pomiń dokument "Dane"
            if doc.id == "Dane":
                continue
            
            client_data = doc.to_dict()
            client_id = doc.id
            
            # Sprawdź warunki wysyłki
            review_status = client_data.get("review_status", "not_sent")
            phone = client_data.get("phone", "")
            review_code = client_data.get("review_code", "")
            client_name = client_data.get("name", "")
            sms_count = client_data.get("sms_count", 0)
            
            # Pomiń klientów bez numeru telefonu lub kodu recenzji
            if not phone or not review_code:
                continue
            
            # Pomiń klientów którzy już ukończyli recenzję
            if review_status == "completed":
                continue
            
            # Pomiń klientów którzy osiągnęli limit SMS
            if sms_count >= 2:
                continue
            
            clients_to_send.append({
                "id": client_id,
                "name": client_name,
                "phone": phone,
                "review_code": review_code,
                "review_status": review_status
            })
        
        print(f"📊 Znaleziono {len(clients_to_send)} klientów do wysłania SMS")
        
        # Wyślij SMS do każdego klienta
        for client in clients_to_send:
            try:
                # Generuj URL do formularza recenzji
                base_url = os.getenv("FRONTEND_URL", "https://next-reviews-booster-app.web.app")
                review_url = f"{base_url}/review/{client['review_code']}"
                
                # Przygotuj wiadomość SMS
                message = message_template.replace("[LINK]", review_url).replace("[NAZWA_FIRMY]", company_name)
                
                # Wyślij SMS
                print(f"📱 Wysyłanie SMS do: {client['name']} ({client['phone']})")
                result = await send_sms(client['phone'], message, twilio_config, username)
                
                # Zaktualizuj status klienta
                now = datetime.now()
                doc_ref = db.collection(username).document(client['id'])
                current_client = doc_ref.get()
                current_data = current_client.to_dict()
                current_sms_count = current_data.get("sms_count", 0)
                
                update_data = {
                    "last_sms_sent": now,
                    "updated_at": now,
                    "sms_count": current_sms_count + 1
                }
                
                # Jeśli to pierwszy SMS, zmień status na "sent"
                if client['review_status'] == "not_sent":
                    update_data["review_status"] = "sent"
                
                doc_ref.update(update_data)
                
                total_sent += 1
                print(f"✅ SMS wysłany do: {client['name']}")
                
            except Exception as sms_error:
                error_msg = f"Błąd wysyłania SMS do {client['name']}: {str(sms_error)}"
                print(f"❌ {error_msg}")
                errors.append(error_msg)
                continue
        
        return {
            "success": True,
            "message": f"Proces wysyłania zakończony. Wysłano {total_sent} z {len(clients_to_send)} klientów",
            "total_found": len(clients_to_send),
            "sent": total_sent,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas wysyłania SMS do wszystkich klientów: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas wysyłania SMS: {str(e)}")

# Endpoint dla Twilio StatusCallback
@app.post("/twilio/delivery-status")
async def twilio_delivery_status(request: dict):
    """Endpoint dla statusu dostarczenia SMS od Twilio"""
    print(f"📊 Status dostarczenia SMS: {request}")
    return {"status": "received"}

# Endpoint do sprawdzenia statusu schedulera
@app.get("/reminders/status")
async def get_reminders_status():
    """Sprawdź status schedulera przypomnień"""
    try:
        jobs = scheduler.get_jobs()
        job_info = []
        
        for job in jobs:
            job_info.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "scheduler_running": scheduler.running,
            "jobs": job_info
        }
    except Exception as e:
        print(f"❌ Błąd podczas sprawdzania statusu schedulera: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas sprawdzania statusu: {str(e)}")

# Endpoint dla formularza kontaktowego
@app.post("/contact", response_model=ContactFormResponse)
async def submit_contact_form(contact_data: ContactFormRequest):
    """Wyślij wiadomość kontaktową"""
    print(f"📧 Otrzymano wiadomość kontaktową od: {contact_data.name}")
    print(f"📧 Email: {contact_data.email}")
    if contact_data.company:
        print(f"📧 Firma: {contact_data.company}")
    
    try:
        # Walidacja danych
        if not contact_data.name.strip():
            raise HTTPException(status_code=400, detail="Imię i nazwisko jest wymagane")
        
        if not contact_data.email.strip():
            raise HTTPException(status_code=400, detail="Email jest wymagany")
        
        if not contact_data.message.strip():
            raise HTTPException(status_code=400, detail="Wiadomość jest wymagana")
        
        # Wyślij email
        result = await send_contact_email(contact_data)
        
        return ContactFormResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Błąd podczas przetwarzania formularza kontaktowego: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas przetwarzania formularza: {str(e)}")

# Endpoint do pobierania statystyk użytkownika
@app.get("/statistics/{username}")
async def get_user_statistics(username: str):
    """Pobierz statystyki użytkownika"""
    print(f"📊 Pobieranie statystyk dla użytkownika: {username}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Pobierz wszystkich klientów użytkownika
        clients_ref = db.collection(username)
        docs = clients_ref.stream()
        
        clients = []
        for doc in docs:
            # Pomiń dokument "Dane"
            if doc.id == "Dane":
                continue
            
            client_data = doc.to_dict()
            clients.append(client_data)
        
        # Oblicz statystyki
        total_clients = len(clients)
        
        # Klienci z ukończonymi recenzjami
        completed_reviews = [client for client in clients if client.get("review_status") == "completed"]
        total_reviews = len(completed_reviews)
        
        # Średnia ocena tylko z klientów którzy wystawili opinie
        clients_with_stars = [client for client in completed_reviews if client.get("stars", 0) > 0]
        average_rating = 0
        if clients_with_stars:
            total_stars = sum(client.get("stars", 0) for client in clients_with_stars)
            average_rating = round(total_stars / len(clients_with_stars), 1)
        
        # Opinie w tym miesiącu
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        reviews_this_month = 0
        for client in completed_reviews:
            updated_at = client.get("updated_at")
            if updated_at:
                # Konwertuj Firebase Timestamp na datetime jeśli potrzeba
                updated_at = convert_firebase_timestamp_to_naive(updated_at)
                
                if updated_at.month == current_month and updated_at.year == current_year:
                    reviews_this_month += 1
        
        # Zlicz SMS-y
        sms_sent = len([client for client in clients if client.get("last_sms_sent")])
        
        # Wskaźnik konwersji
        conversion_rate = 0
        if total_clients > 0:
            conversion_rate = round((total_reviews / total_clients) * 100, 1)
        
        statistics = {
            "total_clients": total_clients,
            "total_reviews": total_reviews,
            "average_rating": average_rating,
            "reviews_this_month": reviews_this_month,
            "sms_sent": sms_sent,
            "conversion_rate": conversion_rate
        }
        
        print(f"✅ Statystyki dla {username}: {statistics}")
        return statistics
        
    except Exception as e:
        print(f"❌ Błąd podczas pobierania statystyk: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas pobierania statystyk: {str(e)}")

# Endpoint do pobierania uprawnień na podstawie email
@app.get("/user-permission-by-email/{email}")
async def get_user_permission_by_email(email: str):
    """Pobierz uprawnienia użytkownika na podstawie email"""
    print(f"🔍 Sprawdzanie uprawnień dla email: {email}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Znajdź użytkownika po email w bazie danych
        collections = db.collections()
        found_username = None
        
        for collection in collections:
            collection_name = collection.id
            
            # Pomiń kolekcje systemowe
            if collection_name in ["temp_clients"]:
                continue
            
            try:
                settings_doc = db.collection(collection_name).document("Dane").get()
                if settings_doc.exists:
                    settings_data = settings_doc.to_dict()
                    user_email = settings_data.get("userData", {}).get("email", "")
                    if user_email == email:
                        found_username = collection_name
                        break
            except Exception as e:
                print(f"⚠️ Błąd sprawdzania kolekcji {collection_name}: {str(e)}")
                continue
        
        if not found_username:
            print(f"❌ Nie znaleziono użytkownika z emailem: {email}")
            return {
                "username": None,
                "permission": "Demo",
                "message": f"Nie znaleziono użytkownika z emailem: {email}"
            }
        
        # Pobierz uprawnienia znalezionego użytkownika
        permission = get_user_permission_from_db(found_username)
        print(f"✅ Uprawnienia użytkownika {found_username} (email: {email}): {permission}")
        
        return {
            "username": found_username,
            "permission": permission,
            "message": f"Uprawnienia użytkownika {found_username}: {permission}"
        }
        
    except Exception as e:
        print(f"❌ Błąd pobierania uprawnień: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd pobierania uprawnień: {str(e)}")

# Endpoint do pobierania wszystkich użytkowników (tylko dla adminów)
@app.get("/admin/users")
async def get_all_users():
    """Pobierz wszystkich zarejestrowanych użytkowników"""
    print(f"👥 Pobieranie wszystkich użytkowników")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        users = []
        collections = db.collections()
        
        for collection in collections:
            collection_name = collection.id
            
            # Pomiń kolekcje systemowe
            if collection_name in ["temp_clients"]:
                continue
            
            try:
                # Pobierz dane użytkownika
                settings_doc = db.collection(collection_name).document("Dane").get()
                if settings_doc.exists:
                    settings_data = settings_doc.to_dict()
                    
                    # Wyciągnij podstawowe informacje o użytkowniku
                    user_data = settings_data.get("userData", {})
                    permission = settings_data.get("permission", "Demo")
                    twilio_settings = settings_data.get("twilio", {})
                    messaging_settings = settings_data.get("messaging", {})
                    
                    # Policz klientów użytkownika
                    clients_count = 0
                    try:
                        # Pobierz wszystkie dokumenty w kolekcji użytkownika (pomijając "Dane" i "SMS")
                        user_collection = db.collection(collection_name)
                        docs = user_collection.stream()
                        for doc in docs:
                            doc_id = doc.id
                            # Pomiń dokumenty systemowe
                            if doc_id not in ["Dane", "SMS"]:
                                clients_count += 1
                    except Exception as e:
                        print(f"⚠️ Błąd liczenia klientów dla {collection_name}: {str(e)}")
                        clients_count = 0
                    
                    user_info = {
                        "username": collection_name,
                        "email": user_data.get("email", ""),
                        "name": user_data.get("name", ""),
                        "surname": user_data.get("surname", ""),
                        "companyName": user_data.get("companyName", ""),
                        "permission": permission,
                        "twilio": {
                            "account_sid": twilio_settings.get("account_sid", ""),
                            "auth_token": twilio_settings.get("auth_token", ""),
                            "phone_number": twilio_settings.get("phone_number", ""),
                            "messaging_service_sid": twilio_settings.get("messaging_service_sid", "")
                        },
                        "smsLimit": messaging_settings.get("smsLimit", 10),
                        "smsCount": messaging_settings.get("smsCount", 0),
                        "clientsCount": clients_count,
                        "created_at": settings_data.get("created_at", ""),
                        "updated_at": settings_data.get("updated_at", "")
                    }
                    
                    users.append(user_info)
                    print(f"✅ Znaleziono użytkownika: {collection_name} ({user_data.get('email', 'Brak email')})")
                    
            except Exception as e:
                print(f"⚠️ Błąd pobierania danych użytkownika {collection_name}: {str(e)}")
                continue
        
        print(f"📊 Znaleziono {len(users)} użytkowników")
        return {
            "users": users,
            "total": len(users),
            "message": f"Znaleziono {len(users)} użytkowników"
        }
        
    except Exception as e:
        print(f"❌ Błąd pobierania użytkowników: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd pobierania użytkowników: {str(e)}")

# Endpoint do aktualizacji uprawnień użytkownika
@app.put("/admin/users/{username}/permission")
async def update_user_permission_admin(username: str, permission_data: dict):
    """Aktualizuj uprawnienia użytkownika"""
    print(f"🔐 Aktualizacja uprawnień dla {username}: {permission_data}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Sprawdź czy użytkownik istnieje
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Użytkownik {username} nie istnieje")
        
        # Pobierz aktualne dane
        settings_data = doc.to_dict()
        
        # Aktualizuj uprawnienia
        new_permission = permission_data.get("permission", "Demo")
        settings_data["permission"] = new_permission
        settings_data["updated_at"] = datetime.now().isoformat()
        
        # Aktualizuj SMS limit na podstawie nowych uprawnień
        sms_limit = get_sms_limit_for_permission(UserPermission(new_permission))
        if "messaging" not in settings_data:
            settings_data["messaging"] = {}
        settings_data["messaging"]["smsLimit"] = sms_limit
        
        # Zapisz zmiany
        doc_ref.set(settings_data)
        
        print(f"✅ Uprawnienia zaktualizowane: {username} -> {new_permission} (SMS limit: {sms_limit})")
        
        return {
            "success": True,
            "message": f"Uprawnienia użytkownika {username} zaktualizowane na {new_permission}",
            "username": username,
            "permission": new_permission,
            "smsLimit": sms_limit
        }
        
    except Exception as e:
        print(f"❌ Błąd aktualizacji uprawnień: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd aktualizacji uprawnień: {str(e)}")

# Endpoint do aktualizacji konfiguracji Twilio użytkownika
@app.put("/admin/users/{username}/twilio")
async def update_user_twilio_admin(username: str, twilio_data: dict):
    """Aktualizuj konfigurację Twilio użytkownika"""
    print(f"📱 Aktualizacja Twilio dla {username}: {twilio_data}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Sprawdź czy użytkownik istnieje
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Użytkownik {username} nie istnieje")
        
        # Pobierz aktualne dane
        settings_data = doc.to_dict()
        
        # Aktualizuj konfigurację Twilio
        if "twilio" not in settings_data:
            settings_data["twilio"] = {}
        
        settings_data["twilio"].update({
            "account_sid": twilio_data.get("account_sid", ""),
            "auth_token": twilio_data.get("auth_token", ""),
            "phone_number": twilio_data.get("phone_number", ""),
            "messaging_service_sid": twilio_data.get("messaging_service_sid", "")
        })
        
        settings_data["updated_at"] = datetime.now().isoformat()
        
        # Zapisz zmiany
        doc_ref.set(settings_data)
        
        print(f"✅ Twilio zaktualizowane dla {username}")
        
        return {
            "success": True,
            "message": f"Konfiguracja Twilio dla {username} zaktualizowana",
            "username": username,
            "twilio": settings_data["twilio"]
        }
        
    except Exception as e:
        print(f"❌ Błąd aktualizacji Twilio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd aktualizacji Twilio: {str(e)}")

# Endpoint do pobierania statystyk SMS użytkownika
@app.get("/admin/users/{username}/sms-stats")
async def get_user_sms_stats(username: str):
    """Pobierz statystyki SMS użytkownika"""
    print(f"📊 Pobieranie statystyk SMS dla {username}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Sprawdź czy użytkownik istnieje
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Użytkownik {username} nie istnieje")
        
        settings_data = doc.to_dict()
        messaging_settings = settings_data.get("messaging", {})
        
        # Pobierz licznik SMS z ustawień
        sms_count = messaging_settings.get("smsCount", 0)
        sms_limit = messaging_settings.get("smsLimit", 10)
        
        # Pobierz szczegóły SMS z kolekcji miesięcznych
        current_month = datetime.now().strftime("%Y-%m")
        sms_collection = db.collection(username).document("SMS").collection(current_month)
        sms_docs = list(sms_collection.stream())
        
        # Statystyki miesięczne
        monthly_sent = len(sms_docs)
        monthly_remaining = max(0, sms_limit - monthly_sent)
        
        # Statystyki z ostatnich 3 miesięcy
        stats_by_month = {}
        for i in range(3):
            month = (datetime.now() - timedelta(days=30*i)).strftime("%Y-%m")
            month_collection = db.collection(username).document("SMS").collection(month)
            month_docs = list(month_collection.stream())
            stats_by_month[month] = len(month_docs)
        
        print(f"📊 Statystyki SMS dla {username}: wysłane={sms_count}, limit={sms_limit}")
        
        return {
            "username": username,
            "total_sent": sms_count,
            "sms_limit": sms_limit,
            "monthly_sent": monthly_sent,
            "monthly_remaining": monthly_remaining,
            "stats_by_month": stats_by_month,
            "current_month": current_month,
            "usage_percentage": round((monthly_sent / sms_limit) * 100, 2) if sms_limit > 0 else 0
        }
        
    except Exception as e:
        print(f"❌ Błąd pobierania statystyk SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd pobierania statystyk SMS: {str(e)}")

# Endpoint do ręcznego resetowania limitu SMS
@app.post("/admin/users/{username}/reset-sms-limit")
async def reset_user_sms_limit(username: str):
    """Ręcznie zresetuj limit SMS dla użytkownika"""
    print(f"🔄 Ręczne resetowanie limitu SMS dla {username}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Sprawdź czy użytkownik istnieje
        doc_ref = db.collection(username).document("Dane")
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Użytkownik {username} nie istnieje")
        
        settings_data = doc.to_dict()
        permission = settings_data.get("permission", "Demo")
        
        # Pobierz limit na podstawie uprawnień
        sms_limit = get_sms_limit_for_permission(UserPermission(permission))
        current_month = datetime.now().strftime("%Y-%m")
        
        # Zresetuj limit
        success = reset_sms_limit_for_month(username, current_month, sms_limit)
        
        if success:
            return {
                "success": True,
                "message": f"Limit SMS zresetowany dla {username}",
                "username": username,
                "sms_limit": sms_limit,
                "month": current_month
            }
        else:
            raise HTTPException(status_code=500, detail="Błąd resetowania limitu SMS")
        
    except Exception as e:
        print(f"❌ Błąd resetowania limitu SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd resetowania limitu SMS: {str(e)}")

# Endpoint do resetowania limitu SMS dla wszystkich użytkowników
@app.post("/admin/reset-all-sms-limits")
async def reset_all_sms_limits():
    """Zresetuj limit SMS dla wszystkich użytkowników (nowy miesiąc)"""
    print(f"🔄 Resetowanie limitów SMS dla wszystkich użytkowników")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        current_month = datetime.now().strftime("%Y-%m")
        reset_count = 0
        errors = []
        
        # Pobierz wszystkich użytkowników
        collections = db.collections()
        
        for collection in collections:
            collection_name = collection.id
            
            # Pomiń kolekcje systemowe
            if collection_name in ["temp_clients"]:
                continue
            
            try:
                # Sprawdź czy to użytkownik
                settings_doc = db.collection(collection_name).document("Dane").get()
                if settings_doc.exists:
                    settings_data = settings_doc.to_dict()
                    permission = settings_data.get("permission", "Demo")
                    sms_limit = get_sms_limit_for_permission(UserPermission(permission))
                    
                    # Zresetuj limit
                    success = reset_sms_limit_for_month(collection_name, current_month, sms_limit)
                    if success:
                        reset_count += 1
                    else:
                        errors.append(f"Błąd resetowania dla {collection_name}")
                        
            except Exception as e:
                errors.append(f"Błąd dla {collection_name}: {str(e)}")
                continue
        
        print(f"✅ Zresetowano limity dla {reset_count} użytkowników")
        
        return {
            "success": True,
            "message": f"Zresetowano limity SMS dla {reset_count} użytkowników",
            "reset_count": reset_count,
            "month": current_month,
            "errors": errors
        }
        
    except Exception as e:
        print(f"❌ Błąd resetowania limitów SMS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd resetowania limitów SMS: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    print("🚀 Uruchamianie next review booster API...")
    print(f"🔧 Port: {port}")
    print(f"🌐 API: http://0.0.0.0:{port}")
    print(f"📚 Dokumentacja: http://0.0.0.0:{port}/docs")
    print(f"❤️  Health Check: http://0.0.0.0:{port}/health")

    is_production = os.getenv("ENVIRONMENT") == "production" or os.getenv("RENDER") == "true"
    
    uvicorn.run(
        "backend_main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=not is_production  
    )
