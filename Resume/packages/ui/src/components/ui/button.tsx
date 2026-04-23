import * as React from "react";

type ButtonVariant = "default" | "ghost" | "outline";
type ButtonSize = "default" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "border border-white/10 bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.08)] hover:bg-zinc-100 hover:shadow-[0_18px_42px_rgba(255,255,255,0.14)]",
  ghost: "text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-white",
  outline:
    "border border-white/[0.09] bg-white/[0.035] text-white backdrop-blur-xl hover:border-white/18 hover:bg-white/[0.07]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:translate-y-px active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
