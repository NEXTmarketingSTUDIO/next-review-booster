from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
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
            # Użyj zmiennych środowiskowych (dla Render/produkcji)
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
        "https://next-reviews-9d19c.web.app",
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
    surname: str
    phone: str
    email: str
    note: str = ""
    stars: int = 0  # Domyślnie 0 - będzie ustawiane przez klienta
    review: str = ""  # Domyślnie puste - będzie wypełniane przez klienta
    review_code: str = ""  # Unikalny kod do wystawiania opinii
    review_status: str = "not_sent"  # Status recenzji: not_sent, sent, opened, completed

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    note: Optional[str] = None
    stars: Optional[int] = None
    review: Optional[str] = None
    review_code: Optional[str] = None
    review_status: Optional[str] = None

class ClientResponse(BaseModel):
    id: str
    name: str
    surname: str
    phone: str
    email: str
    note: str = ""
    stars: int = 0
    review: str = ""
    review_code: str = ""
    review_status: str = "not_sent"
    created_at: datetime
    updated_at: datetime

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

class MessagingSettings(BaseModel):
    reminderFrequency: int = 7
    messageTemplate: str = ""

class UserSettings(BaseModel):
    userData: UserData
    messaging: MessagingSettings

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
    surname: str
    phone: str

class ClientLoginResponse(BaseModel):
    review_code: str
    message: str

# Funkcja do generowania unikalnego kodu recenzji
def generate_review_code():
    """Generuje unikalny kod recenzji (10 znaków alfanumerycznych)"""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(10))

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
            "review_status": "not_sent"
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
    
    try:
        print(f"📂 Próba dostępu do kolekcji: {username}")
        clients_ref = db.collection(username)
        docs = clients_ref.stream()
        
        clients = []
        doc_count = 0
        for doc in docs:
            doc_count += 1
            print(f"📄 Dokument {doc_count}: {doc.id}")
            client_data = doc.to_dict()
            client_data["id"] = doc.id
            print(f"📊 Dane klienta: {client_data}")
            
            try:
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
            print("ℹ️ Brak ustawień, zwracam domyślne")
            # Zwróć domyślne ustawienia
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
                    messageTemplate="""Dzień dobry!

Chciałbym przypomnieć o możliwości wystawienia opinii o naszych usługach. 
Wasza opinia jest dla nas bardzo ważna i pomoże innym klientom w podjęciu decyzji.

Link do wystawienia opinii: [LINK]

Z góry dziękuję za poświęcony czas!

Z poważaniem,
[NAZWA_FIRMY]"""
                )
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
                    break
                
                if found_client:
                    break
        
        if found_client:
            print(f"✅ Znaleziono klienta: {found_client['name']} {found_client['surname']}")
            
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
            
            # Pobierz ustawienia firmy (dla stałych klientów)
            company_name = "Twoja Firma"  # Domyślna nazwa
            if not is_temp_client:
                try:
                    collections = db.collections()
                    for collection in collections:
                        collection_name = collection.id
                        if collection_name in ["Dane", "temp_clients"]:
                            continue
                        docs = collection.where("review_code", "==", review_code).stream()
                        if docs:
                            settings_doc = db.collection(collection_name).document("Dane").get()
                            if settings_doc.exists:
                                settings_data = settings_doc.to_dict()
                                if "userData" in settings_data and "companyName" in settings_data["userData"]:
                                    company_name = settings_data["userData"]["companyName"]
                            break
                except Exception as e:
                    print(f"⚠️ Nie można pobrać ustawień firmy: {e}")
            
            return {
                "review_code": review_code,
                "client_name": f"{found_client['name']} {found_client['surname']}",
                "company_name": company_name
            }
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
        else:
            # Dla stałych klientów
            collections = db.collections()
            for collection in collections:
                collection_name = collection.id
                if collection_name in ["Dane", "temp_clients"]:
                    continue
                docs = collection.where("review_code", "==", review_code).stream()
                for doc in docs:
                    doc_ref = db.collection(collection_name).document(doc.id)
                    doc_ref.update({
                        "stars": review_data.stars,
                        "review": review_data.review,
                        "review_status": "completed",
                        "updated_at": datetime.now()
                    })
                    break
                if docs:
                    break
        
        print(f"✅ Ocena zapisana: {review_data.stars} gwiazdek dla {found_client['name']} {found_client['surname']}")
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
        # Sprawdź czy frontend działa na porcie 3002 (z terminala widzę, że tak)
        client_login_url = f"http://localhost:3002/client-login"
        
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
        review_url = f"http://localhost:3002/review/{review_code}"
        
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
@app.post("/client-login", response_model=ClientLoginResponse)
async def client_login(client_data: ClientLoginRequest):
    """Zapisz dane klienta i wygeneruj kod recenzji"""
    print(f"👤 Logowanie klienta: {client_data.name} {client_data.surname}")
    
    if not db:
        raise HTTPException(status_code=500, detail="Firebase nie jest skonfigurowany")
    
    try:
        # Generuj unikalny kod recenzji
        review_code = generate_review_code()
        
        # Zapisz dane klienta w kolekcji "temp_clients" (tymczasowi klienci)
        temp_client_data = {
            "name": client_data.name,
            "surname": client_data.surname,
            "phone": client_data.phone,
            "review_code": review_code,
            "created_at": datetime.now(),
            "status": "pending_review"
        }
        
        # Dodaj do kolekcji temp_clients
        temp_clients_ref = db.collection("temp_clients")
        doc_ref = temp_clients_ref.add(temp_client_data)[1]
        
        print(f"✅ Klient zapisany z kodem: {review_code}")
        
        return ClientLoginResponse(
            review_code=review_code,
            message="Dane zostały zapisane pomyślnie"
        )
        
    except Exception as e:
        print(f"❌ Błąd podczas zapisywania danych klienta: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd podczas zapisywania danych: {str(e)}")

# Uruchomienie serwera
if __name__ == "__main__":
    # Pobierz port z zmiennej środowiskowej (Render automatycznie ustawia PORT)
    port = int(os.getenv("PORT", 8000))
    
    print("🚀 Uruchamianie next review booster API...")
    print(f"🔧 Port: {port}")
    print(f"🌐 API: http://0.0.0.0:{port}")
    print(f"📚 Dokumentacja: http://0.0.0.0:{port}/docs")
    print(f"❤️  Health Check: http://0.0.0.0:{port}/health")
    
    # Sprawdź czy jesteśmy w środowisku produkcyjnym
    is_production = os.getenv("ENVIRONMENT") == "production" or os.getenv("RENDER") == "true"
    
    uvicorn.run(
        "backend_main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=not is_production  # Tylko w trybie development
    )
