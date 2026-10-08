import sqlite3
import uuid
from fastapi import APIRouter, HTTPException, status
from stellar_sdk import Server
from app.database import get_db_connection
from app.models.campaign import CampaignApply, SupportRequest
from app.config import settings

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

def calculate_fee(token_type: str, amount: float) -> tuple[float, float]:
    """
    ATH: %1 Sabit Platform Komisyonu
    SPORTS: Tutar bazlı %2 - %5 Dinamik Komisyon
    """
    token = token_type.upper()
    if token == "ATH":
        fee_rate = 0.01
    elif token == "SPORTS":
        if amount <= 10000:
            fee_rate = 0.05
        elif amount <= 50000:
            fee_rate = 0.035
        else:
            fee_rate = 0.02
    else:
        fee_rate = 0.0

    fee_amount = amount * fee_rate
    net_amount = amount - fee_amount
    return fee_amount, net_amount

def verify_stellar_transaction(tx_hash: str, chain_type: str = "stellar") -> bool:
    """
    İşlemin Stellar ağında gerçekten gerçekleşip gerçekleşmediğini doğrular.
    Geliştirme / Mock hash'leri bypass eder.
    """
    # Geliştirme/Test bypass kontrolü
    if tx_hash.startswith("mock_") or chain_type == "evm":
        return True

    try:
        server = Server(settings.STELLAR_RPC_URL)
        tx_response = server.transactions().transaction_hash(tx_hash).call()
        return tx_response.get("successful", False)
    except Exception:
        return False

@router.get("")
def get_approved_campaigns():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE status = 'approved'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("/apply")
def apply_campaign(data: CampaignApply):
    campaign_id = f"cmp_{uuid.uuid4().hex[:6]}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO campaigns (id, title, category, token_type, target_amount, raised_amount, recipient_address, description, applicant_name, status)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 'pending')
    """, (campaign_id, data.title, data.category, data.token_type, data.target_amount, data.recipient_address, data.description, data.applicant_name))
    conn.commit()
    conn.close()
    return {"status": "success", "campaign_id": campaign_id}

@router.post("/support")
def support_campaign(data: SupportRequest):
    # 1. On-Chain İşlem Doğrulaması (Güvenlik & Regülasyon)
    if not verify_stellar_transaction(data.tx_hash, getattr(data, 'chain_type', 'stellar')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="İşlem Stellar ağında doğrulanamadı veya başarısız."
        )

    # 2. Komisyon Hesaplama
    fee_amount, net_amount = calculate_fee(data.token_type, data.amount)

    # 3. Veritabanı Önbellek Güncellemesi
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
    "UPDATE campaigns SET raised_amount = raised_amount + %s WHERE id = %s",
    (net_amount, data.campaign_id)
    )
    conn.commit()
    conn.close()

    return {
        "status": "supported",
        "gross_amount": data.amount,
        "platform_fee": fee_amount,
        "net_amount": net_amount,
        "tx_hash": data.tx_hash
    }