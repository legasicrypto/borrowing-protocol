import { Button } from "@/components/ui/button";
import { Home, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import legasiLogo from "@/assets/legasi-logo.png";

interface DashboardHeaderProps {
  title?: string;
  showHomeButton?: boolean;
  showDashboardButton?: boolean;
  showAdminButton?: boolean;
  onLogout: () => void;
  rightContent?: React.ReactNode;
}

export function DashboardHeader({
  title,
  showHomeButton = false,
  showDashboardButton = false,
  showAdminButton = false,
  onLogout,
  rightContent,
}: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-border bg-legasi-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <img 
            src={legasiLogo} 
            alt="Legasi" 
            className="h-10 cursor-pointer" 
            onClick={() => navigate("/")}
          />
          {title && (
            <h1 className="text-2xl font-bold">
              {title}
            </h1>
          )}
          <div className="flex items-center gap-2">
            {showHomeButton && (
              <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            )}
            {showDashboardButton && (
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
                <Shield className="h-4 w-4" />
                My Dashboard
              </Button>
            )}
            {showAdminButton && (
              <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {rightContent}
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
