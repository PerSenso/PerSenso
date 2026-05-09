"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface Particle {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  delay: number;
}

interface SplashProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

const COLORS = [
  "hsl(25 55% 45%)",
  "hsl(185 30% 30%)",
  "hsl(30 20% 96%)",
  "hsl(25 45% 60%)",
];

export const PerfumeSplash = ({ startX, startY, onComplete }: SplashProps) => {
  const isMobile = useIsMobile();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const cartIcon = document.getElementById("cart-icon");
    if (!cartIcon) {
      onComplete();
      return;
    }

    const rect = cartIcon.getBoundingClientRect();
    const endX = rect.left + rect.width / 2;
    const endY = rect.top + rect.height / 2;

    const newParticles: Particle[] = Array.from({ length: 15 }).map((_, i) => {
      const sX = startX + (Math.random() - 0.5) * 20;
      const sY = startY + (Math.random() - 0.5) * 20;
      const midX = sX + (Math.random() - 0.5) * 120;
      const midY = sY - 60 - Math.random() * 80;
      return {
        id: i,
        startX: sX,
        startY: sY,
        midX,
        midY,
        endX,
        endY,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 5 + 3,
        delay: Math.random() * 0.15,
      };
    });

    setParticles(newParticles);

    const duration = isMobile ? 500 : 800;
    const timer = setTimeout(() => onComplete(), duration + 200);
    return () => clearTimeout(timer);
  }, [startX, startY, isMobile, onComplete]);

  if (particles.length === 0) return null;

  const durationSec = isMobile ? 0.5 : 0.8;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.startX, y: p.startY, scale: 0, opacity: 1 }}
          animate={{
            x: [p.startX, p.midX, p.endX],
            y: [p.startY, p.midY, p.endY],
            scale: [0, 1.2, 1, 0.2],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: durationSec,
            delay: p.delay,
            ease: "easeInOut",
            times: [0, 0.3, 0.8, 1],
          }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>,
    document.body
  );
};
