from pydantic import BaseModel

class FundAccountRequest(BaseModel):
    user_public_key: str

class TrustlineRequest(BaseModel):
    user_public_key: str
    asset_code: str

class MintTokenRequest(BaseModel):
    user_public_key: str
    asset_code: str
    amount: str