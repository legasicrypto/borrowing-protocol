import { GlowButton } from "@/components/ui/GlowButton";
import { OutlineButton } from "@/components/ui/OutlineButton";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import legasiLogo from "@/assets/legasi-logo.png";

export function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-legasi-dark/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={legasiLogo} 
              alt="Legasi" 
              className="h-10 cursor-pointer" 
              onClick={() => navigate("/")}
            />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#simulator" className="text-muted-foreground hover:text-legasi-orange transition-colors">
              Simulator
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-legasi-orange transition-colors">
              How it Works
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <GlowButton onClick={() => navigate("/dashboard")}>
                Dashboard
              </GlowButton>
            ) : (
              <>
                <OutlineButton
                  className="hidden sm:inline-flex"
                  onClick={() => navigate("/auth?mode=login")}
                >
                  Login
                </OutlineButton>
                <GlowButton onClick={() => navigate("/auth?mode=signup")}>
                  Sign Up
                </GlowButton>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
