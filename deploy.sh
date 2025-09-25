#!/bin/bash

# 🚀 Skrypt deploymentu NextReviews
# Deployuje frontend na Firebase Hosting

echo "🚀 Rozpoczynam deployment NextReviews..."

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ Błąd: Nie znaleziono firebase.json${NC}"
    echo -e "${YELLOW}💡 Uruchom skrypt z głównego katalogu projektu${NC}"
    exit 1
fi

# Sprawdź czy frontend istnieje
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Błąd: Nie znaleziono folderu frontend${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Budowanie frontendu...${NC}"

# Przejdź do folderu frontend
cd frontend

# Sprawdź czy node_modules istnieje
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Instaluję zależności...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Błąd instalacji zależności${NC}"
        exit 1
    fi
fi

# Zbuduj aplikację
echo -e "${BLUE}🔨 Budowanie aplikacji...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd budowania aplikacji${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Aplikacja zbudowana pomyślnie${NC}"

# Wróć do głównego katalogu
cd ..

# Sprawdź czy folder dist istnieje
if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}❌ Błąd: Nie znaleziono folderu dist${NC}"
    exit 1
fi

echo -e "${BLUE}🔥 Deployowanie na Firebase Hosting...${NC}"

# Deploy na Firebase
npx firebase-tools deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deployment zakończony pomyślnie!${NC}"
    echo -e "${BLUE}📱 Aplikacja dostępna pod adresem:${NC}"
    echo -e "${YELLOW}https://next-reviews-9d19c.web.app${NC}"
    echo ""
    echo -e "${BLUE}💡 Przydatne linki:${NC}"
    echo -e "   • Firebase Console: https://console.firebase.google.com/project/next-reviews-9d19c"
    echo -e "   • Hosting: https://console.firebase.google.com/project/next-reviews-9d19c/hosting"
    echo ""
else
    echo -e "${RED}❌ Błąd deploymentu${NC}"
    echo -e "${YELLOW}💡 Sprawdź czy jesteś zalogowany do Firebase: npx firebase-tools login${NC}"
    exit 1
fi
