import React from "react";
import { NoiseBackground } from "./noise-background";
import { cn } from "../lib/utils";

interface NoiseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  href?: string;
  children: React.ReactNode;
}

export const NoiseButton = React.forwardRef<
  HTMLButtonElement,
  NoiseButtonProps
>(({ className, children, as: Component = "button", ...props }, ref) => {
  return (
    <NoiseBackground
      containerClassName="w-fit p-[2px] rounded-full"
      gradientColors={[
        "rgba(16, 185, 129, 0.4)", // emerald
        "rgba(52, 211, 153, 0.4)",
        "rgba(5, 150, 105, 0.4)",
      ]}
    >
      <Component
        ref={ref as any}
        className={cn(
          "flex items-center justify-center gap-2 h-full w-full cursor-pointer rounded-full",
          "bg-linear-to-r from-neutral-100 via-neutral-100 to-white px-4 py-2 text-black",
          "shadow-[0px_2px_0px_0px_var(--color-neutral-50)_inset,0px_0.5px_1px_0px_var(--color-neutral-400)]",
          "transition-all duration-100 active:scale-98",
          "dark:from-black dark:via-black dark:to-neutral-900 dark:text-white",
          "dark:shadow-[0px_1px_0px_0px_var(--color-neutral-950)_inset,0px_1px_0px_0px_var(--color-neutral-800)]",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    </NoiseBackground>
  );
});
NoiseButton.displayName = "NoiseButton";
