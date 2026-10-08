from pydantic import BaseModel
from typing import Optional

class CampaignApply(BaseModel):
    title: str
    category: str
    token_type: str = "SPORTS"  # 'SPORTS' veya 'ATH'
    target_amount: float
    recipient_address: str
    description: str
    applicant_name: str

class AdminApprove(BaseModel):
    campaign_id: str
    action: str  # "approve" veya "reject"

class SupportRequest(BaseModel):
    campaign_id: str
    donor_address: str
    amount: float
    token_type: str
    tx_hash: str
    chain_type: Optional[str] = "stellar"