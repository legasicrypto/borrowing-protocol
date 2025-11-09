import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowButton } from "@/components/ui/GlowButton";
import { OutlineButton } from "@/components/ui/OutlineButton";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, Upload, Camera, Loader2 } from "lucide-react";

const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
});

const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
});

type KYCStep = 1 | 2 | 3 | 4 | 5;

export default function KYC() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<KYCStep>(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPhantomUser, setIsPhantomUser] = useState(false);

  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
  });

  // Step 2: Address
  const [address, setAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });

  // Step 3: Documents
  const [documents, setDocuments] = useState({
    idDocument: null as File | null,
    proofAddress: null as File | null,
    selfie: null as File | null,
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        
        // Détecter si connexion Phantom
        const walletAddress = session.user.user_metadata?.wallet_address;
        const isPhantom = !!walletAddress;
        setIsPhantomUser(isPhantom);
        
        // Si Phantom, ne pas pré-remplir l'email
        if (isPhantom) {
          setPersonalInfo(prev => ({ ...prev, email: "" }));
        } else {
          setPersonalInfo(prev => ({ ...prev, email: session.user.email || "" }));
        }
      }
    });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Logout error:", error.message);
      }
      toast.success("Logged out successfully");
      localStorage.removeItem('supabase.auth.token');
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.success("Logged out");
      navigate("/");
    }
  };

  const validateStep = (step: KYCStep): boolean => {
    try {
      if (step === 1) {
        personalInfoSchema.parse(personalInfo);
      } else if (step === 2) {
        addressSchema.parse(address);
      } else if (step === 3) {
        if (!documents.idDocument || !documents.proofAddress || !documents.selfie) {
          toast.error("Please upload all required documents");
          return false;
        }
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        handleDocumentUpload();
      } else if (currentStep === 4) {
        handleWalletVerification();
      } else {
        setCurrentStep((prev) => (prev + 1) as KYCStep);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as KYCStep);
    }
  };

  const handleDocumentUpload = async () => {
    if (!userId) return;
    
    setLoading(true);
    toast.info("Uploading documents...");

    try {
      const uploadPromises = [];
      const urls: { id_document_url?: string; proof_address_url?: string; selfie_url?: string } = {};

      // Upload ID Document
      if (documents.idDocument) {
        const idPath = `${userId}/id-document-${Date.now()}.${documents.idDocument.name.split('.').pop()}`;
        uploadPromises.push(
          supabase.storage
            .from("kyc-documents")
            .upload(idPath, documents.idDocument, {
              cacheControl: "3600",
              upsert: false,
            })
            .then((result) => {
              if (result.error) throw result.error;
              urls.id_document_url = idPath;
            })
        );
      }

      // Upload Proof of Address
      if (documents.proofAddress) {
        const proofPath = `${userId}/proof-address-${Date.now()}.${documents.proofAddress.name.split('.').pop()}`;
        uploadPromises.push(
          supabase.storage
            .from("kyc-documents")
            .upload(proofPath, documents.proofAddress, {
              cacheControl: "3600",
              upsert: false,
            })
            .then((result) => {
              if (result.error) throw result.error;
              urls.proof_address_url = proofPath;
            })
        );
      }

      // Upload Selfie
      if (documents.selfie) {
        const selfiePath = `${userId}/selfie-${Date.now()}.${documents.selfie.name.split('.').pop()}`;
        uploadPromises.push(
          supabase.storage
            .from("kyc-documents")
            .upload(selfiePath, documents.selfie, {
              cacheControl: "3600",
              upsert: false,
            })
            .then((result) => {
              if (result.error) throw result.error;
              urls.selfie_url = selfiePath;
            })
        );
      }

      await Promise.all(uploadPromises);

      // Store URLs temporarily for submission
      setDocuments((prev) => ({ ...prev, uploadedUrls: urls } as any));

      toast.success("Documents uploaded successfully!");
      setCurrentStep(4);
      setLoading(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading documents");
      setLoading(false);
    }
  };

  const handleWalletVerification = async () => {
    setLoading(true);
    toast.info("Verifying wallet ownership...");

    try {
      // Si utilisateur Phantom → vraie vérification
      if (isPhantomUser) {
        const provider = (window as any).phantom?.solana;
        
        if (!provider?.isPhantom) {
          toast.error("Phantom Wallet not detected!");
          setLoading(false);
          return;
        }

        // Récupérer l'adresse du wallet depuis le profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("wallet_address")
          .eq("id", userId!)
          .single();

        if (profileError || !profileData?.wallet_address) {
          toast.error("Wallet address not found");
          setLoading(false);
          return;
        }

        const storedWalletAddress = profileData.wallet_address;

        // Créer un message à signer
        const message = `Verify wallet ownership for KYC\n\nWallet: ${storedWalletAddress}\nTimestamp: ${Date.now()}`;
        const encodedMessage = new TextEncoder().encode(message);

        // Demander la signature
        const { signature, publicKey } = await provider.signMessage(encodedMessage, "utf8");
        const currentWalletAddress = publicKey.toString();

        // Vérifier que l'adresse correspond
        if (currentWalletAddress !== storedWalletAddress) {
          toast.error("Wallet address mismatch! Please use the same wallet used for login.");
          setLoading(false);
          return;
        }

        // Mettre à jour le profil avec wallet_verified: true
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ wallet_verified: true })
          .eq("id", userId!);

        if (updateError) {
          console.error("Profile update error:", updateError);
          toast.error("Failed to verify wallet");
          setLoading(false);
          return;
        }

        toast.success("Wallet verified!");
        setCurrentStep(5);
        handleAutoValidation();
        setLoading(false);
      } else {
        // Si utilisateur email/password → simulation (5 secondes)
        setTimeout(() => {
          toast.success("Wallet verified!");
          setCurrentStep(5);
          handleAutoValidation();
          setLoading(false);
        }, 5000);
      }
    } catch (error: any) {
      console.error("Wallet verification error:", error);
      
      if (error.code === 4001 || error.message?.includes("User rejected")) {
        toast.error("Verification rejected by user");
      } else {
        toast.error(error.message || "Failed to verify wallet");
      }
      
      setLoading(false);
    }
  };

  const handleAutoValidation = async () => {
    setLoading(true);
    toast.info("Verifying your information...");

    try {
      const uploadedUrls = (documents as any).uploadedUrls || {};
      
      // Generate IBAN (Banking Circle format: DE89370400440 + 16 random digits)
      const randomSuffix = Math.floor(Math.random() * 10000000000000000).toString().padStart(16, '0');
      const generatedIban = `DE89370400440${randomSuffix}`;
      
      // Submit KYC with auto-approval
      const { error: kycError } = await supabase.from("kyc_submissions").insert({
        user_id: userId!,
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: personalInfo.email,
        date_of_birth: personalInfo.dateOfBirth,
        street: address.street,
        city: address.city,
        postal_code: address.postalCode,
        country: address.country,
        id_document_url: uploadedUrls.id_document_url,
        proof_address_url: uploadedUrls.proof_address_url,
        selfie_url: uploadedUrls.selfie_url,
        status: "approved",
        iban_generated: true,
      });

      if (kycError) throw kycError;

      // Upsert profile to ensure it exists, then update kyc_status
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { 
            id: userId!,
            kyc_status: "approved",
            first_name: personalInfo.firstName,
            last_name: personalInfo.lastName,
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      // Create bank account with generated IBAN
      const { error: bankError } = await supabase
        .from("user_bank_accounts")
        .insert({
          user_id: userId!,
          iban_legasi: generatedIban,
          eur_balance: 0,
          usd_balance: 0,
        });

      if (bankError) throw bankError;

      // Auto-validation completed (2 second delay for UX)
      setTimeout(() => {
        setLoading(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success("KYC Approved! 🎉", {
          description: "Your account is now fully activated",
          duration: 5000,
        });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2500);
      }, 2000);
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error("KYC submission failed. Please try again.");
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={personalInfo.firstName}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, firstName: e.target.value })
                  }
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={personalInfo.lastName}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, lastName: e.target.value })
                  }
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, email: e.target.value })
                    }
                    placeholder={isPhantomUser ? "Enter your email address" : "john@example.com"}
                    required
                    disabled={!isPhantomUser}
                  />
                  {isPhantomUser && (
                    <p className="text-xs text-muted-foreground">
                      Please provide a valid email address for your account
                    </p>
                  )}
                </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={personalInfo.dateOfBirth}
                onChange={(e) =>
                  setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })
                }
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="123 Main St"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="New York"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={address.postalCode}
                  onChange={(e) =>
                    setAddress({ ...address, postalCode: e.target.value })
                  }
                  placeholder="10001"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                placeholder="United States"
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>ID Card / Passport</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-legasi-orange/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setDocuments({ ...documents, idDocument: e.target.files?.[0] || null })
                  }
                  className="hidden"
                  id="idDocument"
                />
                <label htmlFor="idDocument" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {documents.idDocument
                      ? documents.idDocument.name
                      : "Click to upload (Max 5MB)"}
                  </p>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Proof of Address</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-legasi-orange/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setDocuments({ ...documents, proofAddress: e.target.files?.[0] || null })
                  }
                  className="hidden"
                  id="proofAddress"
                />
                <label htmlFor="proofAddress" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {documents.proofAddress
                      ? documents.proofAddress.name
                      : "Utility bill or bank statement"}
                  </p>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Selfie</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-legasi-orange/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) =>
                    setDocuments({ ...documents, selfie: e.target.files?.[0] || null })
                  }
                  className="hidden"
                  id="selfie"
                />
                <label htmlFor="selfie" className="cursor-pointer">
                  <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {documents.selfie ? documents.selfie.name : "Take a selfie"}
                  </p>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6 py-8">
            {loading ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto animate-spin text-legasi-orange" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Verifying Wallet...</h3>
                  <p className="text-sm text-muted-foreground">
                    Please confirm the transaction in your wallet
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto text-legasi-green" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Wallet Connected</h3>
                  <p className="text-sm text-muted-foreground">
                    7xKXtg2rCfVmXy9uTpq...
                  </p>
                </div>
              </>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6 py-8">
            {loading ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto animate-spin text-legasi-orange" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Verifying your information...
                  </h3>
                  <p className="text-sm text-muted-foreground">This will only take a moment</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-20 h-20 mx-auto text-legasi-green" />
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-legasi-green">
                    KYC Approved! 🎉
                  </h3>
                  <p className="text-muted-foreground">
                    Your account is fully activated
                  </p>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    "Personal Information",
    "Address",
    "Document Upload",
    "Wallet Verification",
    "Validation",
  ];

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-legasi-dark flex flex-col">
      <DashboardHeader
        title="KYC Verification"
        showHomeButton={true}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
        <Card className="bg-legasi-card border-2 border-legasi-orange/30">
          <CardHeader>
            <CardTitle className="text-2xl">KYC Verification</CardTitle>
            <CardDescription>
              Step {currentStep} of 5: {stepTitles[currentStep - 1]}
            </CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStepContent()}

            <div className="flex gap-4">
              {currentStep > 1 && currentStep < 5 && (
                <OutlineButton onClick={prevStep} disabled={loading} className="flex-1">
                  Back
                </OutlineButton>
              )}
              
              {currentStep < 5 && (
                <GlowButton
                  onClick={nextStep}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : currentStep === 4 ? (
                    "Verify Wallet"
                  ) : (
                    "Continue"
                  )}
                </GlowButton>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
}
