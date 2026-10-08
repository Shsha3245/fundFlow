from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import campaigns, admin, wallet

app = FastAPI(
    title=settings.PROJECT_TITLE,
    version=settings.PROJECT_VERSION
)
origins = [
    "http://localhost:3000",
    "http://localhost:3001",  # Frontend'in çalıştığı port eklendi
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://fundflow.vercel.app",
]

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Veritabanını Başlat
init_db()

# Router'ları Ekle
app.include_router(campaigns.router)
app.include_router(admin.router)
app.include_router(wallet.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "FundFlow API is running"}