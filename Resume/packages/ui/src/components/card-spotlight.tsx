"use client";
import { useMotionValue, useSpring, motion } from "framer-motion";
import React, { useRef, useState } from "react";
import { cn } from "../lib/utils";

export const CardSpotlight = ({
  children,
  radius = 350,
  color = "#262626",
  className,
  ...props
}: {
  radius?: number;
  color?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          background: useSpringBackground(springX, springY, radius, color),
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

function useSpringBackground(
  x: ReturnType<typeof useSpring>,
  y: ReturnType<typeof useSpring>,
  radius: number,
  color: string,
) {
  const [bg, setBg] = React.useState("");
  React.useEffect(() => {
    const unsubX = x.on("change", (xVal) => {
      const yVal = y.get();
      setBg(
        `radial-gradient(${radius}px circle at ${xVal}px ${yVal}px, ${color}, transparent 100%)`,
      );
    });
    const unsubY = y.on("change", (yVal) => {
      const xVal = x.get();
      setBg(
        `radial-gradient(${radius}px circle at ${xVal}px ${yVal}px, ${color}, transparent 100%)`,
      );
    });
    return () => {
      unsubX();
      unsubY();
    };
  }, [x, y, radius, color]);
  return bg;
}
