import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/layout/HeroSection";
import { LoanSimulator } from "@/components/dashboard/LoanSimulator";
import { HowItWorks } from "@/components/layout/HowItWorks";
import { Footer } from "@/components/layout/Footer";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-legasi-dark">
      <Header />
      <main>
        <HeroSection />
        <LoanSimulator />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
