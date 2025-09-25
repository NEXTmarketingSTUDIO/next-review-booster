from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn

app = FastAPI(
    title="NextReviews API", 
    version="1.0.0",
    description="API dla aplikacji NextReviews - zarządzanie recenzjami"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
    version: str = "1.0.0"

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        message="NextReviews API działa poprawnie! 🚀",
        timestamp=datetime.now(),
        version="1.0.0"
    )

@app.get("/")
async def root():
    return {
        "message": "Witaj w NextReviews API! 🎉",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Uruchomienie serwera
if __name__ == "__main__":
    print("🚀 Uruchamianie NextReviews API...")
    print("📱 Frontend: http://localhost:3000")
    print("🔧 API: http://localhost:8000")
    print("📚 Dokumentacja: http://localhost:8000/docs")
    print("❤️  Health Check: http://localhost:8000/health")
    
    uvicorn.run(
        "backend_main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )
