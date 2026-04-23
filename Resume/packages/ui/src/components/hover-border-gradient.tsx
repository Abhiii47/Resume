"use client";
import React from "react";
import { cn } from "../lib/utils";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full border content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit",
        containerClassName,
      )}
      {...props}
    >
      <div
        className={cn(
          "w-auto z-10 bg-black px-4 py-2 rounded-[inherit]",
          className,
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[inherit]",
          "before:absolute before:inset-0",
          "before:rounded-[inherit]",
        )}
        style={{
          background: hovered
            ? `conic-gradient(from 0deg, #ffffff, #a1a1aa, #ffffff, transparent, transparent)`
            : "transparent",
          transition: `background ${duration}s ease`,
        }}
      />
    </Tag>
  );
}
