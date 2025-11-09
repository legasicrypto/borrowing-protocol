import * as React from "react";
import { cn } from "@/lib/utils";

export interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const OutlineButton = React.forwardRef<HTMLButtonElement, OutlineButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium",
          "border-2 border-legasi-orange/30 text-legasi-orange bg-transparent",
          "hover:bg-legasi-orange/10 hover:border-legasi-orange transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

OutlineButton.displayName = "OutlineButton";

export { OutlineButton };
