import os
from pathlib import Path
from dotenv import load_dotenv

# config.py dosyasının bulunduğu yer üzerinden backend kök dizinindeki .env dosyasını bulur
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_TITLE: str = "FundFlow API"
    PROJECT_VERSION: str = "1.0.0"
    
    # Supabase PostgreSQL URI
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Stellar Mainnet Yapılandırması
    STELLAR_RPC_URL: str = os.getenv("STELLAR_RPC_URL", "https://mainnet.stellar.org:443")
    STELLAR_NETWORK_PASSPHRASE: str = os.getenv(
        "STELLAR_NETWORK_PASSPHRASE", 
        "Public Global Stellar Network ; September 2015"
    )
    
    # Sponsor / Mainnet Deployer Public Key
    SPONSOR_PUBLIC_KEY: str = os.getenv(
        "SPONSOR_PUBLIC_KEY", 
        "GDV45VUQ6EYNOHEBIPKRIRKNEV5P6IPPCTN4PMGVE2VUS6RGGSZZTFK4"
    )
    
    # Canlıya geçince kontrat ID geldikçe .env üzerinden okunacak
    STELLAR_CAMPAIGN_CONTRACT_ID: str = os.getenv("STELLAR_CAMPAIGN_CONTRACT_ID", "")

settings = Settings()

# DATABASE_URL kontrolü
if not settings.DATABASE_URL:
    raise ValueError("KRİTİK HATA: .env dosyası içerisinde 'DATABASE_URL' bulunamadı!")