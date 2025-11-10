// Demo data used as fallbacks when no real DB is configured
export const DEMO_PRICES = [
  { asset: 'XLM', price: 0.42, round_id: 101, timestamp: Date.now() - 1000 * 60 },
  { asset: 'BTC', price: 45000, round_id: 202, timestamp: Date.now() - 1000 * 120 },
  { asset: 'USDC', price: 1.0, round_id: 303, timestamp: Date.now() - 1000 * 30 },
]

export const DEMO_VAULTS = [
  { id: 'vault_btc_001', name: 'BTC Vault', custodian: 'Fireblocks', created_at: new Date().toISOString() },
  { id: 'vault_eth_001', name: 'ETH Vault', custodian: 'Fireblocks', created_at: new Date().toISOString() },
  { id: 'vault_xlm_001', name: 'XLM Vault', custodian: 'CustodyX', created_at: new Date().toISOString() },
]

export const DEMO_POLICIES = [
  { asset: 'BTC', max_ltv_on_draw: 0.7, base_interest_rate: 5.0, spread: 2.0 },
  { asset: 'ETH', max_ltv_on_draw: 0.65, base_interest_rate: 6.0, spread: 2.5 },
  { asset: 'XLM', max_ltv_on_draw: 0.5, base_interest_rate: 4.5, spread: 1.5 },
]

export const DEMO_POSITIONS = [
  {
    position_id: 'pos_btc_001',
    borrower_address: 'GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    vault_id: 'vault_btc_001',
    collateral_asset: 'BTC',
    collateral_amount: 2.5,
    borrowed_asset: 'USDC',
    principal: 120000,
    accrued_interest: 0,
    ltv: 0.5,
    status: 'active',
    opened_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    position_id: 'pos_eth_001',
    borrower_address: 'GBORROWER2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    vault_id: 'vault_eth_001',
    collateral_asset: 'ETH',
    collateral_amount: 10,
    borrowed_asset: 'USDC',
    principal: 20000,
    accrued_interest: 0,
    ltv: 0.3,
    status: 'active',
    opened_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    position_id: 'pos_xlm_001',
    borrower_address: 'GBORROWER3CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    vault_id: 'vault_xlm_001',
    collateral_asset: 'XLM',
    collateral_amount: 5000,
    borrowed_asset: 'USDC',
    principal: 2000,
    accrued_interest: 0,
    ltv: 0.2,
    status: 'pending',
    opened_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

export const DEMO_LIQUIDATIONS = [
  {
    id: 'liq_001',
    position_id: 'pos_btc_002',
    borrower: 'GBORROWER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    collateral_asset: 'BTC',
    amount_to_liquidate: 0.5,
    min_out: 20000,
    deadline: Date.now() + 1000 * 60 * 60 * 24,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
]

export const DEMO_EVENTS = [
  { id: 'ev_001', type: 'position_opened', entity: 'pos_btc_001', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 10 },
  { id: 'ev_002', type: 'price_update', entity: 'BTC', timestamp: Date.now() - 1000 * 60 * 60 * 5 },
]

export default {
  DEMO_PRICES,
  DEMO_VAULTS,
  DEMO_POLICIES,
  DEMO_POSITIONS,
  DEMO_LIQUIDATIONS,
  DEMO_EVENTS,
}
