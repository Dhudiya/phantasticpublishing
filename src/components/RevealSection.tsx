import React from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

type Direction = "up" | "left" | "right" | "none";

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  threshold?: number;
}

const directionStyles: Record<Direction, string> = {
  up: "translate-y-8",
  left: "-translate-x-8",
  right: "translate-x-8",
  none: "",
};

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
  threshold = 0.12,
}: RevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>(threshold);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directionStyles[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
