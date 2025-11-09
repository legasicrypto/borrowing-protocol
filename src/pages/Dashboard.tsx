import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Home, Shield, CheckCircle2 } from "lucide-react";
import { PortfolioOverview } from "@/components/dashboard/PortfolioOverview";
import { LoanCard } from "@/components/dashboard/LoanCard";
import { CreateLoanModal } from "@/components/dashboard/CreateLoanModal";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/layout/Footer";
import { CollateralDistribution } from "@/components/charts/CollateralDistribution";
import { HealthFactorGauge } from "@/components/charts/HealthFactorGauge";
import { LiquidationPreview } from "@/components/charts/LiquidationPreview";
import { PortfolioLTVComboChart } from "@/components/charts/PortfolioLTVComboChart";
import { MyLoans } from "@/components/dashboard/MyLoans";
import { FiatManagement } from "@/components/dashboard/FiatManagement";
import { CloseLoanModal } from "@/components/modals/CloseLoanModal";
import { RepayLoanModal } from "@/components/modals/RepayLoanModal";
import { AddCollateralModal } from "@/components/modals/AddCollateralModal";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useRealtimeCryptoPrices } from "@/hooks/useRealtimeCryptoPrices";
import { useRealtimeLoans } from "@/hooks/useRealtimeLoans";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { useRealtimeBankAccount } from "@/hooks/useRealtimeBankAccount";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import {
  calculateLTV,
  calculateHealthFactor,
  calculateLiquidationPrice,
  calculateAccruedInterest,
} from "@/lib/calculations";

interface Loan {
  id: string;
  collateralType: string;
  collateralAmount: number;
  borrowedEur: number;
  borrowCurrency: "USDC" | "EURC";
  ltvRatio: number;
  healthFactor: number;
  interestRate: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: "borrow" | "repay" | "add_collateral" | "withdraw_collateral" | "liquidation" | "transfer" | "swap";
  amount: number;
  currency: string;
  date: Date;
  status: "success" | "pending" | "failed" | "completed";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [closeLoanModalOpen, setCloseLoanModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [addCollateralModalOpen, setAddCollateralModalOpen] = useState(false);
  const [addCollateralLoanId, setAddCollateralLoanId] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [fiatKey, setFiatKey] = useState(0);
  const { prices } = useCryptoPrices();
  const { prices: realtimePrices } = useRealtimeCryptoPrices();
  const { liquidationThreshold, interestRate } = useSystemConfig();
  
  // Helper function to get price from either source
  const getPrice = (symbol: string): number => {
    if (realtimePrices[symbol]) {
      return realtimePrices[symbol].price_usd;
    }
    if (prices[symbol]) {
      return prices[symbol].current_price;
    }
    return 0;
  };
  
  // Build crypto prices map for useRealtimeLoans
  const cryptoPricesMap: Record<string, { price_usd: number; price_eur: number }> = {
    SOL: {
      price_usd: getPrice('SOL'),
      price_eur: realtimePrices['SOL']?.price_eur || getPrice('SOL') / 1.10,
    },
    BTC: {
      price_usd: getPrice('BTC'),
      price_eur: realtimePrices['BTC']?.price_eur || getPrice('BTC') / 1.10,
    },
    ETH: {
      price_usd: getPrice('ETH'),
      price_eur: realtimePrices['ETH']?.price_eur || getPrice('ETH') / 1.10,
    },
    USDC: {
      price_usd: getPrice('USDC'),
      price_eur: realtimePrices['USDC']?.price_eur || getPrice('USDC') / 1.10,
    },
  };
  
  const { loans, loading: loansLoading } = useRealtimeLoans(session?.user?.id, cryptoPricesMap, liquidationThreshold);
  const { transactions, refreshTransactions } = useRealtimeTransactions(session?.user?.id);
  const { bankAccount, refreshBankAccount } = useRealtimeBankAccount(session?.user?.id);
  

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);
        
        // Check KYC status
        const { data: profileData } = await supabase
          .from("profiles")
          .select("kyc_status")
          .eq("id", session.user.id)
          .maybeSingle();
        
        setKycStatus(profileData?.kyc_status || "pending");
        
        // Load user's loans
        await loadUserData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session && !isLoggingOut) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    // Realtime hooks now handle transactions and bank account
    // This function is kept for potential future use
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Forcer la suppression de la session locale
      const { error } = await supabase.auth.signOut();
      
      // Même s'il y a une erreur côté serveur (session déjà expirée),
      // on nettoie quand même la session locale
      if (error) {
        console.warn("Logout error (session may already be expired):", error.message);
      }
      
      // Toujours afficher un message de succès et rediriger
      toast.success("Logged out successfully");
      
      // Nettoyer manuellement le localStorage en cas de problème
      localStorage.removeItem('supabase.auth.token');
      
      // Rediriger vers la page d'accueil
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Même en cas d'erreur, on redirige quand même
      toast.success("Logged out");
      navigate("/");
    }
  };

  const handleCreateLoan = async (newLoan: {
    collateralType: string;
    collateralAmount: number;
    borrowedEur: number;
    borrowCurrency: "USDC" | "EURC";
    autoTopUpEnabled: boolean;
  }) => {
    if (!session?.user?.id) return;
    
    // Vérifier le statut KYC avant de créer le loan
    if (kycStatus !== "approved") {
      toast.error("Please complete KYC verification first");
      navigate("/kyc");
      return;
    }

    const cryptoPrice = newLoan.borrowCurrency === "EURC"
      ? cryptoPricesMap[newLoan.collateralType].price_eur
      : cryptoPricesMap[newLoan.collateralType].price_usd;
    const collateralValue = newLoan.collateralAmount * cryptoPrice;
    const ltvRatio = calculateLTV(newLoan.borrowedEur, collateralValue);
    const healthFactor = calculateHealthFactor(collateralValue, newLoan.borrowedEur, liquidationThreshold);
    const liquidationPrice = calculateLiquidationPrice(newLoan.borrowedEur, newLoan.collateralAmount, liquidationThreshold);

    // Save loan to database
    const { data: loanData, error: loanError } = await supabase
      .from("loan_positions")
      .insert({
        user_id: session.user.id,
        collateral_type: newLoan.collateralType,
        collateral_amount: newLoan.collateralAmount,
        borrowed_usdc: newLoan.borrowedEur,
        borrowed_currency: newLoan.borrowCurrency,
        ltv_ratio: ltvRatio,
        health_factor: healthFactor,
        liquidation_price: liquidationPrice,
        interest_rate: interestRate,
        status: "active",
        auto_top_up: newLoan.autoTopUpEnabled,
      })
      .select()
      .single();

    if (loanError) {
      toast.error("Error creating loan");
      console.error(loanError);
      return;
    }

    // Save transaction to database
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: session.user.id,
        loan_id: loanData.id,
        type: "borrow",
        amount: newLoan.borrowedEur,
        currency: newLoan.borrowCurrency,
        status: "success",
      });

    if (txError) {
      console.error("Transaction save error:", txError);
    }

    // ✅ Refresh immédiat des transactions
    await refreshTransactions();

    // Credit the borrowed amount to user's bank account based on currency
    const balanceColumn = newLoan.borrowCurrency === "USDC" ? "usd_balance" : "eurc_balance";
    const { data: bankData, error: bankFetchError } = await supabase
      .from("user_bank_accounts")
      .select(balanceColumn)
      .eq("user_id", session.user.id)
      .single();

    if (bankFetchError) {
      console.error("Bank account fetch error:", bankFetchError);
      toast.error("Loan created but failed to update balance");
      return;
    }

    const newBalance = Number(bankData[balanceColumn]) + newLoan.borrowedEur;

    const { error: bankUpdateError } = await supabase
      .from("user_bank_accounts")
      .update({ [balanceColumn]: newBalance })
      .eq("user_id", session.user.id);

    if (bankUpdateError) {
      console.error("Bank account update error:", bankUpdateError);
      toast.error("Loan created but failed to credit account");
      return;
    }

    // ✅ Refresh immédiat du solde
    await refreshBankAccount();
    setFiatKey(prev => prev + 1);

    toast.success("Loan created successfully!");
    setCreateModalOpen(false);
  };

  const handleRepay = async (loanId: string, repayAmount: number) => {
    if (!session?.user?.id) return;

    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    // Fetch the borrowed_currency from the loan
    const { data: loanData } = await supabase
      .from("loan_positions")
      .select("borrowed_currency")
      .eq("id", loanId)
      .single();

    const borrowCurrency = (loanData?.borrowed_currency as "USDC" | "EURC") || "USDC";
    const balanceColumn = borrowCurrency === "USDC" ? "usd_balance" : "eurc_balance";

    // Calculate proportional interest
    const totalInterestAccrued = calculateAccruedInterest(
      loan.borrowedEur,
      loan.interestRate,
      loan.createdAt
    );
    
    const repaymentRatio = repayAmount / loan.borrowedEur;
    const proportionalInterest = totalInterestAccrued * repaymentRatio;
    const totalToDebit = repayAmount + proportionalInterest;

    // Check available balance
    const { data: bankData, error: bankFetchError } = await supabase
      .from("user_bank_accounts")
      .select(balanceColumn)
      .eq("user_id", session.user.id)
      .single();

    if (bankFetchError || !bankData) {
      toast.error("Unable to verify account balance");
      return;
    }

    const currentBalance = Number(bankData[balanceColumn]);

    // Block if insufficient balance (including interest)
    if (currentBalance < totalToDebit) {
      const missing = totalToDebit - currentBalance;
      toast.error(
        `Insufficient balance. You need ${missing.toFixed(2)} ${borrowCurrency} more (including ${proportionalInterest.toFixed(2)} in interest)`
      );
      return;
    }

    // Check that repay amount doesn't exceed borrowed amount
    if (repayAmount > loan.borrowedEur) {
      toast.error("Repayment amount exceeds borrowed amount");
      return;
    }

    const newBorrowedAmount = loan.borrowedEur - repayAmount;
    const collateralValue = loan.collateralAmount * getPrice(loan.collateralType);
    const newLtv = calculateLTV(newBorrowedAmount, collateralValue);
    const newHealthFactor = calculateHealthFactor(collateralValue, newBorrowedAmount, liquidationThreshold);

    // Debit the total amount (capital + interest) from user's bank account
    const newBalance = currentBalance - totalToDebit;
    
    const { error: bankUpdateError } = await supabase
      .from("user_bank_accounts")
      .update({ [balanceColumn]: newBalance })
      .eq("user_id", session.user.id);

    if (bankUpdateError) {
      console.error("Bank update error:", bankUpdateError);
      toast.error("Repayment failed - please contact support");
      return;
    }

    // ✅ Refresh immédiat du solde
    await refreshBankAccount();

    // Update loan position
    const { error: updateError } = await supabase
      .from("loan_positions")
      .update({
        borrowed_usdc: newBorrowedAmount,
        ltv_ratio: newLtv,
        health_factor: newHealthFactor,
      })
      .eq("id", loanId);

    if (updateError) {
      toast.error("Error during repayment");
      return;
    }

    // Record transaction for principal repayment
    await supabase.from("transactions").insert({
      user_id: session.user.id,
      loan_id: loanId,
      type: "repay",
      amount: repayAmount,
      currency: borrowCurrency,
      status: "success",
    });

    // Record transaction for interest payment
    if (proportionalInterest > 0) {
      await supabase.from("transactions").insert({
        user_id: session.user.id,
        loan_id: loanId,
        type: "interest_payment",
        amount: proportionalInterest,
        currency: borrowCurrency,
        status: "success",
      });
    }

    // ✅ Refresh immédiat des transactions
    await refreshTransactions();

    toast.success(
      `Repaid ${repayAmount.toFixed(2)} ${borrowCurrency} + ${proportionalInterest.toFixed(2)} interest`
    );
  };

  const handleAddCollateral = async (loanId: string, additionalCollateral: number) => {
    if (!session?.user?.id) return;

    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;
    const newCollateralAmount = loan.collateralAmount + additionalCollateral;
    const collateralValue = newCollateralAmount * getPrice(loan.collateralType);
    const newLtv = calculateLTV(loan.borrowedEur, collateralValue);
    const newHealthFactor = calculateHealthFactor(collateralValue, loan.borrowedEur, liquidationThreshold);

    const { error } = await supabase
      .from("loan_positions")
      .update({
        collateral_amount: newCollateralAmount,
        ltv_ratio: newLtv,
        health_factor: newHealthFactor,
      })
      .eq("id", loanId);

    if (error) {
      toast.error("Error adding collateral");
      return;
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: session.user.id,
      loan_id: loanId,
      type: "add_collateral",
      amount: additionalCollateral,
      currency: loan.collateralType,
      status: "success",
    });

    // ✅ Refresh immédiat des transactions
    await refreshTransactions();

    toast.success(`${additionalCollateral.toFixed(4)} ${loan.collateralType} added!`);
  };

  const openRepayModal = (loanId: string) => {
    setRepayLoanId(loanId);
    setRepayModalOpen(true);
  };

  const openAddCollateralModal = (loanId: string) => {
    setAddCollateralLoanId(loanId);
    setAddCollateralModalOpen(true);
  };

  const getCurrentBalance = (borrowCurrency: "USDC" | "EURC"): number => {
    if (!bankAccount) return 0;
    return borrowCurrency === "EURC" 
      ? Number(bankAccount.eurc_balance) 
      : Number(bankAccount.usdc_balance);
  };

  const handleCloseLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCloseLoanModalOpen(true);
  };

  const handleConfirmCloseLoan = async () => {
    if (!session?.user?.id || !selectedLoanId) return;

    const loan = loans.find((l) => l.id === selectedLoanId);
    if (!loan) return;

    const balanceField = loan.borrowCurrency === "EURC" ? "eurc_balance" : "usd_balance";

    // Calculate prorated interest based on loan duration
    const interestAccrued = calculateAccruedInterest(
      loan.borrowedEur,
      loan.interestRate,
      loan.createdAt
    );
    const totalToRepay = loan.borrowedEur + interestAccrued;

    // Fetch current balance
    const { data: bankData, error: bankFetchError } = await supabase
      .from("user_bank_accounts")
      .select(balanceField)
      .eq("user_id", session.user.id)
      .single();

    if (bankFetchError) {
      toast.error("Error fetching account balance");
      return;
    }

    const currentBalanceCheck = Number(bankData[balanceField]);

    // Check if user has enough balance to close the loan
    if (currentBalanceCheck < totalToRepay) {
      const missingAmount = totalToRepay - currentBalanceCheck;
      const currencySymbol = loan.borrowCurrency === "USDC" ? "$" : "€";
      toast.error(
        `Insufficient balance! You need ${currencySymbol}${missingAmount.toFixed(2)} ${loan.borrowCurrency} more to close this loan.`
      );
      return;
    }

    // Debit the total amount from user's bank account
    const newBalance = currentBalanceCheck - totalToRepay;

    const { error: balanceUpdateError } = await supabase
      .from("user_bank_accounts")
      .update({ [balanceField]: newBalance })
      .eq("user_id", session.user.id);

    if (balanceUpdateError) {
      toast.error("Error updating account balance");
      return;
    }

    // ✅ Refresh immédiat du solde
    await refreshBankAccount();

    // Close loan: update status to 'closed'
    const { error } = await supabase
      .from("loan_positions")
      .update({ status: "closed" })
      .eq("id", selectedLoanId);

    if (error) {
      toast.error("Error closing loan");
      return;
    }

    // Record transaction for the full repayment (borrowed + interest)
    await supabase.from("transactions").insert({
      user_id: session.user.id,
      loan_id: selectedLoanId,
      type: "repay",
      amount: totalToRepay,
      currency: loan.borrowCurrency,
      status: "success",
    });

    // ✅ Refresh immédiat des transactions
    await refreshTransactions();

    toast.success("Loan closed successfully!");
    setCloseLoanModalOpen(false);
    setSelectedLoanId(null);
  };

  const totalCollateral = loans.reduce((acc, loan) => {
    const price = getPrice(loan.collateralType);
    return acc + loan.collateralAmount * price;
  }, 0);

  const totalBorrowed = loans.reduce((acc, loan) => acc + loan.borrowedEur, 0);
  const avgLtv = loans.length > 0 ? loans.reduce((acc, loan) => acc + loan.ltvRatio, 0) / loans.length : 0;
  const avgHealthFactor = loans.length > 0 ? loans.reduce((acc, loan) => acc + loan.healthFactor, 0) / loans.length : 0;

  // Generate historical data based on actual loan creation dates
  const generateHistoricalData = () => {
    if (loans.length === 0) return [];
    
    // Find the earliest loan creation date
    const firstLoanDate = new Date(
      Math.min(...loans.map(loan => new Date(loan.createdAt).getTime()))
    );
    
    const today = new Date();
    const monthsDiff = Math.max(1, 
      (today.getFullYear() - firstLoanDate.getFullYear()) * 12 + 
      (today.getMonth() - firstLoanDate.getMonth())
    );
    
    // Generate up to 6 data points
    const dataPoints = Math.min(6, monthsDiff + 1);
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date(firstLoanDate);
      date.setMonth(date.getMonth() + Math.floor((monthsDiff * i) / (dataPoints - 1)));
      
      const progress = i / (dataPoints - 1);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: totalCollateral * (0.5 + progress * 0.5),
        borrowed: totalBorrowed * (0.5 + progress * 0.5),
      };
    });
  };

  const portfolioData = generateHistoricalData();

  const collateralDistribution = loans.reduce((acc, loan) => {
    const existing = acc.find(item => item.name === loan.collateralType);
    const value = loan.collateralAmount * getPrice(loan.collateralType);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: loan.collateralType, value });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const ltvHistory = portfolioData.map((data, i) => ({
    date: data.date,
    ltv: avgLtv * (0.5 + (i / (portfolioData.length - 1)) * 0.5),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-legasi-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-legasi-dark">
      <DashboardHeader
        title="Dashboard"
        showHomeButton={true}
        showAdminButton={isAdmin}
        onLogout={handleLogout}
        rightContent={session?.user?.id && <NotificationCenter userId={session.user.id} />}
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
            <p className="text-muted-foreground">{session?.user?.email}</p>
          </div>
          {kycStatus === "approved" ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">Verified</span>
              </div>
              <Button 
                onClick={() => {
                  if (kycStatus !== "approved") {
                    navigate("/kyc");
                  } else {
                    setCreateModalOpen(true);
                  }
                }} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Loan
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => navigate("/kyc")} 
              className="gap-2"
              variant="outline"
            >
              Complete KYC
            </Button>
          )}
        </div>

        <PortfolioOverview
          totalCollateral={totalCollateral}
          totalBorrowed={totalBorrowed}
          avgLtv={avgLtv}
          activeLoans={loans.length}
        />

        {/* Active Loans */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {loans.length === 0 ? (
            <div className="lg:col-span-2 text-center py-16 bg-legasi-card border border-border rounded-lg">
              <p className="text-xl text-muted-foreground mb-4">No active loans</p>
              <Button 
                onClick={() => {
                  if (kycStatus !== "approved") {
                    navigate("/kyc");
                  } else {
                    setCreateModalOpen(true);
                  }
                }} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Loan
              </Button>
            </div>
          ) : (
            loans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    {...loan}
                    onRepay={() => openRepayModal(loan.id)}
                    onAddCollateral={() => openAddCollateralModal(loan.id)}
                    onCloseLoan={() => handleCloseLoan(loan.id)}
                  />
            ))
          )}
        </div>

        {/* My Loans - Show borrowed stablecoins */}
        {session?.user?.id && (
          <div className="mb-8">
            <MyLoans 
              userId={session.user.id}
              onTransactionsUpdate={refreshTransactions}
            />
          </div>
        )}

        {/* Fiat Management - Show fiat currencies */}
        {session?.user?.id && (
          <div className="mb-8">
            <FiatManagement 
              key={fiatKey} 
              userId={session.user.id}
              onTransactionsUpdate={refreshTransactions}
            />
          </div>
        )}

        {/* Analytics Charts */}
        {loans.length > 0 && (
          <>
            {/* ROW 1: Liquidation Preview (priority) + Health Factor */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <LiquidationPreview
                  currentPrice={getPrice(loans[0]?.collateralType || 'SOL')}
                  collateralAmount={loans[0]?.collateralAmount || 0}
                  borrowedAmount={loans[0]?.borrowedEur || 0}
                  liquidationThreshold={liquidationThreshold}
                  collateralType={loans[0]?.collateralType || 'SOL'}
                />
                
                {/* CTA Buttons - Conditional */}
                {(avgHealthFactor < 1.5 || avgLtv > 30) && (
                  <div className="flex gap-2">
                    {avgHealthFactor < 1.5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-500/10"
                        onClick={() => {
                          setAddCollateralLoanId(loans[0]?.id);
                          setAddCollateralModalOpen(true);
                        }}
                      >
                        🛡️ Add Collateral
                      </Button>
                    )}
                    {avgLtv > 30 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                        onClick={() => {
                          setRepayLoanId(loans[0]?.id);
                          setRepayModalOpen(true);
                        }}
                      >
                        💰 Repay Loan
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <HealthFactorGauge healthFactor={avgHealthFactor} />
            </div>

            {/* ROW 2: Portfolio & LTV Combo Chart (full width) */}
            <div className="mb-8">
              <PortfolioLTVComboChart 
                portfolioData={portfolioData} 
                ltvData={ltvHistory}
                currentPrice={getPrice(loans[0]?.collateralType || 'SOL')}
              />
            </div>

            {/* ROW 3: Collateral Distribution */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <CollateralDistribution data={collateralDistribution} />
            </div>
          </>
        )}

        <TransactionHistory transactions={transactions} />
      </div>

      <CreateLoanModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateLoan={handleCreateLoan}
        cryptoPrices={cryptoPricesMap}
        kycStatus={kycStatus}
      />

      <CloseLoanModal
        open={closeLoanModalOpen}
        onClose={() => {
          setCloseLoanModalOpen(false);
          setSelectedLoanId(null);
        }}
        onConfirm={handleConfirmCloseLoan}
        loan={selectedLoanId ? loans.find((l) => l.id === selectedLoanId) : null}
        currentBalance={
          selectedLoanId 
            ? getCurrentBalance(loans.find(l => l.id === selectedLoanId)?.borrowCurrency || "USDC")
            : 0
        }
      />

      <RepayLoanModal
        open={repayModalOpen}
        onClose={() => {
          setRepayModalOpen(false);
          setRepayLoanId(null);
        }}
        onConfirm={(amount) => {
          if (repayLoanId) {
            handleRepay(repayLoanId, amount);
            setRepayModalOpen(false);
            setRepayLoanId(null);
          }
        }}
        maxAmount={repayLoanId ? loans.find(l => l.id === repayLoanId)?.borrowedEur || 0 : 0}
        currentLtv={repayLoanId ? loans.find(l => l.id === repayLoanId)?.ltvRatio || 0 : 0}
        currentBalance={
          repayLoanId 
            ? getCurrentBalance(loans.find(l => l.id === repayLoanId)?.borrowCurrency || "USDC")
            : 0
        }
        interestRate={repayLoanId ? loans.find(l => l.id === repayLoanId)?.interestRate || 5.2 : 5.2}
        createdAt={repayLoanId ? loans.find(l => l.id === repayLoanId)?.createdAt || "" : ""}
        borrowCurrency={repayLoanId ? loans.find(l => l.id === repayLoanId)?.borrowCurrency || "USDC" : "USDC"}
      />

      <AddCollateralModal
        open={addCollateralModalOpen}
        onClose={() => {
          setAddCollateralModalOpen(false);
          setAddCollateralLoanId(null);
        }}
        onConfirm={(amount) => {
          if (addCollateralLoanId) {
            handleAddCollateral(addCollateralLoanId, amount);
            setAddCollateralModalOpen(false);
            setAddCollateralLoanId(null);
          }
        }}
        collateralType={addCollateralLoanId ? loans.find(l => l.id === addCollateralLoanId)?.collateralType || "" : ""}
        currentCollateral={addCollateralLoanId ? loans.find(l => l.id === addCollateralLoanId)?.collateralAmount || 0 : 0}
        currentLtv={addCollateralLoanId ? loans.find(l => l.id === addCollateralLoanId)?.ltvRatio || 0 : 0}
        borrowedAmount={addCollateralLoanId ? loans.find(l => l.id === addCollateralLoanId)?.borrowedEur || 0 : 0}
        cryptoPrice={addCollateralLoanId ? getPrice(loans.find(l => l.id === addCollateralLoanId)?.collateralType || "") : 0}
        availableBalance={10000}
      />
      <Footer />
    </div>
  );
}
