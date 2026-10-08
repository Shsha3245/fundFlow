#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Symbol, symbol_short};

#[contract]
pub struct CampaignContract;

#[contractimpl]
impl CampaignContract {
    /// Kampanyaya destek olma ve otomatik komisyon kesintisi
    /// token_type_flag: 1 -> ATH (%1 komisyon), 2 -> SPORTS (%2 - %5 dinamik)
    pub fn support_campaign(
        env: Env,
        donor: Address,
        recipient: Address,
        platform_treasury: Address,
        token: Address,
        amount: i128,
        token_type_flag: u32,
    ) {
        // 1. İşlemi yapan kullanıcının imzasını/onayını doğrula
        donor.require_auth();

        if amount <= 0 {
            panic!("Tutar 0'dan buyuk olmalidir");
        }

        // 2. Komisyon Oranını Hesapla (BPS - Basis Points üzerinden)
        // 100 BPS = %1
        let fee_bps: i128 = if token_type_flag == 1 {
            // ATH Token -> Sabit %1
            100
        } else {
            // SPORTS Token -> Dinamik (%5, %3.5, %2)
            if amount <= 10_000_0000000 {
                500 // %5
            } else if amount <= 50_000_0000000 {
                350 // %3.5
            } else {
                200 // %2
            }
        };

        let fee_amount = (amount * fee_bps) / 10000;
        let net_amount = amount - fee_amount;

        let token_client = token::Client::new(&env, &token);

        // 3. Transfer 1: Platform Komisyonunu Hazineye Aktar
        if fee_amount > 0 {
            token_client.transfer(&donor, &platform_treasury, &fee_amount);
        }

        // 4. Transfer 2: Net Tutarı Kampanya/Sporcu Adresine Aktar
        token_client.transfer(&donor, &recipient, &net_amount);

        // 5. On-Chain Event (Olay) Fırlat
        env.events().publish(
            (symbol_short!("support"), donor),
            (recipient, amount, fee_amount),
        );
    }
}