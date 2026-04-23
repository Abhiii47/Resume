"use client";
import { cn } from "../lib/utils";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
}

export const ShootingStars = ({
  minSpeed = 10,
  maxSpeed = 30,
  minDelay = 1200,
  maxDelay = 4200,
  starColor = "#9E00FF",
  trailColor = "#2EB9DF",
  starWidth = 10,
  starHeight = 1,
  className,
}: {
  minSpeed?: number;
  maxSpeed?: number;
  minDelay?: number;
  maxDelay?: number;
  starColor?: string;
  trailColor?: string;
  starWidth?: number;
  starHeight?: number;
  className?: string;
}) => {
  const [star, setStar] = useState<Star | null>(null);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSvgSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const createStar = () => {
      const newStar: Star = {
        id: Date.now(),
        x: Math.random() * svgSize.width,
        y: 0,
        angle: 215,
        scale: 1,
        speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
        distance: 0,
      };
      setStar(newStar);
      const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      setTimeout(createStar, randomDelay);
    };
    if (svgSize.width > 0) createStar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgSize.width]);

  useEffect(() => {
    if (!star) return;
    let animFrame: number;
    const animate = () => {
      setStar((prev) => {
        if (!prev) return null;
        const newX =
          prev.x + prev.speed * Math.cos((prev.angle * Math.PI) / 180);
        const newY =
          prev.y + prev.speed * Math.sin((prev.angle * Math.PI) / 180);
        const newDist = prev.distance + prev.speed;
        const newScale = 1 + newDist / 100;
        if (
          newX < -20 ||
          newX > svgSize.width + 20 ||
          newY < -20 ||
          newY > svgSize.height + 20
        ) {
          return null;
        }
        return {
          ...prev,
          x: newX,
          y: newY,
          distance: newDist,
          scale: newScale,
        };
      });
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [star, svgSize]);

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    >
      {star && (
        <rect
          x={star.x}
          y={star.y}
          width={starWidth * star.scale}
          height={starHeight}
          fill={`url(#gradient-${star.id})`}
          transform={`rotate(${star.angle}, ${star.x + (starWidth * star.scale) / 2}, ${star.y + starHeight / 2})`}
        />
      )}
      <defs>
        {star && (
          <linearGradient
            id={`gradient-${star.id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={trailColor} stopOpacity="0" />
            <stop offset="100%" stopColor={starColor} stopOpacity="1" />
          </linearGradient>
        )}
      </defs>
    </svg>
  );
};

export const StarsBackground = ({
  starDensity = 0.0001,
  allStarsDim = false,
  className,
}: {
  starDensity?: number;
  allStarsDim?: boolean;
  className?: string;
}) => {
  const [stars, setStars] = useState<
    { x: number; y: number; opacity: number; radius: number }[]
  >([]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (size.width === 0) return;
    const count = Math.floor(size.width * size.height * starDensity);
    setStars(
      Array.from({ length: count }, () => ({
        x: Math.random() * size.width,
        y: Math.random() * size.height,
        opacity: allStarsDim ? 0.3 : Math.random() * 0.7 + 0.1,
        radius: Math.random() * 0.05 + 0.05,
      })),
    );
  }, [size, starDensity, allStarsDim]);

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.radius}
          fill="white"
          opacity={s.opacity}
        />
      ))}
    </svg>
  );
};
