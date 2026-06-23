"use client";
import { motion } from "framer-motion";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", className = "", style = {} }: SkeletonProps) {
  return (
    <motion.div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)",
        backgroundSize: "200% 100%",
        ...style
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    />
  );
}
