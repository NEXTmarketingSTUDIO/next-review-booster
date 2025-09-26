#!/usr/bin/env python3
"""
Skrypt do ekstraktowania danych Firebase z pliku JSON
i generowania zmiennych środowiskowych dla Render
"""

import json
import os
import sys

def extract_firebase_env():
    """Ekstraktuje dane Firebase z pliku JSON i wyświetla zmienne środowiskowe"""
    
    # Ścieżka do pliku Firebase
    firebase_file = "next-reviews-9d19c-firebase-adminsdk-fbsvc-ffec0c49f4.json"
    
    if not os.path.exists(firebase_file):
        print(f"❌ Plik {firebase_file} nie został znaleziony!")
        print("Upewnij się, że plik Firebase Admin SDK znajduje się w katalogu backend/")
        return False
    
    try:
        with open(firebase_file, 'r') as f:
            firebase_data = json.load(f)
        
        print("🔧 Zmienne środowiskowe dla Render:")
        print("=" * 50)
        
        # Podstawowe zmienne
        print("PORT=8000")
        print("ENVIRONMENT=production")
        print("RENDER=true")
        print()
        
        # Firebase zmienne
        print("# Firebase Configuration")
        print(f"FIREBASE_PROJECT_ID={firebase_data.get('project_id', '')}")
        print(f"FIREBASE_PRIVATE_KEY_ID={firebase_data.get('private_key_id', '')}")
        
        # Klucz prywatny - zachowaj formatowanie
        private_key = firebase_data.get('private_key', '')
        if private_key:
            # Zastąp rzeczywiste nowe linie przez \n
            formatted_key = private_key.replace('\n', '\\n')
            print(f"FIREBASE_PRIVATE_KEY={formatted_key}")
        
        print(f"FIREBASE_CLIENT_EMAIL={firebase_data.get('client_email', '')}")
        print(f"FIREBASE_CLIENT_ID={firebase_data.get('client_id', '')}")
        print(f"FIREBASE_AUTH_URI={firebase_data.get('auth_uri', '')}")
        print(f"FIREBASE_TOKEN_URI={firebase_data.get('token_uri', '')}")
        print(f"FIREBASE_AUTH_PROVIDER_X509_CERT_URL={firebase_data.get('auth_provider_x509_cert_url', '')}")
        print(f"FIREBASE_CLIENT_X509_CERT_URL={firebase_data.get('client_x509_cert_url', '')}")
        
        print()
        print("=" * 50)
        print("✅ Skopiuj powyższe zmienne do konfiguracji Render")
        print("📝 Instrukcje: RENDER_DEPLOYMENT.md")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Błąd parsowania JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Błąd: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Ekstraktowanie danych Firebase dla Render...")
    print()
    
    success = extract_firebase_env()
    
    if success:
        print()
        print("🎉 Gotowe! Możesz teraz skonfigurować Render.")
    else:
        print()
        print("💥 Wystąpił błąd. Sprawdź plik Firebase i spróbuj ponownie.")
        sys.exit(1)
