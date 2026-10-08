from fastapi import APIRouter, status
from app.database import get_db_connection

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/", status_code=status.HTTP_200_OK)
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        db_status = "ok"
    except Exception as e:
        db_status = f"Error: {str(e)}"

    return {
        "status": "healthy" if db_status == "ok" else "unhealthy",
        "database": db_status
    }