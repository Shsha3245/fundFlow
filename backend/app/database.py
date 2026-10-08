import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings

def get_db_connection():
    conn = psycopg2.connect(
        settings.DATABASE_URL,
        cursor_factory=RealDictCursor
    )
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # PostgreSQL / Supabase uyumlu Kampanyalar Tablosu
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            token_type VARCHAR(50) NOT NULL DEFAULT 'SPORTS',
            target_amount NUMERIC(18, 4) NOT NULL,
            raised_amount NUMERIC(18, 4) DEFAULT 0.0000,
            recipient_address VARCHAR(56) NOT NULL,
            description TEXT,
            applicant_name VARCHAR(255),
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Varsayılan başlangıç verisi kontrolü
    cursor.execute("SELECT COUNT(*) FROM campaigns;")
    count = cursor.fetchone()['count']
    
    if count == 0:
        # ID'leri vermiyoruz; Supabase gen_random_uuid() ile otomatik üretecek
        cursor.execute("""
            INSERT INTO campaigns (title, category, token_type, target_amount, raised_amount, recipient_address, description, applicant_name, status)
            VALUES 
            ('Karşıyaka SK Altyapı Saha Onarımı', 'club_infrastructure', 'SPORTS', 15000, 4200, 'GDV45VUQ6EYNOHEBIPKRIRKNEV5P6IPPCTN4PMGVE2VUS6RGGSZZTFK4', 'Amatör gençlerin antrenman yaptığı sentetik sahanın yenilenmesi.', 'Karşıyaka Yöneticileri', 'approved'),
            ('Ege Boks Kulübü Genç Yetenek Desteği', 'talent', 'ATH', 5000, 1800, 'GDV45VUQ6EYNOHEBIPKRIRKNEV5P6IPPCTN4PMGVE2VUS6RGGSZZTFK4', 'Ulusal şampiyonaya katılacak 16 yaşındaki milli sporcunun seyahat masrafları.', 'Mehmet Hoca', 'approved')
        """)
    
    conn.commit()
    cursor.close()
    conn.close()