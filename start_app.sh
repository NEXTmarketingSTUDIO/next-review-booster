#!/bin/bash

# 🚀 Skrypt uruchamiający NextReviews - Frontend + Backend
# Autor: NextReviews Team
# Opis: Uruchamia jednocześnie React frontend i FastAPI backend

echo "🎉 Uruchamianie aplikacji NextReviews..."
echo "=================================="

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcja do sprawdzania czy port jest zajęty
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $1 jest już zajęty!${NC}"
        echo -e "${YELLOW}💡 Zatrzymaj proces używający portu $1 lub zmień port w konfiguracji${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $1 jest wolny${NC}"
        return 0
    fi
}

# Funkcja do sprawdzania czy program jest zainstalowany
check_installed() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 jest zainstalowany${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 nie jest zainstalowany${NC}"
        return 1
    fi
}

# Sprawdź wymagania
echo -e "${BLUE}🔍 Sprawdzanie wymagań...${NC}"
echo ""

# Sprawdź Node.js
if ! check_installed "node"; then
    echo -e "${RED}❌ Node.js nie jest zainstalowany!${NC}"
    echo -e "${YELLOW}💡 Zainstaluj Node.js z: https://nodejs.org/${NC}"
    exit 1
fi

# Sprawdź npm
if ! check_installed "npm"; then
    echo -e "${RED}❌ npm nie jest zainstalowany!${NC}"
    echo -e "${YELLOW}💡 npm powinien być dołączony do Node.js${NC}"
    exit 1
fi

# Sprawdź Python
if ! check_installed "python3"; then
    echo -e "${RED}❌ Python3 nie jest zainstalowany!${NC}"
    echo -e "${YELLOW}💡 Zainstaluj Python3 z: https://python.org/${NC}"
    exit 1
fi

# Sprawdź pip
if ! check_installed "pip3"; then
    echo -e "${RED}❌ pip3 nie jest zainstalowany!${NC}"
    echo -e "${YELLOW}💡 Zainstaluj pip3${NC}"
    exit 1
fi

echo ""

# Sprawdź porty
echo -e "${BLUE}🔍 Sprawdzanie portów...${NC}"
if ! check_port 3000; then
    echo -e "${YELLOW}💡 Frontend będzie próbował użyć portu 3000${NC}"
fi

if ! check_port 8000; then
    echo -e "${YELLOW}💡 Backend będzie próbował użyć portu 8000${NC}"
fi

echo ""

# Sprawdź czy foldery istnieją
echo -e "${BLUE}🔍 Sprawdzanie struktury projektu...${NC}"
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Folder 'frontend' nie istnieje!${NC}"
    exit 1
fi

if [ ! -f "backend/backend_main.py" ]; then
    echo -e "${RED}❌ Plik 'backend_main.py' nie istnieje!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Struktura projektu jest poprawna${NC}"
echo ""

# Instalacja zależności frontend
echo -e "${BLUE}📦 Instalacja zależności frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Instaluję zależności npm...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Błąd instalacji zależności frontend!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Zależności frontend już zainstalowane${NC}"
fi

cd ..
cd backend

# Instalacja zależności backend
echo -e "${BLUE}📦 Instalacja zależności backend...${NC}"
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Plik 'requirements.txt' nie istnieje!${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Instaluję zależności Python...${NC}"
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Błąd instalacji zależności backend!${NC}"
    exit 1
fi

echo ""

# Funkcja do zatrzymania procesów
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Zatrzymywanie aplikacji...${NC}"
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend zatrzymany${NC}"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend zatrzymany${NC}"
    fi
    echo -e "${BLUE}👋 Do widzenia!${NC}"
    exit 0
}

# Ustaw trap dla Ctrl+C
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}🚀 Uruchamianie aplikacji...${NC}"
echo ""

# Uruchom backend w tle
echo -e "${BLUE}🔧 Uruchamianie FastAPI backend (port 8000)...${NC}"
python3 backend_main.py &
BACKEND_PID=$!

# Poczekaj chwilę na uruchomienie backend
sleep 3

# Sprawdź czy backend się uruchomił
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend nie uruchomił się poprawnie!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend uruchomiony (PID: $BACKEND_PID)${NC}"

cd ..

# Uruchom frontend w tle
echo -e "${BLUE}⚛️  Uruchamianie React frontend (port 3000)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Poczekaj chwilę na uruchomienie frontend
sleep 3

# Sprawdź czy frontend się uruchomił
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend nie uruchomił się poprawnie!${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ Frontend uruchomiony (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}🎉 Aplikacja NextReviews uruchomiona pomyślnie!${NC}"
echo "=================================="
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 Backend:${NC}  http://localhost:8000"
echo -e "${BLUE}📚 API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}💡 Naciśnij Ctrl+C aby zatrzymać aplikację${NC}"
echo ""

# Wyświetl logi w czasie rzeczywistym
echo -e "${BLUE}📋 Logi aplikacji:${NC}"
echo "=================================="

# Funkcja do wyświetlania logów
show_logs() {
    while true; do
        sleep 1
        # Sprawdź czy procesy nadal działają
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${RED}❌ Backend zatrzymał się nieoczekiwanie!${NC}"
            cleanup
            exit 1
        fi
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${RED}❌ Frontend zatrzymał się nieoczekiwanie!${NC}"
            cleanup
            exit 1
        fi
    done
}

# Uruchom monitorowanie logów
show_logs
