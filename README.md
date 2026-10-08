# 🚀 FundFlow — Decentralized Sports Crowdfunding Platform

FundFlow, amatör spor kulüpleri, genç yetenekler ve altyapı projeleri için Stellar blockchain & Soroban akıllı kontratları altyapısıyla geliştirilmiş merkeziyetsiz bir bağış ve fonlama platformudur.

---

## 🏗️ Proje Mimarısı (Repository Structure)

```text
myCoin/
├── backend/                  # FastAPI Web Servisi (Python)
├── frontend/                 # Next.js Web Arayüzü (React/TypeScript)
├── soroban-campaign-contract/# Soroban Smart Contract (Rust)
└── .github/workflows/        # CI/CD Pipeline Yapılandırmaları
🛠️ Teknolojiler & Stack
Smart Contracts: Stellar Soroban (Rust SDK)

Backend: FastAPI, Python 3.12, Uvicorn

Database: Supabase PostgreSQL (Session/Transaction Pooler)

Frontend: Next.js, React, Tailwind CSS, Axios

Blockchain Network: Stellar Mainnet / Testnet (Soroban RPC & Horizon)

⚡ Hızlı Başlangıç (Local Setup)
1. Repository'yi Klonlayın
Bash
git clone [https://github.com/Shsha3245/myCoin.git](https://github.com/Shsha3245/myCoin.git)
cd myCoin
2. Backend Kurulumu (FastAPI)
Bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
.env dosyasını backend/ klasörü altında oluşturun:

Kod snippet'i
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
STELLAR_RPC_URL=[https://mainnet.stellar.org:443](https://mainnet.stellar.org:443)
STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
SPONSOR_PUBLIC_KEY=GDV45VUQ6EYNOHEBIPKRIRKNEV5P6IPPCTN4PMGVE2VUS6RGGSZZTFK4
STELLAR_CAMPAIGN_CONTRACT_ID=
Backend'i başlatın:

Bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
3. Frontend Kurulumu (Next.js)
Bash
cd ../frontend
npm install
npm run dev
Frontend varsayılan olarak http://localhost:3000 (veya http://localhost:3001) adresinde çalışacaktır.

🔒 Güvenlik ve Akıllı Kontrat Yapısı
PostgreSQL Pooler: IPv4/WSL ağ sınırlarını aşmak ve güvenli bağlantı sağlamak için Supabase Pooler (Port 6543) mimarisi kullanılır.

Transaksiyon Doğrulama: Kampanya desteklerinde ve token transferlerinde Stellar On-Chain doğrulama mekanizmaları ve güvenli exception handling uygulanmaktadır.

RSI/MACD & Analiz Servisleri: Kulüp ve sporcu token'larının piyasa verileri FastAPI üzerinden real-time taranmaktadır.

👥 Katkıda Bulunma & Lisans
Bu proje Rise In / Stellar Pro Hackathon kapsamında Seçkin Dalgıç tarafından geliştirilmektedir. MIT Lisansı altındadır.


---

### Step 3: README'yi GitHub'a Gönderme

Dosyayı kaydettikten sonra terminalde:

```bash
git add README.md
git commit -m "docs: add comprehensive README for FundFlow"
git push origin main
