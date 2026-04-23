"use client";
import { cn } from "../lib/utils";
import { useEffect, useState } from "react";

interface Meteor {
  id: number;
  top: string;
  left: string;
  animationDelay: string;
  animationDuration: string;
  width: string;
}

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteorStyles, setMeteorStyles] = useState<Meteor[]>([]);

  useEffect(() => {
    const styles: Meteor[] = Array.from({ length: number }, (_, i) => ({
      id: i,
      top: `${Math.floor(Math.random() * 100)}%`,
      left: `${Math.floor(Math.random() * 100)}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${Math.floor(Math.random() * 8) + 4}s`,
      width: `${Math.floor(Math.random() * 80) + 40}px`,
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <>
      {meteorStyles.map((style) => (
        <span
          key={style.id}
          className={cn(
            "animate-meteor absolute top-1/2 left-1/2 h-0.5 rotate-[215deg] rounded-full bg-zinc-400 shadow-[0_0_0_1px_#ffffff10]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-1/2 before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-zinc-400 before:to-transparent",
            className,
          )}
          style={{
            top: style.top,
            left: style.left,
            animationDelay: style.animationDelay,
            animationDuration: style.animationDuration,
            width: style.width,
          }}
        />
      ))}
    </>
  );
};
