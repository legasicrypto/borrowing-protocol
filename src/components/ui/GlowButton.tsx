import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold text-white bg-legasi-orange transition-all duration-300",
          "hover:shadow-[0_0_30px_rgba(255,87,34,0.5)] hover:scale-105",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlowButton.displayName = "GlowButton";

export { GlowButton };
