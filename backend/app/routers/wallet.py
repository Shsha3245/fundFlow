from fastapi import APIRouter, HTTPException, status
from stellar_sdk import Server, Keypair, TransactionBuilder, Network, Asset
from stellar_sdk.exceptions import BadRequestError
from app.config import settings
from app.models.wallet import FundAccountRequest, MintTokenRequest, TrustlineRequest

router = APIRouter(prefix="/wallet", tags=["Wallet & Onboarding"])

@router.get("/balances/{address}")
def get_balance(address: str):
    server = Server(settings.STELLAR_RPC_URL)
    try:
        account = server.accounts().account_id(address).call()
        balances = account.get("balances", [])
        return {"address": address, "balances": balances}
    except Exception:
        # Hesap henüz aktif değilse 0 bakiye dön
        return {"address": address, "balances": []}

@router.post("/fund-account", status_code=status.HTTP_200_OK)
def fund_account(request: FundAccountRequest):
    user_public_key = request.user_public_key

    if not settings.SPONSOR_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sponsor gizli anahtarı sunucuda yapılandırılmamış."
        )

    server = Server(settings.STELLAR_SERVER_URL)
    network_passphrase = Network.TESTNET_NETWORK_PASSPHRASE
    sponsor_keypair = Keypair.from_secret(settings.SPONSOR_SECRET_KEY)

    # 1. Cüzdan zaten aktif mi kontrol et
    try:
        server.accounts().account_id(user_public_key).call()
        return {
            "status": "already_active",
            "message": "Hesap ağda zaten aktif durumda.",
            "user_public_key": user_public_key
        }
    except Exception:
        pass  # Hesap henüz pasif, fonlamaya geç

    # 2. Sponsor cüzdandan 1.5 XLM aktarıp hesabı aç
    try:
        sponsor_account = server.load_account(sponsor_keypair.public_key)

        tx = (
            TransactionBuilder(
                source_account=sponsor_account,
                network_passphrase=network_passphrase,
                base_fee=100
            )
            .append_create_account_op(
                destination=user_public_key,
                starting_balance="1.5"
            )
            .set_timeout(30)
            .build()
        )

        tx.sign(sponsor_keypair)
        response = server.submit_transaction(tx)

        return {
            "status": "success",
            "message": "Cüzdan başarıyla aktifleştirildi ve 1.5 XLM tanımlandı.",
            "hash": response["hash"],
            "user_public_key": user_public_key
        }

    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stellar İşlem Hatası: {e.status_code if hasattr(e, 'status_code') else ''} - {e.title if hasattr(e, 'title') else str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sunucu Hatası: {str(e)}"
        )

def get_asset(asset_code: str, issuer_public_key: str) -> Asset:
    if asset_code not in ["SPORTS", "ATH"]:
        raise ValueError("Geçersiz varlık kodu. Sadece 'SPORTS' ve 'ATH' kullanılabilir.")
    return Asset(code=asset_code, issuer=issuer_public_key)

@router.post("/mint-tokens", status_code=status.HTTP_200_OK)
def mint_tokens(request: MintTokenRequest):
    user_public_key = request.user_public_key
    asset_code = request.asset_code.upper()
    amount = str(request.amount)

    if not settings.SPONSOR_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Issuer/Sponsor gizli anahtarı bulunamadı."
        )

    server = Server(settings.STELLAR_SERVER_URL)
    network_passphrase = Network.TESTNET_NETWORK_PASSPHRASE
    issuer_keypair = Keypair.from_secret(settings.SPONSOR_SECRET_KEY)
    
    try:
        token_asset = get_asset(asset_code, issuer_keypair.public_key)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    try:
        issuer_account = server.load_account(issuer_keypair.public_key)

        tx = (
            TransactionBuilder(
                source_account=issuer_account,
                network_passphrase=network_passphrase,
                base_fee=100
            )
            .append_payment_op(
                destination=user_public_key,
                asset=token_asset,
                amount=amount
            )
            .set_timeout(30)
            .build()
        )

        tx.sign(issuer_keypair)
        response = server.submit_transaction(tx)

        return {
            "status": "success",
            "message": f"{amount} ${asset_code} başarıyla cüzdana aktarıldı.",
            "hash": response.get("hash"),
            "recipient": user_public_key,
            "asset": asset_code
        }

    except BadRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stellar Hatası: {e.extras if hasattr(e, 'extras') else str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token gönderim hatası: {str(e)}"
        )

@router.get("/issuer-info")
def get_issuer_info():
    if not settings.SPONSOR_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Issuer key ayarlanmamış.")
    
    issuer_keypair = Keypair.from_secret(settings.SPONSOR_SECRET_KEY)
    return {
        "issuer_public_key": issuer_keypair.public_key,
        "assets": {
            "SPORTS": {"code": "SPORTS", "target": "Kulüpler"},
            "ATH": {"code": "ATH", "target": "Bireysel Sporcular"}
        }
    }