"use client";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";
import Link from "next/link";

interface GlowingCardProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  delay?: number;
}

export default function GlowingCard({ children, href, className = "", delay = 0 }: GlowingCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const Wrapper = href ? Link : "div";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{ display: "block", textDecoration: "none" }}
    >
      <Wrapper
        href={href as string}
        className={`group relative flex w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1c] ${className}`}
        onMouseMove={handleMouseMove}
        style={{ display: "block", textDecoration: "none" }}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                350px circle at ${mouseX}px ${mouseY}px,
                rgba(201, 162, 39, 0.15),
                transparent 80%
              )
            `,
          }}
        />
        <div className="relative z-10 w-full h-full p-4 transition duration-300 group-hover:bg-white/5">
          {children}
        </div>
      </Wrapper>
    </motion.div>
  );
}
