import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatCard } from "@/components/ui/StatCard";
import { KYCDocumentViewer } from "@/components/admin/KYCDocumentViewer";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/layout/Footer";
import { Users, DollarSign, FileText, Shield, TrendingUp, Coins, Activity, AlertTriangle, Eye } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useRealtimeAdminStats } from "@/hooks/useRealtimeAdminStats";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

interface LoanData {
  id: string;
  user_id: string;
  collateral_type: string;
  collateral_amount: number;
  borrowed_usdc: number;
  ltv_ratio: number;
  health_factor: number;
  status: string;
  created_at: string;
}

interface KYCData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KYCData[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<KYCData | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [maxLtvSol, setMaxLtvSol] = useState(50);
  const [maxLtvUsdc, setMaxLtvUsdc] = useState(75);
  const [interestRate, setInterestRate] = useState(5.2);
  
  // Real-time stats hook
  const { stats, loading: statsLoading } = useRealtimeAdminStats();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("You must be logged in");
      navigate("/auth");
      return;
    }

    setSession(session);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      toast.error("Access denied: you are not an administrator");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadAdminData();
    setLoading(false);
  };

  const loadAdminData = async () => {
    // Fetch users - using separate queries for better reliability
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, created_at");

    if (profilesError) {
      console.error("Profiles error:", profilesError);
    } else if (profilesData) {
      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Roles error:", rolesError);
      }

      // Combine the data
      const formattedUsers = (profilesData || []).map((user: any) => {
        const userRole = rolesData?.find((r: any) => r.user_id === user.id);
        
        return {
          id: user.id,
          email: `${user.first_name || ""} ${user.last_name || ""}`.trim() || "No name",
          created_at: user.created_at,
          role: userRole?.role || "user",
        };
      });

      console.log("Formatted users:", formattedUsers);
      setUsers(formattedUsers);
    }

    // Load loans
    const { data: loansData, error: loansError } = await supabase
      .from("loan_positions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!loansError && loansData) {
      setLoans(loansData);
    }

    // Load KYC submissions
    const { data: kycData, error: kycError } = await supabase
      .from("kyc_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!kycError && kycData) {
      setKycSubmissions(kycData);
    }

    // Load system config (max LTV for both SOL and USDC, and interest rate)
    const { data: configData, error: configError } = await supabase
      .from("system_config")
      .select("*")
      .in("config_key", ["max_ltv_sol", "max_ltv_usdc", "interest_rate"]);

    if (!configError && configData) {
      configData.forEach((config: any) => {
        if (config.config_key === "max_ltv_sol") {
          setMaxLtvSol(parseFloat(config.config_value));
        } else if (config.config_key === "max_ltv_usdc") {
          setMaxLtvUsdc(parseFloat(config.config_value));
        } else if (config.config_key === "interest_rate") {
          setInterestRate(parseFloat(config.config_value));
        }
      });
    }
  };

  const handleApproveKYC = async (kycId: string, userId: string) => {
    const { error } = await supabase
      .from("kyc_submissions")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: session?.user.id,
      })
      .eq("id", kycId);

    if (error) {
      toast.error("Error during approval");
      console.error(error);
    } else {
      // Trigger will automatically generate IBAN
      // Retrieve generated IBAN after a short delay
      setTimeout(async () => {
        const { data: bankData } = await supabase
          .from("user_bank_accounts")
          .select("iban_legasi")
          .eq("user_id", userId)
          .maybeSingle();

        if (bankData?.iban_legasi) {
          toast.success(`KYC approved! IBAN generated: ${bankData.iban_legasi}`, {
            duration: 6000,
          });
        } else {
          toast.success("KYC approved successfully");
        }
        
        await loadAdminData();
      }, 1000);
    }
  };

  const handleRejectKYC = async (kycId: string) => {
    const { error } = await supabase
      .from("kyc_submissions")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: session?.user.id,
      })
      .eq("id", kycId);

    if (error) {
      toast.error("Error during rejection");
    } else {
      toast.success("KYC rejected");
      await loadAdminData();
    }
  };

  const handleUpdateLtvConfig = async (asset: "SOL" | "USDC") => {
    const configKey = asset === "SOL" ? "max_ltv_sol" : "max_ltv_usdc";
    const newValue = asset === "SOL" ? maxLtvSol : maxLtvUsdc;

    try {
      const { error } = await supabase
        .from("system_config")
        .upsert({
          config_key: configKey,
          config_value: newValue.toString(),
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "config_key" });

      if (error) {
        console.error(`Error updating ${asset} LTV config:`, error);
        toast.error(`Failed to update ${asset} LTV configuration`);
      } else {
        toast.success(`${asset} LTV updated to ${newValue}%`);
        await loadAdminData();
      }
    } catch (error) {
      console.error("Error in handleUpdateLtvConfig:", error);
      toast.error("An error occurred while updating LTV configuration");
    }
  };

  const handleUpdateInterestRate = async () => {
    try {
      const { error } = await supabase
        .from("system_config")
        .upsert({
          config_key: "interest_rate",
          config_value: interestRate.toString(),
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "config_key" });

      if (error) {
        console.error("Error updating interest rate config:", error);
        toast.error("Failed to update interest rate configuration");
      } else {
        toast.success(`Interest rate updated to ${interestRate}% APY`);
        await loadAdminData();
      }
    } catch (error) {
      console.error("Error in handleUpdateInterestRate:", error);
      toast.error("An error occurred while updating interest rate configuration");
    }
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

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-legasi-dark flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-legasi-dark">
      <DashboardHeader
        title="Admin"
        showHomeButton={true}
        showDashboardButton={true}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            User, loan, and KYC verification management
          </p>
        </div>

        {/* Stats Overview - Row 1: General Stats */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">General Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
            />
            <StatCard
              title="Active Loans"
              value={stats.activeLoans}
              icon={DollarSign}
            />
            <StatCard
              title="Pending KYC"
              value={stats.pendingKYC}
              icon={FileText}
            />
            <StatCard
              title="Total Volume"
              value={stats.totalVolume}
              prefix="$"
              decimals={2}
              icon={Shield}
            />
          </div>
        </div>

        {/* Stats Overview - Row 2: Collateral Stats */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Deposited Collateral</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total SOL Collateral"
              value={stats.totalSolCollateral}
              suffix=" SOL"
              decimals={2}
              icon={Coins}
            />
            <StatCard
              title="Total USDC Collateral"
              value={stats.totalUsdcCollateral}
              suffix=" USDC"
              decimals={2}
              icon={Coins}
            />
            <StatCard
              title="Collateral Value (USD)"
              value={stats.collateralValueUsd}
              prefix="$"
              decimals={2}
              icon={TrendingUp}
            />
            <StatCard
              title="Average LTV"
              value={stats.averageLtv}
              suffix="%"
              decimals={1}
              icon={Activity}
            />
          </div>
        </div>

        {/* Stats Overview - Row 3: Borrowing Stats */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Borrowing Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Borrowed USDC"
              value={stats.totalBorrowedUsdc}
              prefix="$"
              decimals={2}
              icon={DollarSign}
            />
            <StatCard
              title="Loans at Risk"
              value={stats.loansAtRisk}
              icon={AlertTriangle}
              className={stats.loansAtRisk > 0 ? "border-orange-500/50" : ""}
            />
            <StatCard
              title="Platform Health"
              value={stats.activeLoans > 0 ? ((stats.activeLoans - stats.loansAtRisk) / stats.activeLoans) * 100 : 100}
              suffix="%"
              decimals={1}
              icon={Shield}
            />
            <StatCard
              title="Active Positions"
              value={stats.activeLoans}
              icon={Activity}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-legasi-card border-border">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  List of all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">
                          {user.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <RiskBadge
                            status={user.role === "admin" ? "verified" : "active"}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans">
            <Card className="bg-legasi-card border-border">
              <CardHeader>
                <CardTitle>Loan Management</CardTitle>
                <CardDescription>
                  All active loans on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Collateral</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>LTV</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-xs">
                          {loan.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="uppercase">{loan.collateral_type}</TableCell>
                        <TableCell>{loan.collateral_amount.toFixed(4)}</TableCell>
                        <TableCell>${loan.borrowed_usdc.toLocaleString()} USDC</TableCell>
                        <TableCell>{loan.ltv_ratio.toFixed(1)}%</TableCell>
                        <TableCell>{loan.health_factor ? loan.health_factor.toFixed(2) : "N/A"}</TableCell>
                        <TableCell>
                          <RiskBadge
                            status={
                              loan.status === "active"
                                ? "active"
                                : loan.status === "closed"
                                ? "closed"
                                : loan.status === "liquidated"
                                ? "critical"
                                : "pending"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <Card className="bg-legasi-card border-border">
              <CardHeader>
                <CardTitle>KYC Verifications</CardTitle>
                <CardDescription>
                  Review and approve KYC submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kycSubmissions.map((kyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell>
                          {kyc.first_name} {kyc.last_name}
                        </TableCell>
                        <TableCell>{kyc.email}</TableCell>
                        <TableCell>
                          <RiskBadge
                            status={
                              kyc.status === "verified"
                                ? "verified"
                                : kyc.status === "rejected"
                                ? "rejected"
                                : "pending"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(kyc.submitted_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedKyc(kyc);
                                setViewerOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {kyc.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveKYC(kyc.id, kyc.user_id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectKYC(kyc.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card className="bg-legasi-card border-border">
              <CardHeader>
                <CardTitle>Solana (SOL) - Maximum LTV</CardTitle>
                <CardDescription>
                  LTV configuration for loans collateralized with SOL (more volatile asset)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ltv-sol-slider" className="text-base font-semibold">
                      Maximum LTV: {maxLtvSol}%
                    </Label>
                    <span className="text-2xl font-bold text-legasi-orange">
                      {maxLtvSol}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      id="ltv-sol-slider"
                      type="range"
                      min="10"
                      max="70"
                      step="5"
                      value={maxLtvSol}
                      onChange={(e) => setMaxLtvSol(parseInt(e.target.value))}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-legasi-orange"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10%</span>
                      <span>40%</span>
                      <span>70%</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-500">
                        Volatility Warning
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SOL is more volatile. Lower LTV reduces liquidation risk.
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleUpdateLtvConfig("SOL")}
                    className="w-full"
                  >
                    Update SOL LTV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-legasi-card border-border">
              <CardHeader>
                <CardTitle>USDC - Maximum LTV</CardTitle>
                <CardDescription>
                  LTV configuration for loans collateralized with USDC (stablecoin)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ltv-usdc-slider" className="text-base font-semibold">
                      Maximum LTV: {maxLtvUsdc}%
                    </Label>
                    <span className="text-2xl font-bold text-legasi-orange">
                      {maxLtvUsdc}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      id="ltv-usdc-slider"
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={maxLtvUsdc}
                      onChange={(e) => setMaxLtvUsdc(parseInt(e.target.value))}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-legasi-orange"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10%</span>
                      <span>50%</span>
                      <span>90%</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-500">
                        Stable Asset
                      </p>
                      <p className="text-xs text-muted-foreground">
                        USDC is pegged to USD. Higher LTV is safer for stablecoins.
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleUpdateLtvConfig("USDC")}
                    className="w-full"
                  >
                    Update USDC LTV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-legasi-card border-border">
              <CardHeader>
                <CardTitle>Annual Interest Rate (APY)</CardTitle>
                <CardDescription>
                  Interest rate applied to all new loans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="interest-rate-slider" className="text-base font-semibold">
                      Current APY: {interestRate}%
                    </Label>
                    <span className="text-2xl font-bold text-legasi-orange">
                      {interestRate}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      id="interest-rate-slider"
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-legasi-orange"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>7.5%</span>
                      <span>15%</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-500">
                        Competitive Rate
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This interest rate applies to all newly created loans. Existing loans keep their original rate.
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpdateInterestRate}
                    className="w-full"
                  >
                    Update Interest Rate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* KYC Document Viewer Modal */}
        {selectedKyc && (
          <KYCDocumentViewer
            kycSubmission={selectedKyc}
            open={viewerOpen}
            onClose={() => {
              setViewerOpen(false);
              setSelectedKyc(null);
            }}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
