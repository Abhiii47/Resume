"use client";
import { cn } from "../lib/utils";
import { useEffect, useState } from "react";

export const TypewriterEffect = ({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) => {
  const [displayedText, setDisplayedText] = useState<
    { text: string; className?: string }[]
  >([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting] = useState(false);

  useEffect(() => {
    if (wordIndex >= words.length) return;

    const current = words[wordIndex];
    if (!current) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < current.text.length) {
            setDisplayedText((prev) => {
              const clone = [...prev];
              if (clone.length <= wordIndex) {
                clone.push({
                  text: current.text[charIndex] || "",
                  className: current.className,
                });
              } else {
                clone[wordIndex] = {
                  text: current.text.slice(0, charIndex + 1),
                  className: current.className,
                };
              }
              return clone;
            });
            setCharIndex((c) => c + 1);
          } else if (wordIndex < words.length - 1) {
            setTimeout(() => {
              setWordIndex((w) => w + 1);
              setCharIndex(0);
            }, 500);
          }
        }
      },
      isDeleting ? 50 : 80,
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, wordIndex, words]);

  return (
    <div
      className={cn("inline-flex items-center flex-wrap gap-x-2", className)}
    >
      {words.map((word, i) => (
        <span key={i} className={word.className}>
          {displayedText[i]?.text || (i < wordIndex ? word.text : "")}&nbsp;
        </span>
      ))}
      <span
        className={cn(
          "inline-block h-[1em] w-[2px] rounded-full bg-emerald-400 animate-pulse",
          cursorClassName,
        )}
      />
    </div>
  );
};

export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}: {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}) => {
  return (
    <div className={cn("flex items-center flex-wrap gap-x-1.5", className)}>
      {words.map((word, i) => (
        <div key={i} className="overflow-hidden">
          <div
            className={cn(
              "inline-block animate-[slideUp_0.8s_ease_forwards]",
              word.className,
            )}
            style={{ animationDelay: `${i * 0.2}s`, opacity: 0 }}
          >
            {word.text}&nbsp;
          </div>
        </div>
      ))}
      <span
        className={cn(
          "inline-block h-4 w-[2px] rounded-full bg-emerald-400 animate-pulse ml-1",
          cursorClassName,
        )}
      />
    </div>
  );
};
