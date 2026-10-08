from fastapi import APIRouter, HTTPException, Depends, Header
from app.database import get_db_connection
from app.models.campaign import AdminApprove
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_SECRET_KEY = "super_secret_admin_token"

class AdminLoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def admin_login(data: AdminLoginRequest):
    if data.username == "generous" and data.password == "sportsfi2026":
        return {"access_token": ADMIN_SECRET_KEY, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid username or password.")

def verify_admin_token(x_admin_token: str = Header(None)):
    if x_admin_token != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin token.")
    return True

@router.get("/all-campaigns")
def get_all_campaigns(is_admin: bool = Depends(verify_admin_token)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.get("/pending-campaigns")
def get_pending_campaigns(is_admin: bool = Depends(verify_admin_token)): # <-- Eklendi
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campaigns WHERE status = 'pending'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("/approve-campaign")
def approve_campaign(data: AdminApprove, is_admin: bool = Depends(verify_admin_token)): # <-- Eklendi
    conn = get_db_connection()
    cursor = conn.cursor()
    new_status = "approved" if data.action == "approve" else "rejected"
    cursor.execute("UPDATE campaigns SET status = ? WHERE id = ?", (new_status, data.campaign_id))
    conn.commit()
    conn.close()
    return {"status": "updated", "new_status": new_status}

@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: str, is_admin: bool = Depends(verify_admin_token)):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Kampanyanın varlığını kontrol et
    cursor.execute("SELECT id FROM campaigns WHERE id = ?", (campaign_id,))
    campaign = cursor.fetchone()
    if not campaign:
        conn.close()
        raise HTTPException(status_code=404, detail="Kampanya bulunamadı.")
        
    cursor.execute("DELETE FROM campaigns WHERE id = ?", (campaign_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": f"{campaign_id} id'li kampanya silindi."}
