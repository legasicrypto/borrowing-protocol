#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

// KYC Registry for Legasi protocol
// Tracks user verification status

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum KYCStatus {
    Pending,
    Approved,
    Rejected,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct UserKYC {
    pub user: Address,
    pub status: KYCStatus,
    pub provider: String, // "sep12", "synaps", etc.
    pub verified_at: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    Admin,
    UserKYC(Address),
    KYCProvider(Address),
}

#[contract]
pub struct KYCRegistryContract;

#[contractimpl]
impl KYCRegistryContract {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) -> Result<(), String> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Admin) {
            return Err(String::from_str(&env, "Already initialized"));
        }

        env.storage().instance().set(&DataKey::Admin, &admin);

        Ok(())
    }

    /// Add authorized KYC provider
    pub fn add_provider(
        env: Env,
        admin: Address,
        provider: Address,
    ) -> Result<(), String> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(String::from_str(&env, "Not initialized"))?;

        if admin != stored_admin {
            return Err(String::from_str(&env, "Not authorized"));
        }

        env.storage()
            .instance()
            .set(&DataKey::KYCProvider(provider), &true);

        Ok(())
    }

    /// Update user KYC status
    pub fn update_kyc(
        env: Env,
        provider: Address,
        user: Address,
        status: KYCStatus,
        provider_name: String,
    ) -> Result<(), String> {
        provider.require_auth();

        // Verify provider is authorized
        if !env.storage().instance().has(&DataKey::KYCProvider(provider)) {
            return Err(String::from_str(&env, "Not authorized"));
        }

        let user_kyc = UserKYC {
            user: user.clone(),
            status,
            provider: provider_name,
            verified_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::UserKYC(user), &user_kyc);

        Ok(())
    }

    /// Check if user is verified
    pub fn is_verified(env: Env, user: Address) -> bool {
        let user_kyc: Option<UserKYC> = env.storage().persistent().get(&DataKey::UserKYC(user));

        match user_kyc {
            Some(kyc) => kyc.status == KYCStatus::Approved,
            None => false,
        }
    }

    /// Get user KYC data
    pub fn get_kyc(env: Env, user: Address) -> Result<UserKYC, String> {
        env.storage()
            .persistent()
            .get(&DataKey::UserKYC(user))
            .ok_or(String::from_str(&env, "KYC not found"))
    }
}
