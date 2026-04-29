import * as React from "react";

type ButtonVariant = "default" | "ghost" | "outline";
type ButtonSize = "default" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "btn-primary shadow-[4px_4px_0_var(--fg)] hover:shadow-none hover:-translate-x-[2px] hover:-translate-y-[2px]",
  ghost: "text-[var(--fg-muted)] hover:text-[var(--fg)] h-10 px-4 py-2",
  outline: "border-2 border-[var(--fg)] bg-transparent hover:bg-[var(--fg)] hover:text-[var(--bg)]",
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
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-black font-mono tracking-[0.1em] uppercase transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)] disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
