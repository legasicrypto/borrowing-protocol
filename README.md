#Legasi Protocol Layer

On-chain layer deployed on the Stellar network, ensuring automated matching between lenders and borrowers through smart-contract logic.
The protocol is composed of four main modules:

1. Collateral Module

Purpose: Manage the deposit, segregation, valuation, and liquidation of collaterals.
- Borrowers lock digital assets such as USDC, Wrapped tokens or tokenized RWAs as collateral.
- Collateral is held in segregated vaults on Stellar, represented by multi-signature trustlines or smart contract-controlled accounts.
- The module continuously monitors the LTV ratio of each vault.
- If the LTV exceeds the defined threshold, it triggers an automated partial or full liquidation.
- Works in coordination with Liquidation Agents (Bots) that execute sales or settlements through approved Stellar DEXs or institutional off-chain channels.


2. Credit Module

Purpose: Manage credit lines, interest rates, and repayments.
- Creates and manages credit lines in USDC for borrowers, defining the loan amount, rate, and maturity.
- Calculates interest dynamically, combining a fixed margin and a variable benchmark rate (e.g., ESTR, SOFR).
- Tracks the health factor of each position in real time.
- Authorizes or restricts withdrawals based on debt status and protocol health.


3. Liquidity Module

Purpose: Manage deposits and withdrawals from institutional lenders, capital allocation, and yield generation.
- Aggregates USDC liquidity from institutional lenders into a dedicated pool.
- Defines locked tranches (e.g., 3-year minimum terms) to ensure predictable liquidity.
- Distributes returns in USDC according to loan performance.
- Balances available liquidity with capital deployed across outstanding loans.


4. Risk Module

Purpose: Monitor markets and evaluate risk parameters, broadcasting updates to other modules.
- Integrates price and interest rate oracles to track the real-time value of collateral assets (USDC, tokenized RWAs, etc.).
- Updates key risk parameters such as LTV thresholds, penalty rates, and liquidation conditions.
- Coordinates Liquidation Agents to execute authorized liquidations when thresholds are breached.
- Notifies all modules of significant market changes to trigger automatic recalibrations.



#External Service Layers

Liquidation Agents (Bots)

Purpose: Execute liquidation orders.
- Continuously scan the blockchain and oracle feeds.
- Automatically execute authorized liquidations through whitelisted DEXs or institutional counterparties.
- Operate as independent keepers, compensated through protocol fees.


Off-Ramp (USD → EUR via Circle)
- Enables conversion of borrowed USDC to fiat USD through Circle’s infrastructure.
- Facilitates cash-out operations directly into banking rails.


EMI Integration (European Banking Rails)
- Provides IBAN accounts for fiat transfers.
- Receives USD liquidity from Circle and converts it into EUR credited to the borrower’s IBAN.
- Ensures full compliance with European payment regulations.


