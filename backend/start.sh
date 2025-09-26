#!/bin/bash

# Skrypt startowy dla Render
echo "🚀 Uruchamianie next review booster API na Render..."

# Sprawdź czy PORT jest ustawiony (Render automatycznie ustawia PORT)
if [ -z "$PORT" ]; then
    export PORT=8000
fi

echo "📡 Port: $PORT"
echo "🔧 Środowisko: $ENVIRONMENT"

# Uruchom aplikację
cd /opt/render/project/src/backend
python backend_main.py
