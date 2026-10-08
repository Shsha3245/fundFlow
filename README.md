# FundFlow

FundFlow, toplulukların ve spor projelerinin fonlama kampanyalarını yayınlamasına ve destek almasına yardımcı olan bir platformdur. Proje; Next.js tabanlı bir arayüz, FastAPI tabanlı bir API ve Soroban akıllı sözleşme çalışma alanı içerir.

## Özellikler

- Kampanyaları listeleme, arama ve kategoriye göre filtreleme
- Proje fonlama başvurusu gönderme
- MetaMask ve Freighter cüzdanlarını bağlama
- Yönetim panelinden kampanya başvurularını inceleme

## Teknolojiler

- **Arayüz:** Next.js, React, TypeScript, Tailwind CSS
- **API:** Python, FastAPI, Uvicorn
- **Veritabanı:** PostgreSQL
- **Akıllı sözleşme çalışma alanı:** Rust, Soroban SDK

## Proje yapısı

```text
.
├── backend/                   # FastAPI uygulaması ve PostgreSQL erişimi
│   └── app/
│       ├── models/            # İstek modelleri
│       └── routers/           # Kampanya, yönetim ve cüzdan uçları
├── frontend/                  # Next.js uygulaması
│   └── src/app/               # Sayfalar ve arayüz bileşenleri
├── soroban-campaign-contract/ # Soroban Rust çalışma alanı
│   └── contracts/hello-world/ # Örnek kontrat
└── .github/workflows/         # GitHub Actions iş akışları
```

## Gereksinimler

- Node.js 20.9 veya üzeri ve npm
- Python 3.11 veya üzeri
- PostgreSQL veritabanı
- Soroban kontratını geliştirmek veya test etmek için Rust ve Cargo

## Kurulum ve çalıştırma

### 1. Depoyu alın

```bash
git clone https://github.com/Shsha3245/fundFlow.git
cd fundFlow
```

### 2. API'yi yapılandırın ve çalıştırın

`backend/.env` dosyasını oluşturup PostgreSQL bağlantı adresinizi ekleyin:

```dotenv
DATABASE_URL=postgresql://<kullanici>:<sifre>@<sunucu>:5432/<veritabani>
```

Ardından bağımlılıkları kurup API'yi başlatın:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

İlk başlatmada uygulama `campaigns` tablosunu oluşturur ve veritabanı boşsa örnek kampanyalar ekler. API belgeleri `http://localhost:8000/docs` adresinde kullanılabilir.

> Windows'ta sanal ortamı etkinleştirmek için `.venv\Scripts\activate` komutunu kullanın.

### 3. Arayüzü çalıştırın

Yeni bir terminalde:

```bash
cd frontend
npm ci
npm run dev
```

Arayüz `http://localhost:3000` adresinde, API ise `http://localhost:8000` adresinde açılır.

## Geliştirme ve doğrulama

Frontend komutları `frontend/` dizininde çalıştırılır:

```bash
npm run lint
npm run build
npm start
```

Soroban kontrat çalışma alanının Rust testlerini çalıştırmak için:

```bash
cd soroban-campaign-contract
cargo test --workspace
```

## Kullanım

Ana sayfada kampanyaları görüntüleyip arayabilir, kategoriye göre filtreleyebilir ve proje başvurusu gönderebilirsiniz. Destek işlemleri için MetaMask veya Freighter cüzdanınızı bağlayabilirsiniz. Yönetim paneli `/management-portal-x82` yolundadır; kampanya başvuruları yönetim panelinden incelenir ve onaylanır.

## Katkıda bulunma

Katkılarınızı memnuniyetle karşılıyoruz. Değişiklik öncesinde bir issue açarak önerinizi paylaşın; ardından odaklı bir branch üzerinde çalışıp uygun doğrulamaları çalıştırarak pull request gönderin.
